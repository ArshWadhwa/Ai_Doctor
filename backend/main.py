from fastapi import FastAPI, Form, UploadFile, File, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import sys
import uuid
import tempfile
import logging
from pathlib import Path
from typing import List, Dict
import httpx
import json
import requests
from datetime import datetime
import re
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Security & Validation Constants
MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024   # 15 MB
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024   # 10 MB
MAX_TEXT_INPUT_LENGTH = 4000              # Max chars for medical description/TTS
MAX_CHAT_MESSAGE_LENGTH = 1000            # Max chars for health assistant queries
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

def is_valid_uuid(val: str) -> bool:
    """Validate string as a standard UUID (v4/v1)"""
    if not val or not isinstance(val, str):
        return False
    return bool(re.match(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$', val.strip()))

# Setup audio directory for generated speech
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "temp_audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def cleanup_old_audio_files(max_age_seconds: int = 1800):
    """Clean up temporary audio files older than max_age_seconds (default 30 min)"""
    try:
        now = datetime.now().timestamp()
        for f in os.listdir(AUDIO_DIR):
            file_path = os.path.join(AUDIO_DIR, f)
            if os.path.isfile(file_path) and (now - os.path.getmtime(file_path)) > max_age_seconds:
                try:
                    os.remove(file_path)
                except Exception:
                    pass
    except Exception as e:
        logger.debug(f"Audio cleanup warning: {e}")

# Import existing modules
from brain_of_doc import encode_image, analyze_image_with_query, analyze_text_only
from voice_of_patient import transcribe_with_groq
from voice_of_doctor import text_to_speech_elevenLabs

app = FastAPI(title="Medly - AI Medical Doctor API")

# -------------------------
# Supabase Setup
# -------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

supabase = None
supabase_initialized = False

if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL != "your_supabase_url":
    try:
        # Remove proxy-related environment variables that might interfere
        proxy_vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']
        for var in proxy_vars:
            if var in os.environ:
                del os.environ[var]
        
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase_initialized = True
        logger.info("Supabase client initialized successfully")
    except Exception as init_err:
        logger.warning(f"Supabase client initialization failed: {init_err}")
        supabase = None
        supabase_initialized = False
else:
    logger.info("Supabase credentials not configured in environment")

# -------------------------
# OpenRouter Setup  
# -------------------------
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "inclusionai/ling-3.0-flash-vl:free")

# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://aimedicaldoc.netlify.app").split(",")

# Strip whitespace and filter empty strings
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]

# Add additional fallback origins for production
additional_origins = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "https://aimedicaldoc.netlify.app",
    "https://ai-doctor-tq5i.onrender.com"
]

# Merge and deduplicate origins
all_origins = list(set(ALLOWED_ORIGINS + additional_origins))

print(f"Environment ALLOWED_ORIGINS: {os.getenv('ALLOWED_ORIGINS')}")
print(f"Final allowed CORS origins: {all_origins}")

# Configure CORS with broader permissions for production debugging
app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_medical_text(text: str) -> str:
    """Strip all asterisks (* or **) and markdown bold markers from text output"""
    if not text:
        return ""
    return text.replace("**", "").replace("*", "").strip()

system_prompt = """
You are acting as a professional doctor for educational purposes only. This is not a substitute for real medical advice, and you must remind the patient to consult a certified healthcare provider for confirmation and treatment. 
Your task is to carefully analyze the provided medical image along with the patient’s reported symptoms. Blend both sources of information to form a considerate clinical impression that feels natural, empathetic, and professional. Do not describe findings as “In the image I see” but instead use patient-centered language such as “From what you have described and what appears to be present, I think you may be experiencing…”. Keep your response concise but warm, ideally two to three sentences, while ensuring it feels supportive and clinically useful. 
After offering your impression, you may briefly suggest general self-care measures where suitable — such as rest, hydration, gentle diet adjustments, or over-the-counter relief — provided you emphasize that these are temporary measures and not a replacement for medical evaluation. Conclude by including the most relevant ICD-10 code for the suspected condition at the end in parentheses. If you are uncertain, you may mention a few possible conditions with their ICD-10 codes and encourage the patient to follow up promptly with a qualified doctor. 
CRITICAL FORMATTING REQUIREMENT: Absolutely NEVER use asterisks (* or **) or markdown bold formatting anywhere in your response. Write purely in clean, smooth plain text sentences.
Here is a medical image and a patient question. Image: [image]. Patient says: [transcribed audio]. Please answer using both sources in a natural and professional manner without any asterisks.
"""

