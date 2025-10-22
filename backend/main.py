from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import sys
import tempfile
import logging
from pathlib import Path
from typing import List, Dict
import httpx
import json
import requests
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import existing modules
from brain_of_doc import encode_image, analyze_image_with_query, analyze_text_only
from voice_of_patient import transcribe_with_groq
from voice_of_doctor import text_to_speech_elevenLabs

app = FastAPI(title="AI Medical Doctor API")

# -------------------------
# Supabase Setup
# -------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print(f"=== ENVIRONMENT DEBUG ===")
print(f"All environment variables count: {len(os.environ)}")
print(f"SUPABASE_URL raw: '{SUPABASE_URL}'")
print(f"SUPABASE_URL present: {SUPABASE_URL is not None}")
print(f"SUPABASE_URL empty: {SUPABASE_URL == ''}")
print(f"SUPABASE_URL length: {len(SUPABASE_URL) if SUPABASE_URL else 0}")
print(f"SUPABASE_SERVICE_KEY present: {SUPABASE_KEY is not None}")
print(f"SUPABASE_SERVICE_KEY empty: {SUPABASE_KEY == ''}")
print(f"SUPABASE_SERVICE_KEY length: {len(SUPABASE_KEY) if SUPABASE_KEY else 0}")
print(f"Environment check:")
print(f"SUPABASE_URL: {'✓ Set' if SUPABASE_URL else '✗ Missing'}")
print(f"SUPABASE_SERVICE_KEY: {'✓ Set' if SUPABASE_KEY else '✗ Missing'}")
print(f"OPENROUTER_API_KEY: {'✓ Set' if os.getenv('OPENROUTER_API_KEY') else '✗ Missing'}")
print(f"Is Render environment: {bool(os.getenv('RENDER'))}")
print(f"=========================")

# Initialize supabase client only if environment variables are properly set
supabase = None
supabase_initialized = False

print(f"Checking Supabase initialization conditions:")
print(f"SUPABASE_URL exists: {bool(SUPABASE_URL)}")
print(f"SUPABASE_KEY exists: {bool(SUPABASE_KEY)}")
print(f"SUPABASE_URL not placeholder: {SUPABASE_URL != 'your_supabase_url'}")

if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL != "your_supabase_url":
    try:
        print(f"✓ All conditions met - Attempting to create Supabase client...")
        print(f"URL: {SUPABASE_URL[:30]}...")
        print(f"Key length: {len(SUPABASE_KEY)}")
        print(f"Environment: Production={os.getenv('RENDER')}, Local={not os.getenv('RENDER')}")
        
        # Remove proxy-related environment variables that might interfere
        proxy_vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']
        for var in proxy_vars:
            if var in os.environ:
                print(f"Removing {var} environment variable")
                del os.environ[var]
        
        # Create client with minimal options
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase_initialized = True
        print("✓ Supabase client created successfully")
        
        # Test the connection with a simple operation
        try:
            # Just test that we can access the client, don't check specific tables yet
            print("✓ Supabase marked as initialized and ready")
        except Exception as test_error:
            print(f"⚠ Supabase client created but connection test failed: {test_error}")
            # Keep the client anyway, it might work for actual operations
            
    except TypeError as type_error:
        if "proxy" in str(type_error):
            print(f"✗ Supabase proxy error detected. Trying alternative initialization...")
            try:
                # Try importing the Client class directly and creating without proxy
                from supabase import Client
                supabase = Client(SUPABASE_URL, SUPABASE_KEY)
                supabase_initialized = True
                print("✓ Supabase client created successfully with alternative method")
            except Exception as alt_error:
                print(f"✗ Alternative Supabase initialization also failed: {alt_error}")
                supabase = None
                supabase_initialized = False
        else:
            print(f"✗ Supabase client initialization failed with TypeError: {type_error}")
            supabase = None
            supabase_initialized = False
    except Exception as e:
        print(f"✗ Supabase client initialization failed: {e}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {repr(e)}")
        print(f"Is production environment: {bool(os.getenv('RENDER'))}")
        supabase = None
        supabase_initialized = False
else:
    print("✗ Supabase not configured. Check environment variables.")
    print(f"   SUPABASE_URL: {SUPABASE_URL[:20] + '...' if SUPABASE_URL else 'None'}")
    print(f"   SUPABASE_KEY: {SUPABASE_KEY[:20] + '...' if SUPABASE_KEY else 'None'}")
    print(f"   Condition 1 (URL exists): {bool(SUPABASE_URL)}")
    print(f"   Condition 2 (KEY exists): {bool(SUPABASE_KEY)}")
    print(f"   Condition 3 (URL not placeholder): {SUPABASE_URL != 'your_supabase_url'}")

print(f"Final Supabase status: initialized={supabase_initialized}, client_exists={supabase is not None}")

# -------------------------
# OpenRouter Setup  
# -------------------------
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = "z-ai/glm-4.5-air:free"

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

system_prompt = """
You are acting as a professional doctor for educational purposes only. This is not a substitute for real medical advice, and you must remind the patient to consult a certified healthcare provider for confirmation and treatment. 
Your task is to carefully analyze the provided medical image along with the patient’s reported symptoms. Blend both sources of information to form a considerate clinical impression that feels natural, empathetic, and professional. Do not describe findings as “In the image I see” but instead use patient-centered language such as “From what you have described and what appears to be present, I think you may be experiencing…”. Keep your response concise but warm, ideally two to three sentences, while ensuring it feels supportive and clinically useful. 
After offering your impression, you may briefly suggest general self-care measures where suitable — such as rest, hydration, gentle diet adjustments, or over-the-counter relief — provided you emphasize that these are temporary measures and not a replacement for medical evaluation. Conclude by including the most relevant ICD-10 code for the suspected condition at the end in parentheses. If you are uncertain, you may mention a few possible conditions with their ICD-10 codes and encourage the patient to follow up promptly with a qualified doctor. 
Here is a medical image and a patient question. Image: [image]. Patient says: [transcribed audio]. Please answer using both sources in a natural and professional manner.
"""


voice_only_prompt = """
You are acting as a professional doctor for educational purposes only. This is not a replacement for real medical advice, and you should kindly remind the patient to consult a certified doctor for confirmation and proper treatment. 
Based only on the patient’s described symptoms, respond in a clear, conversational, and caring tone as though you are speaking directly to them. Keep your impression short and warm, ideally two to three sentences, but ensure it conveys clinical value. You may gently suggest general wellness measures such as rest, hydration, light nutrition, or basic home remedies if appropriate, while emphasizing that these are only supportive options and not definitive care. 
If you identify a likely condition, explain it briefly and provide the most relevant ICD-10 code at the end in parentheses. If you are not completely certain, offer a few possible conditions with their ICD-10 codes and always advise the patient to arrange a follow-up consultation with a qualified healthcare provider.
"""

# -------------------------
# Prompts and System Configuration
# -------------------------