voice_only_prompt = """
You are acting as a professional doctor for educational purposes only. This is not a replacement for real medical advice, and you should kindly remind the patient to consult a certified doctor for confirmation and proper treatment. 

Based on the patient's described symptoms: "[transcribed_symptoms]"

Respond in a clear, conversational, and caring tone as though you are speaking directly to them. Keep your impression short and warm, ideally two to three sentences, but ensure it conveys clinical value. 

You may gently suggest general wellness measures such as rest, hydration, light nutrition, or basic home remedies if appropriate, while emphasizing that these are only supportive options and not definitive care. 

If you identify a likely condition, explain it briefly and provide the most relevant ICD-10 code at the end in parentheses. If you are not completely certain, offer a few possible conditions with their ICD-10 codes and always advise the patient to arrange a follow-up consultation with a qualified healthcare provider.

CRITICAL FORMATTING REQUIREMENT: Absolutely NEVER use asterisks (* or **) or markdown bold formatting anywhere in your response. Do not bold text or diagnosis names with asterisks. Write purely in clean, smooth plain text sentences.
"""

# -------------------------
# Prompts and System Configuration
# -------------------------


@app.get("/")
async def root():
    """Root status endpoint"""
    return {
        "status": "online",
        "service": "Medly Health AI API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring and uptime probes"""
    return {
        "status": "healthy",
        "service": "Medly Health AI API",
        "version": "1.0.0",
        "database": "connected" if supabase_initialized else "disconnected",
        "ai_engine": "operational" if bool(OPENROUTER_API_KEY) else "unconfigured",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/transcribe-audio")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe audio to text using Groq API with size validation"""
    temp_audio_path = None
    try:
        content = await audio.read()
        if len(content) > MAX_AUDIO_SIZE_BYTES:
            raise HTTPException(
                status_code=413, 
                detail=f"Audio file exceeds maximum size of {MAX_AUDIO_SIZE_BYTES // (1024 * 1024)}MB"
            )
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
        
        transcription = transcribe_with_groq(
            GROQ_API_KEY=os.environ.get("GROQ_API_KEY"),
            audio_filepath=temp_audio_path,
            stt_model="whisper-large-v3"
        )
        return {"transcription": transcription}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audio transcription error: {e}")
        raise HTTPException(status_code=500, detail="Transcription failed")
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.unlink(temp_audio_path)
            except Exception:
                pass

@app.post("/analyze-image")
async def analyze_image(
    image: UploadFile = File(...),
    transcription: str = ""
):
    """Analyze medical image with optional audio transcription and size limits"""
    temp_image_path = None
    try:
        if not image.content_type or image.content_type.lower() not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid image type. Please upload a JPEG, PNG, or WebP image.")
            
        content = await image.read()
        if len(content) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=413, 
                detail=f"Image file exceeds maximum size of {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)}MB"
            )
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image is empty")

        if transcription and len(transcription) > MAX_TEXT_INPUT_LENGTH:
            transcription = transcription[:MAX_TEXT_INPUT_LENGTH]

        file_ext = ".jpg"
        if "png" in image.content_type.lower():
            file_ext = ".png"
        elif "webp" in image.content_type.lower():
            file_ext = ".webp"

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_image:
            temp_image.write(content)
            temp_image_path = temp_image.name
        
        full_prompt = system_prompt + transcription if transcription else system_prompt
        analysis = analyze_image_with_query(
            full_prompt,
            "meta-llama/llama-4-scout-17b-16e-instruct",
            encode_image(temp_image_path)
        )
        return {"analysis": clean_medical_text(analysis)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")
    finally:
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                os.unlink(temp_image_path)
            except Exception:
                pass

@app.post("/text-to-speech")
async def convert_text_to_speech(text_input: dict):
    """Convert text to speech using ElevenLabs or gTTS fallback with length limits"""
    try:
        text = text_input.get("text", "")
        if not text or not isinstance(text, str):
            raise HTTPException(status_code=400, detail="Text is required")
        
        if len(text) > MAX_TEXT_INPUT_LENGTH:
            text = text[:MAX_TEXT_INPUT_LENGTH]
        
        cleanup_old_audio_files()

        filename = f"tts_{uuid.uuid4().hex[:10]}.mp3"
        output_path = os.path.join(AUDIO_DIR, filename)
        text_to_speech_elevenLabs(input_text=text, output_filepath=output_path)
        
        return FileResponse(
            path=output_path,
            media_type="audio/mpeg",
            filename="doctor_response.mp3"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text-to-speech error: {e}")
        raise HTTPException(status_code=500, detail="TTS generation failed")

@app.post("/medical-consultation")
async def medical_consultation(
    image: UploadFile = File(None),
    audio: UploadFile = File(None),
    text_input: str = Form(None),
    user_id: str = Form(None)
):
    """Complete medical consultation with image, audio, or text"""
    temp_audio_path = None
    temp_image_path = None
    
    # Validate user_id format if provided
    if user_id:
        user_id = user_id.strip()
        if not is_valid_uuid(user_id):
            logger.warning("Unrecognized user_id format; omitting user association")
            user_id = None

    try:
        transcription = ""
        analysis = ""
        
        # ✅ Priority 1: Text input
        if text_input:
            if len(text_input) > MAX_TEXT_INPUT_LENGTH:
                raise HTTPException(status_code=400, detail=f"Text input exceeds maximum limit of {MAX_TEXT_INPUT_LENGTH} characters")
            transcription = text_input.strip()
            logger.info("Text input received for consultation")
        
        # ✅ Priority 2: Audio transcription
        elif audio:
            try:
                audio_content = await audio.read()
                if len(audio_content) > MAX_AUDIO_SIZE_BYTES:
                    raise HTTPException(status_code=413, detail=f"Audio exceeds size limit of {MAX_AUDIO_SIZE_BYTES // (1024 * 1024)}MB")
                if len(audio_content) == 0:
                    raise HTTPException(status_code=400, detail="Uploaded audio file is empty")

                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav", mode='wb') as temp_audio:
                    temp_audio.write(audio_content)
                    temp_audio.flush()
                    temp_audio_path = temp_audio.name
                
                transcription = transcribe_with_groq(
                    GROQ_API_KEY=os.environ.get("GROQ_API_KEY"),
                    audio_filepath=temp_audio_path,
                    stt_model="whisper-large-v3"
                )
                logger.info("Audio transcription completed successfully")
            except HTTPException:
                raise
            except Exception as audio_error:
                logger.error(f"Audio transcription failed: {audio_error}")
                raise HTTPException(status_code=400, detail="Audio transcription failed")
            finally:
                if temp_audio_path and os.path.exists(temp_audio_path):
                    try:
                        os.unlink(temp_audio_path)
                    except Exception:
                        pass
        
        # Handle image analysis if provided
        if image:
            try:
                if not image.content_type or image.content_type.lower() not in ALLOWED_IMAGE_TYPES:
                    raise HTTPException(status_code=400, detail="Invalid image type. Please upload a JPEG, PNG, or WebP image.")
                
                image_content = await image.read()
                if len(image_content) > MAX_IMAGE_SIZE_BYTES:
                    raise HTTPException(status_code=413, detail=f"Image exceeds size limit of {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)}MB")
                if len(image_content) == 0:
                    raise HTTPException(status_code=400, detail="Uploaded image is empty")

                file_ext = ".jpg"
                if "png" in image.content_type.lower():
                    file_ext = ".png"
                elif "webp" in image.content_type.lower():
                    file_ext = ".webp"
                
                with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext, mode='wb') as temp_image:
                    temp_image.write(image_content)
                    temp_image.flush()
                    temp_image_path = temp_image.name
                
                file_size = len(image_content)
                logger.info(f"Analyzing image from: {temp_image_path} (size: {file_size} bytes, type: {image.content_type})")
                
                # Enhanced prompt - more specific about rejection criteria
                medical_context = """

CRITICAL VALIDATION: This AI is designed ONLY for medical image analysis.

REJECT the image ONLY if it clearly shows:
- Cars, vehicles, motorcycles, trucks
- Buildings, houses, architecture  
- Landscapes, scenery, nature (without injuries)
- Food dishes, meals, restaurants
- Electronics, gadgets, computers
- Furniture, household items
- Random objects unrelated to health

ACCEPT the image if it shows:
- Any skin condition (acne, rash, wounds, cuts, bruises, infections, lesions, etc.)
- Body parts with visible symptoms
- Medical equipment or devices being used on a person
- Any injury or health concern on a human body
- Medical scans or test results

If the image is clearly NON-MEDICAL (like the rejection list above), respond with:
"I cannot analyze this image as it does not show any medical condition. Please upload an image of a health concern, injury, or symptom for consultation."

If the image shows ANY medical condition or symptom, provide your analysis normally.
"""
                
                full_prompt = system_prompt + medical_context + (
                    f"\n\nPatient's description: {transcription}" if transcription else ""
                )
                
                # Try to encode the image
                try:
                    encoded_image = encode_image(temp_image_path)
                    if not encoded_image:
                        raise ValueError("Image encoding returned empty result")
                    logger.info(f"✓ Image encoded successfully (base64 length: {len(encoded_image)})")
                except Exception as encode_error:
                    logger.error(f"✗ Image encoding failed: {encode_error}")
                    raise HTTPException(status_code=400, detail=f"Failed to encode image. Please try a different image format: {str(encode_error)}")
                
                # Analyze the image
                analysis = analyze_image_with_query(
                    full_prompt,
                    "meta-llama/llama-4-scout-17b-16e-instruct",
                    encoded_image
                )
                
                logger.info(f"✓ Image analysis received: {analysis[:150]}...")
                
                # Improved non-medical detection - only flag if AI explicitly says it can't analyze
                rejection_phrases = [
                    "cannot analyze this image as it does not show any medical condition",
                    "i cannot analyze this image",
                    "this does not appear to be a medical image",
                    "please upload an image of a health concern"
                ]
                
                analysis_lower = analysis.lower()
                is_rejected = any(phrase in analysis_lower for phrase in rejection_phrases)
                
                # Additional check for obvious non-medical subjects (cars, buildings, etc.)
                obvious_non_medical = [
                    "this appears to be a car",
                    "this appears to be a vehicle", 
                    "this shows a building",
                    "this is a landscape",
                    "this shows food",
                    "this appears to be furniture"
                ]
                
                has_obvious_non_medical = any(phrase in analysis_lower for phrase in obvious_non_medical)
                
                if is_rejected or has_obvious_non_medical:
                    logger.warning(f"⚠ Non-medical image detected: {analysis[:100]}")
                    raise HTTPException(
                        status_code=400,
                        detail="This image does not appear to show a medical condition. Please upload an image showing symptoms, wounds, rashes, or health concerns for consultation."
                    )
                
                logger.info(f"✓ Image validated as medical content")
                
            except HTTPException:
                raise
            except Exception as image_error:
                logger.error(f"✗ Image analysis failed: {image_error}")
                logger.error(f"   Error type: {type(image_error).__name__}")
                logger.error(f"   Error details: {repr(image_error)}")
                
                # Provide more specific error message
                error_msg = str(image_error)
                if "invalid image data" in error_msg.lower():
                    raise HTTPException(status_code=400, detail="The uploaded image format is not supported. Please try a JPEG or PNG image.")
                else:
                    raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(image_error)}")
            finally:
                if temp_image_path and os.path.exists(temp_image_path):
                    try:
                        os.unlink(temp_image_path)
                    except:
                        pass
        
        # ✅ Handle text-only or voice-only consultation (no image)
        elif transcription:
            try:
                # ✅ FIXED: Properly replace the placeholder with actual symptoms
                full_prompt = voice_only_prompt.replace("[transcribed_symptoms]", transcription)
                logger.info(f"✓ Formatted text-only prompt: {full_prompt[:200]}...")
                
                analysis = clean_medical_text(analyze_text_only(full_prompt))
                logger.info(f"✓ Text/Voice-only analysis successful: {analysis[:100]}...")
            except Exception as text_error:
                logger.error(f"✗ Text analysis failed: {text_error}")
                raise HTTPException(status_code=500, detail=f"Text analysis failed: {str(text_error)}")
        
        # Ensure analysis is sanitized of any asterisks
        if analysis:
            analysis = clean_medical_text(analysis)

        # ✅ Updated validation
        if not analysis and not transcription:
            raise HTTPException(
                status_code=400, 
                detail="Please provide symptoms via text, voice recording, or medical image"
            )
        
        # Save consultation to database if Supabase is available
        consultation_id = None
        if supabase and user_id and analysis:
            try:
                consultation_data = {
                    "user_id": user_id,
                    "transcription": transcription,
                    "analysis": analysis,
                    "created_at": datetime.now().isoformat(),
                    "has_image": image is not None,
                    "has_audio": audio is not None
                }
                
                result = supabase.table("consultations").insert(consultation_data).execute()
                consultation_id = result.data[0].get("id") if result.data else None
                logger.info(f"✓ Consultation saved to database. ID: {consultation_id}")
            except Exception as db_error:
                logger.error(f"✗ Failed to save consultation to database: {db_error}")
                # Continue anyway - don't fail the consultation
        else:
            logger.warning(f"⚠ Consultation not saved - Supabase: {bool(supabase)}, UserID: {bool(user_id)}, Analysis: {bool(analysis)}")
        
        # Generate audio response
        # Generate audio response
        audio_filename = None
        if analysis:
            try:
                cleanup_old_audio_files()
                audio_filename = f"response_{uuid.uuid4().hex[:10]}.mp3"
                full_audio_path = os.path.join(AUDIO_DIR, audio_filename)
                text_to_speech_elevenLabs(input_text=analysis, output_filepath=full_audio_path)
                logger.info(f"✓ Audio response generated: {audio_filename}")
            except Exception as tts_error:
                logger.error(f"✗ Text-to-speech failed: {tts_error}")
                # Continue without audio - analysis is still valid
                audio_filename = None
        
        audio_exists = audio_filename and os.path.exists(os.path.join(AUDIO_DIR, audio_filename))
        response = {
            "transcription": transcription,
            "analysis": analysis,
            "audio_url": f"/download-audio/{audio_filename}" if audio_exists else None,
            "consultation_id": consultation_id,
            "saved_to_database": bool(consultation_id)
        }
        
        logger.info(f"✓ Consultation completed successfully")
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Medical consultation error: {e}")
        logger.error(f"   Error type: {type(e).__name__}")
        logger.error(f"   Error details: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Consultation failed: {str(e)}")

@app.get("/medical-consultation")
async def medical_consultation_get(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(10, ge=1, le=50, description="Number of records to fetch")
):
    """Fetch medical consultation records scoped strictly to the requesting user"""
    if not is_valid_uuid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user_id format")
    
    try:
        if not supabase or not supabase_initialized:
            raise HTTPException(status_code=503, detail="Database not configured")
        
        response = supabase.table("consultations").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        return {"consultations": response.data or []}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching consultations: {e}")
        raise HTTPException(status_code=500, detail="Error fetching consultations")

# -------------------------
# Health Insights API Endpoints
# -------------------------
def extract_meaningful_insights(consultations: List[Dict]) -> List[Dict]:
    """Extract clinical conditions, practical recommendations, and precautions from consultation history"""
    if not consultations:
        return []
    
    insights = []
    seen_issues = set()
    
    for c in consultations:
        txt = (c.get("transcription") or "").lower()
        analysis = clean_medical_text(c.get("analysis") or "")
        cid = c.get("id") or str(uuid.uuid4())
        created_at = c.get("created_at") or datetime.now().isoformat()
        
        issue = None
        avoid = "Avoid self-medicating with unprescribed medications. Avoid strenuous physical stress."
        urgency = "medium"
        
        if any(w in txt for w in ["peeth", "back", "lumbar", "spine", "kamar"]):
            issue = "Lumbar Strain & Musculoskeletal Back Pain"
            avoid = "Avoid prolonged sitting on unsupported surfaces (like beds or soft couches). Avoid sudden bending or heavy lifting."
            urgency = "high" if any(w in txt for w in ["bahut", "severe", "zyada", "bad"]) else "medium"
        elif any(w in txt for w in ["headache", "sir dard", "migraine", "head"]):
            issue = "Recurrent Tension Headache & Screen Strain"
            avoid = "Avoid continuous screen time without 20-20-20 breaks. Avoid skipping meals and dehydration."
            urgency = "medium"
        elif any(w in txt for w in ["cough", "cold", "fever", "chills", "throat", "gala"]):
            issue = "Upper Respiratory Viral Infection & Fever"
            avoid = "Avoid cold drinks, chilling exposure, and strenuous workouts during active fever."
            urgency = "high" if "fever" in txt else "medium"
        elif any(w in txt for w in ["chest", "breath", "saans"]):
            issue = "Cardiorespiratory Monitoring"
            avoid = "Avoid physical overexertion. Seek emergency medical care immediately if shortness of breath worsens."
            urgency = "high"
        elif any(w in txt for w in ["stomach", "pet", "acidity", "nausea", "vomit", "gas"]):
            issue = "Gastrointestinal Irritation & Acidity"
            avoid = "Avoid oily, spicy meals, lying down immediately after eating, and excess caffeine."
            urgency = "medium"
        else:
            m = re.search(r'([A-Za-z\s]{4,35}\([A-Z0-9\.\-]+\))', analysis)
            if m:
                issue = m.group(1).strip()
            elif txt:
                clean_symptom = re.sub(r'[^a-zA-Z0-9\s]', '', txt).strip()
                issue = (clean_symptom[:40] + ("..." if len(clean_symptom) > 40 else "")).title()
            else:
                issue = "Clinical Medical Consultation"
        
        if issue in seen_issues:
            continue
        seen_issues.add(issue)
        
        sentences = [s.strip() for s in re.split(r'[.!?\n]+', analysis) if len(s.strip()) > 30]
        advice_candidates = [s for s in sentences if any(k in s.lower() for k in [
            'recommend', 'rest', 'doctor', 'treatment', 'water', 'hydration',
            'support', 'posture', 'relief', 'care', 'compress', 'medicine'
        ])]
        advice = advice_candidates[0] if advice_candidates else (sentences[0] if sentences else "Follow up with a healthcare provider for ongoing assessment.")

        recurrence = sum(1 for other in consultations if issue[:8].lower() in (other.get("transcription") or "").lower() or issue[:8].lower() in (other.get("analysis") or "").lower())
        
        insights.append({
            "id": cid,
            "issue": issue,
            "advice": advice,
            "full_advice": analysis if analysis else advice,
            "symptoms": c.get("transcription") or "",
            "avoid": avoid,
            "urgency": urgency,
            "consultation_count": max(1, recurrence),
            "created_at": created_at
        })
        
        if len(insights) >= 5:
            break
            
    return insights

@app.get("/api/health-insights/{user_id}")
async def get_health_insights_from_consultations(user_id: str):
    """Get personalized health insights and precautions from consultation history"""
    if not is_valid_uuid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    try:
        if supabase and supabase_initialized:
            try:
                res = supabase.table("consultations").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()
                consultations = res.data or []
                
                if consultations:
                    insights = extract_meaningful_insights(consultations)
                    return {
                        "insights": insights,
                        "consultation_count": len(consultations),
                        "source": "extracted_from_consultations"
                    }
            except Exception as db_err:
                logger.error(f"Error querying consultations for insights: {db_err}")
        
        # Clinical baseline guidelines when no prior records exist
        baseline_insights = [
            {
                "id": "baseline-1",
                "issue": "Consultation History & Longitudinal Tracking",
                "advice": "Complete your first consultation. Medly will automatically extract diagnosis timelines, recurrence rates, and personalized care plans.",
                "avoid": "Avoid relying solely on general search queries when experiencing acute or worsening symptoms.",
                "urgency": "low",
                "consultation_count": 0,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "baseline-2",
                "issue": "Ergonomics & Workstation Posture",
                "advice": "Ensure lower lumbar support when sitting for long periods. Take a 2-minute posture break every 45 minutes to prevent spinal fatigue.",
                "avoid": "Avoid sitting unsupported on beds or soft couches for longer than 30 minutes while working on a laptop.",
                "urgency": "medium",
                "consultation_count": 0,
                "created_at": datetime.now().isoformat()
            }
        ]
        return {
            "insights": baseline_insights,
            "consultation_count": 0,
            "source": "baseline_guidelines"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health insights error: {e}")
        return {"insights": [], "consultation_count": 0, "error": str(e)}

@app.post("/api/health-insights")
async def generate_health_insights_from_consultations(request: dict):
    """Generate or refresh health insights from consultation data"""
    try:
        user_id = (request.get("user_id") or "").strip()
        if not user_id or not is_valid_uuid(user_id):
            raise HTTPException(status_code=400, detail="Valid user_id required")
            
        if supabase and supabase_initialized:
            res = supabase.table("consultations").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()
            consultations = res.data or []
            if consultations:
                insights = extract_meaningful_insights(consultations)
                return {
                    "insights": insights,
                    "consultation_count": len(consultations),
                    "source": "extracted_from_consultations"
                }
                
        return await get_health_insights_from_consultations(user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health insights generation error: {e}")
        raise HTTPException(status_code=500, detail="Health insights generation failed")

@app.post("/api/health-insights/chat")
async def health_insights_chat(request: dict):
    """AI Clinical Assistant that answers questions dynamically based on past consultations"""
    try:
        user_id = (request.get("user_id") or "").strip()
        message = (request.get("message") or "").strip()
        
        if not user_id or not is_valid_uuid(user_id):
            raise HTTPException(status_code=400, detail="Valid user_id required")
            
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
            
        if len(message) > MAX_CHAT_MESSAGE_LENGTH:
            message = message[:MAX_CHAT_MESSAGE_LENGTH]
            
        consultations = []
        if supabase and supabase_initialized:
            try:
                res = supabase.table("consultations").select("created_at, transcription, analysis").eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()
                consultations = res.data or []
            except Exception as db_err:
                logger.error(f"Error fetching consultations for chat: {db_err}")
                
        if not consultations:
            return {
                "reply": "You don't have any recorded consultations yet. Once you complete a session with the AI Doctor, I can answer questions about your reported symptoms, exact dates, recurring patterns, and specific precautions."
            }
            
        history_lines = []
        for idx, c in enumerate(consultations, 1):
            dt = (c.get("created_at") or "")[:10]
            symptoms = (c.get("transcription") or "General clinical check").strip()
            analysis = clean_medical_text(c.get("analysis") or "")[:700].strip()
            history_lines.append(f"Consultation #{idx} [Date: {dt}]:\n- Patient Symptoms: {symptoms}\n- Clinical Analysis & Advice: {analysis}")
            
        history_context = "\n\n".join(history_lines)
        
        prompt = f"""You are Medly Health Assistant, an empathetic, intelligent clinical AI assistant.
The patient is asking a question specifically about their medical records and past consultations.
Answer strictly, accurately, and thoughtfully based on their consultation history below.

Patient Consultation Records:
{history_context}

Patient Question: {message}

Clinical Answering Rules:
1. When asked when they had an illness or symptom (e.g. fever, cough, back pain, headache), state the exact dates from their consultation records.
2. When asked what they should or should NOT do (e.g. "what should I avoid?"), list specific, practical precautions, ergonomic adjustments, and self-care steps tailored to the conditions they consulted about.
3. Be concise, clear, and professional.
4. Do NOT use markdown bold asterisks (**) in your output, keep text clean and readable.
5. If they ask about something not recorded in their history, clearly clarify that it is not present in their past consultations, but provide safe general guidance."""

        reply = clean_medical_text(analyze_text_only(prompt))
        return {"reply": reply}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health insights chat error: {e}")
        return {"reply": "Sorry, I encountered an issue accessing your records. Please try again."}

@app.delete("/api/health-insights/{insight_id}")
async def delete_health_insight(insight_id: str, user_id: str = Query(...)):
    """Delete a specific health insight - simplified version"""
    if not is_valid_uuid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    return {
        "message": "Insight removed from current session. Generate new insights to refresh.",
        "database_configured": bool(supabase)
    }

@app.api_route("/download-audio/{filename}", methods=["GET", "HEAD"])
async def download_audio(filename: str):
    """Download generated audio file safely with strict path-traversal prevention"""
    # Strict regex: only alphanumeric, hyphen, underscore + .mp3 extension
    if not re.match(r'^[a-zA-Z0-9_\-]+\.mp3$', filename):
        raise HTTPException(status_code=400, detail="Invalid audio filename format")
    
    safe_name = os.path.basename(filename)
    real_audio_dir = os.path.realpath(AUDIO_DIR)
    path_in_dir = os.path.realpath(os.path.join(real_audio_dir, safe_name))
    
    # Path traversal validation: canonical path must start with real_audio_dir
    if not path_in_dir.startswith(real_audio_dir) or not os.path.isfile(path_in_dir):
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    return FileResponse(
        path=path_in_dir,
        media_type="audio/mpeg",
        filename="doctor_response.mp3"
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