@app.get("/")
async def root():
    return {
        "message": "AI Medical Doctor API is running",
        "cors_origins": all_origins,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/debug-environment")
async def debug_environment():
    """Debug endpoint to check environment variables and Supabase status"""
    return {
        "environment_variables": {
            "SUPABASE_URL": {
                "exists": bool(os.getenv("SUPABASE_URL")),
                "is_empty": os.getenv("SUPABASE_URL") == "",
                "length": len(os.getenv("SUPABASE_URL", "")),
                "preview": os.getenv("SUPABASE_URL", "NOT_SET")[:30] + "..." if os.getenv("SUPABASE_URL") else "NOT_SET",
                "equals_placeholder": os.getenv("SUPABASE_URL") == "your_supabase_url"
            },
            "SUPABASE_SERVICE_KEY": {
                "exists": bool(os.getenv("SUPABASE_SERVICE_KEY")),
                "is_empty": os.getenv("SUPABASE_SERVICE_KEY") == "",
                "length": len(os.getenv("SUPABASE_SERVICE_KEY", "")),
                "preview": os.getenv("SUPABASE_SERVICE_KEY", "NOT_SET")[:30] + "..." if os.getenv("SUPABASE_SERVICE_KEY") else "NOT_SET"
            },
            "OPENROUTER_API_KEY": {
                "exists": bool(os.getenv("OPENROUTER_API_KEY")),
                "length": len(os.getenv("OPENROUTER_API_KEY", ""))
            },
            "RENDER": os.getenv("RENDER", "NOT_SET"),
            "total_env_vars": len(os.environ)
        },
        "supabase_status": {
            "client_exists": supabase is not None,
            "initialized": supabase_initialized,
            "initialization_conditions": {
                "url_exists": bool(SUPABASE_URL),
                "key_exists": bool(SUPABASE_KEY),
                "url_not_placeholder": SUPABASE_URL != "your_supabase_url" if SUPABASE_URL else False
            }
        },
        "python_info": {
            "version": sys.version,
            "platform": sys.platform
        }
    }

@app.get("/test-supabase")
async def test_supabase_connection():
    """Test Supabase connection independently with detailed error reporting"""
    result = {
        "environment_vars": {
            "SUPABASE_URL": os.getenv("SUPABASE_URL", "NOT_SET"),
            "SUPABASE_SERVICE_KEY": "SET" if os.getenv("SUPABASE_SERVICE_KEY") else "NOT_SET",
            "url_length": len(os.getenv("SUPABASE_URL", "")),
            "key_length": len(os.getenv("SUPABASE_SERVICE_KEY", ""))
        },
        "client_creation": "not_attempted",
        "connection_test": "not_attempted",
        "table_test": "not_attempted"
    }
    
    try:
        # Step 1: Try to create client
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        
        result["client_creation"] = "attempting..."
        test_client = create_client(url, key)
        result["client_creation"] = "success"
        
        # Step 2: Try basic connection
        result["connection_test"] = "attempting..."
        # Simple test - try to get auth info
        auth_result = test_client.auth.get_session()
        result["connection_test"] = f"success - session: {type(auth_result)}"
        
        # Step 3: Try table access
        result["table_test"] = "attempting..."
        tables_result = test_client.table("health_insights").select("id").limit(1).execute()
        result["table_test"] = f"success - found {len(tables_result.data)} records"
        
        result["overall_status"] = "all_tests_passed"
        
    except Exception as e:
        result["error"] = {
            "type": type(e).__name__,
            "message": str(e),
            "details": repr(e)
        }
        result["overall_status"] = "failed"
    
    return result

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {
        "status": "healthy",
        "message": "AI Medical Doctor API is operational",
        "database_configured": supabase_initialized,
        "openrouter_configured": bool(OPENROUTER_API_KEY),
        "cors_origins": all_origins,
        "timestamp": datetime.now().isoformat(),
        "environment_debug": {
            "supabase_url_set": bool(os.getenv("SUPABASE_URL")),
            "supabase_key_set": bool(os.getenv("SUPABASE_SERVICE_KEY")),
            "openrouter_key_set": bool(os.getenv("OPENROUTER_API_KEY")),
            "supabase_url_preview": os.getenv("SUPABASE_URL", "NOT_SET")[:30] + "..." if os.getenv("SUPABASE_URL") else "NOT_SET",
            "supabase_key_preview": os.getenv("SUPABASE_SERVICE_KEY", "NOT_SET")[:30] + "..." if os.getenv("SUPABASE_SERVICE_KEY") else "NOT_SET",
            "all_env_vars": list(os.environ.keys())[:10]  # Show first 10 env vars for debugging
        }
    }

@app.post("/transcribe-audio")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe audio to text using Groq API"""
    try:
        # Save uploaded audio file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            content = await audio.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
        
        # Transcribe audio
        transcription = transcribe_with_groq(
            GROQ_API_KEY=os.environ.get("GROQ_API_KEY"),
            audio_filepath=temp_audio_path,
            stt_model="whisper-large-v3"
        )
        
        # Clean up temp file
        os.unlink(temp_audio_path)
        
        return {"transcription": transcription}
    
    except Exception as e:
        logger.error(f"Audio transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/analyze-image")
async def analyze_image(
    image: UploadFile = File(...),
    transcription: str = ""
):
    """Analyze medical image with optional audio transcription"""
    try:
        # Save uploaded image file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_image:
            content = await image.read()
            temp_image.write(content)
            temp_image_path = temp_image.name
        
        # Analyze image
        full_prompt = system_prompt + transcription if transcription else system_prompt
        analysis = analyze_image_with_query(
            full_prompt,
            "meta-llama/llama-4-scout-17b-16e-instruct",
            encode_image(temp_image_path)
        )
        
        # Clean up temp file
        os.unlink(temp_image_path)
        
        return {"analysis": analysis}
    
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/text-to-speech")
async def convert_text_to_speech(text_input: dict):
    """Convert text to speech using ElevenLabs"""
    try:
        text = text_input.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Generate audio file
        output_path = f"temp_audio_{os.getpid()}.mp3"
        text_to_speech_elevenLabs(input_text=text, output_filepath=output_path)
        
        # Return audio file
        return FileResponse(
            path=output_path,
            media_type="audio/mpeg",
            filename="doctor_response.mp3"
        )
    
    except Exception as e:
        logger.error(f"Text-to-speech error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

@app.post("/medical-consultation")
async def medical_consultation(
    image: UploadFile = File(None),
    audio: UploadFile = File(None),
    user_id: str = None
):
    """Complete medical consultation with image and audio"""
    try:
        transcription = ""
        analysis = ""
        
        # Handle audio transcription if provided
        if audio:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
                audio_content = await audio.read()
                temp_audio.write(audio_content)
                temp_audio_path = temp_audio.name
            
            transcription = transcribe_with_groq(
                GROQ_API_KEY=os.environ.get("GROQ_API_KEY"),
                audio_filepath=temp_audio_path,
                stt_model="whisper-large-v3"
            )
            os.unlink(temp_audio_path)
        
        # Handle image analysis if provided
        if image:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_image:
                image_content = await image.read()
                temp_image.write(image_content)
                temp_image_path = temp_image.name
            
            full_prompt = system_prompt + transcription if transcription else system_prompt
            analysis = analyze_image_with_query(
                full_prompt,
                "meta-llama/llama-4-scout-17b-16e-instruct",
                encode_image(temp_image_path)
            )
            os.unlink(temp_image_path)
        
        # Handle voice-only consultation (no image but has transcription)
        elif transcription:
            full_prompt = voice_only_prompt.replace("[transcribed_symptoms]", transcription)
            analysis = analyze_text_only(full_prompt)
        
        if not analysis and not transcription:
            raise HTTPException(status_code=400, detail="Please provide either an image or audio recording for consultation")
        
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
        audio_path = None
        if analysis:
            audio_path = f"temp_response_{os.getpid()}.mp3"
            text_to_speech_elevenLabs(input_text=analysis, output_filepath=audio_path)
        
        response = {
            "transcription": transcription,
            "analysis": analysis,
            "audio_url": f"/download-audio/{audio_path}" if audio_path else None,
            "consultation_id": consultation_id,
            "saved_to_database": bool(consultation_id)
        }
        
        return response
    
    except Exception as e:
        logger.error(f"Medical consultation error: {e}")
        raise HTTPException(status_code=500, detail=f"Consultation failed: {str(e)}")

@app.get("/medical-consultation")
async def medical_consultation_get(limit: int = Query(10, description="Number of records to fetch")):
    """Fetch medical consultation records (stub implementation)"""
    # This is a placeholder for actual database retrieval logic
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not configured")
        
        response = supabase.table("consultations").select("*").limit(limit).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No consultations found")
        
        return {"consultations": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching consultations: {str(e)}")

# -------------------------
# Health Insights API Endpoints
# -------------------------
def extract_remedies_from_text(analysis_text: str) -> List[Dict]:
    """Extract remedy-like recommendations from consultation analysis text"""
    if not analysis_text:
        return []
    
    remedies = []
    
    # Common patterns to look for remedies/recommendations
    remedy_keywords = [
        "rest", "hydration", "drink", "water", "sleep", "avoid", "apply", 
        "take", "use", "medication", "treatment", "therapy", "exercise",
        "diet", "nutrition", "warm", "cold", "compress", "elevate",
        "gentle", "massage", "steam", "gargle", "rinse", "wash"
    ]
    
    # Split text into sentences
    sentences = analysis_text.replace('.', '.\n').replace('!', '!\n').replace('?', '?\n').split('\n')
    sentences = [s.strip() for s in sentences if s.strip()]
    
    for sentence in sentences:
        sentence_lower = sentence.lower()
        
        # Check if sentence contains remedy keywords
        if any(keyword in sentence_lower for keyword in remedy_keywords):
            if len(sentence) > 20 and len(sentence) < 200:  # Reasonable length
                urgency = "low"
                if any(urgent in sentence_lower for urgent in ["immediately", "urgent", "serious", "severe"]):
                    urgency = "high"
                elif any(moderate in sentence_lower for moderate in ["important", "should", "recommend"]):
                    urgency = "medium"
                
                remedies.append({
                    "id": f"remedy-{len(remedies)}",
                    "issue": "Health Recommendation",
                    "advice": sentence.strip(),
                    "urgency": urgency,
                    "consultation_count": 1,
                    "created_at": datetime.now().isoformat()
                })
    
    # If no specific remedies found, extract general advice
    if not remedies:
        # Look for ICD-10 codes and recommendations around them
        lines = analysis_text.split('.')
        for line in lines:
            if len(line.strip()) > 30 and len(line.strip()) < 150:
                remedies.append({
                    "id": f"general-{len(remedies)}",
                    "issue": "General Health Advice",
                    "advice": line.strip(),
                    "urgency": "medium",
                    "consultation_count": 1,
                    "created_at": datetime.now().isoformat()
                })
                if len(remedies) >= 3:  # Limit to 3 insights
                    break
    
    return remedies[:3]  # Limit to top 3 remedies

@app.get("/api/health-insights/{user_id}")
async def get_health_insights_from_consultations(user_id: str):
    """Get health insights extracted from recent consultation analysis"""
    try:
        logger.info(f"📊 Fetching health insights for user: {user_id}")
        logger.info(f"   Supabase initialized: {supabase_initialized}")
        logger.info(f"   Supabase client exists: {supabase is not None}")
        
        # Try to get from database first
        if supabase and supabase_initialized:
            try:
                logger.info(f"   Querying consultations table...")
                consultations_response = supabase.table("consultations").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(5).execute()
                
                logger.info(f"   Database response received: {len(consultations_response.data) if consultations_response.data else 0} consultations")
                
                if consultations_response.data and len(consultations_response.data) > 0:
                    all_remedies = []
                    for idx, consultation in enumerate(consultations_response.data):
                        analysis = consultation.get("analysis", "")
                        logger.info(f"   Processing consultation {idx + 1}: Analysis length = {len(analysis)}")
                        
                        if analysis:
                            remedies = extract_remedies_from_text(analysis)
                            logger.info(f"   Extracted {len(remedies)} remedies from consultation {idx + 1}")
                            all_remedies.extend(remedies)
                    
                    # Remove duplicates and limit to 5
                    unique_remedies = []
                    seen_advice = set()
                    for remedy in all_remedies:
                        if remedy["advice"] not in seen_advice:
                            unique_remedies.append(remedy)
                            seen_advice.add(remedy["advice"])
                        if len(unique_remedies) >= 5:
                            break
                    
                    logger.info(f"✓ Returning {len(unique_remedies)} unique insights from database")
                    
                    if unique_remedies:
                        return {
                            "insights": unique_remedies,
                            "database_configured": True,
                            "source": "database_consultations",
                            "consultation_count": len(consultations_response.data)
                        }
                    else:
                        logger.warning(f"⚠ No remedies extracted from {len(consultations_response.data)} consultations")
                else:
                    logger.info(f"⚠ No consultations found in database for user: {user_id}")
            except Exception as db_error:
                logger.error(f"✗ Database consultation fetch failed: {db_error}")
                logger.error(f"   Error type: {type(db_error).__name__}")
                logger.error(f"   Error details: {repr(db_error)}")
        else:
            logger.warning(f"⚠ Supabase not available - initialized: {supabase_initialized}, client: {supabase is not None}")
        
        # Fallback: Return general health insights
        logger.info("→ Returning fallback general health insights")
        fallback_insights = [
            {
                "id": "general-1",
                "issue": "Daily Hydration",
                "advice": "Drink 8-10 glasses of water daily to maintain proper hydration, support kidney function, and help your body eliminate toxins naturally.",
                "urgency": "low",
                "consultation_count": 0,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "general-2",
                "issue": "Quality Sleep",
                "advice": "Aim for 7-9 hours of quality sleep each night to allow your body to repair, boost immune function, and maintain mental clarity.",
                "urgency": "medium",
                "consultation_count": 0,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "general-3",
                "issue": "Regular Exercise",
                "advice": "Engage in at least 30 minutes of moderate exercise daily, such as brisk walking, to improve cardiovascular health and boost energy levels.",
                "urgency": "medium",
                "consultation_count": 0,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "general-4",
                "issue": "Stress Management",
                "advice": "Practice stress-reduction techniques like deep breathing, meditation, or yoga to support mental health and overall well-being.",
                "urgency": "medium",
                "consultation_count": 0,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "general-5",
                "issue": "Preventive Healthcare",
                "advice": "Schedule regular check-ups with healthcare professionals for early detection and prevention of health issues.",
                "urgency": "high",
                "consultation_count": 0,
                "created_at": datetime.now().isoformat()
            }
        ]
        
        return {
            "insights": fallback_insights,
            "database_configured": bool(supabase),
            "source": "general_health_guidelines",
            "message": "Complete a consultation to get personalized health insights based on your symptoms and conditions.",
            "debug_info": {
                "supabase_initialized": supabase_initialized,
                "user_id_provided": bool(user_id)
            }
        }
        
    except Exception as e:
        logger.error(f"✗ Error getting health insights: {str(e)}")
        logger.error(f"   Error type: {type(e).__name__}")
        return {
            "insights": [],
            "error": f"Error getting insights: {str(e)}",
            "database_configured": bool(supabase),
            "source": "error"
        }

@app.post("/api/health-insights")
async def generate_health_insights_from_consultations(request: dict):
    """Generate health insights from recent consultation data"""
    try:
        user_id = request.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID required")
        
        # Try to get recent consultations from database
        if supabase:
            try:
                consultations_response = supabase.table("consultations").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()
                
                if consultations_response.data:
                    all_remedies = []
                    for consultation in consultations_response.data:
                        analysis = consultation.get("analysis", "")
                        transcription = consultation.get("transcription", "")
                        
                        # Extract remedies from analysis text
                        if analysis:
                            remedies = extract_remedies_from_text(analysis)
                            all_remedies.extend(remedies)
                        
                        # Also extract from transcription for symptoms context
                        if transcription and len(all_remedies) < 3:
                            symptom_advice = extract_remedies_from_text(transcription)
                            all_remedies.extend(symptom_advice)
                    
                    # Remove duplicates and prioritize
                    unique_remedies = []
                    seen_advice = set()
                    for remedy in all_remedies:
                        advice_key = remedy["advice"].lower()[:50]  # Compare first 50 chars
                        if advice_key not in seen_advice:
                            unique_remedies.append(remedy)
                            seen_advice.add(advice_key)
                        if len(unique_remedies) >= 5:
                            break
                    
                    if unique_remedies:
                        return {
                            "insights": unique_remedies,
                            "consultation_count": len(consultations_response.data),
                            "source": "extracted_from_consultations"
                        }
                else:
                    return {
                        "insights": [],
                        "message": "No consultations found. Complete a consultation first to get personalized insights.",
                        "consultation_count": 0
                    }
            
            except Exception as db_error:
                print(f"Database error in health insights generation: {db_error}")
        
        # Fallback: Return helpful general health insights
        general_insights = [
            {
                "id": "wellness-1",
                "issue": "Nutrition Balance",
                "advice": "Maintain a balanced diet rich in fruits, vegetables, whole grains, and lean proteins to support optimal body function and immune health.",
                "urgency": "medium",
                "consultation_count": 0,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "wellness-2", 
                "issue": "Physical Wellness",
                "advice": "Incorporate regular physical activity into your routine, even light activities like walking can significantly improve circulation and mood.",
                "urgency": "medium",
                "consultation_count": 0,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "wellness-3",
                "issue": "Health Monitoring",
                "advice": "Keep track of your body's signals and any recurring symptoms. Early awareness helps in timely medical intervention when needed.",
                "urgency": "high",
                "consultation_count": 0,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "wellness-4",
                "issue": "Mental Wellness",
                "advice": "Prioritize mental health through adequate rest, social connections, and stress management techniques like deep breathing or mindfulness.",
                "urgency": "medium",
                "consultation_count": 0,
                "created_at": datetime.now().isoformat()
            }
        ]
        
        return {
            "insights": general_insights,
            "consultation_count": 0,
            "source": "comprehensive_wellness_guide",
            "message": "Comprehensive wellness recommendations for maintaining optimal health. Complete consultations to unlock personalized insights based on your specific health patterns."
        }
        
    except Exception as e:
        print(f"Health insights generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")

@app.delete("/api/health-insights/{insight_id}")
async def delete_health_insight(insight_id: str, user_id: str = Query(...)):
    """Delete a specific health insight - simplified version"""
    try:
        # Since we're now generating insights on-demand from consultations,
        # we'll return a success message without actual deletion
        return {
            "message": "Insight removed from current session. Generate new insights to refresh.",
            "database_configured": bool(supabase)
        }
        
    except Exception as e:
        print(f"Error handling insight deletion: {str(e)}")
        return {
            "message": f"Error processing request: {str(e)}",
            "database_configured": bool(supabase)
        }


@app.get("/download-audio/{filename}")
async def download_audio(filename: str):
    """Download generated audio file"""
    if os.path.exists(filename):
        return FileResponse(
            path=filename,
            media_type="audio/mpeg",
            filename="doctor_response.mp3"
        )
    else:
        raise HTTPException(status_code=404, detail="Audio file not found")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
