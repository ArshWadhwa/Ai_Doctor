from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import tempfile
import logging
from pathlib import Path
from typing import List, Dict
import httpx
import json
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

# Initialize supabase client only if environment variables are properly set
if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL != "your_supabase_url":
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("Warning: Supabase not configured. Health insights will not work.")

# -------------------------
# OpenRouter Setup  
# -------------------------
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = "z-ai/glm-4.5-air:free"

# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://aimedicaldoc.netlify.app").split(",")

# Strip whitespace and filter empty strings
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]

print(f"Allowed CORS origins: {ALLOWED_ORIGINS}")  # Debug log

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
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
# Helper Functions for Health Insights
# -------------------------
def create_health_insights_prompt(consultations: List[Dict]) -> str:
    consultation_text = ""
    for i, c in enumerate(consultations, 1):
        consultation_text += f"""
        Consultation {i} ({c['created_at']}):
        Symptoms: {c.get('transcription', '')}
        Analysis: {c.get('analysis', '')}
        ---
        """
    
    prompt = f"""
You are a medical AI assistant. Analyze the consultation history and provide health insights.

CONSULTATION HISTORY:
{consultation_text}

IMPORTANT: Return ONLY a valid JSON response with this exact structure (no extra text):

{{
    "recommendations": [
        {{
            "issue": "specific condition name",
            "advice": "detailed advice in 1-2 sentences",
            "urgency": "low/medium/high"
        }}
    ]
}}

Rules:
- Maximum 5 recommendations
- Each advice should be 1-2 complete sentences
- Use only "low", "medium", or "high" for urgency
- Focus on preventive care, lifestyle, and when to see a doctor
- Return ONLY the JSON, no explanations before or after
- Do not include ```json or any markdown formatting
"""
    return prompt

async def get_ai_health_insights(prompt: str) -> str:
    """Call OpenRouter API for AI summarization"""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful medical AI assistant. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 2000
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

def parse_ai_insights_response(ai_response: str):
    """Parse AI JSON response safely"""
    try:
        # Clean the response - remove any extra text before/after JSON
        response_clean = ai_response.strip()
        
        # Find JSON start and end
        start = response_clean.find('{')
        end = response_clean.rfind('}') + 1
        
        if start != -1 and end > start:
            json_str = response_clean[start:end]
            data = json.loads(json_str)
            recommendations = data.get("recommendations", [])
            
            # Validate and clean each recommendation
            clean_recommendations = []
            for rec in recommendations:
                if isinstance(rec, dict) and 'issue' in rec and 'advice' in rec:
                    urgency = rec.get('urgency', 'medium').lower()
                    if urgency not in ['low', 'medium', 'high']:
                        urgency = 'medium'
                    
                    clean_recommendations.append({
                        "issue": str(rec['issue']).strip(),
                        "advice": str(rec['advice']).strip(),
                        "urgency": urgency
                    })
            
            return clean_recommendations[:5]  # Limit to 5 recommendations
        else:
            raise json.JSONDecodeError("No valid JSON found", "", 0)
            
    except (json.JSONDecodeError, KeyError) as e:
        print(f"JSON parsing error: {e}")
        print(f"AI Response: {ai_response}")
        
        # Enhanced fallback
        return [{
            "issue": "General Health Analysis",
            "advice": "Based on your consultation history, continue monitoring your symptoms and consult with healthcare professionals for personalized care.",
            "urgency": "medium"
        }]

def validate_insights_response(insights):
    """Validate and clean insights response"""
    validated_insights = []
    
    for insight in insights:
        if isinstance(insight, dict) and 'issue' in insight and 'advice' in insight:
            # Ensure urgency is valid
            urgency = insight.get('urgency', 'medium').lower()
            if urgency not in ['low', 'medium', 'high']:
                urgency = 'medium'
            
            validated_insights.append({
                "issue": str(insight['issue'])[:100],  # Limit length
                "advice": str(insight['advice'])[:500],  # Limit length
                "urgency": urgency
            })
    
    return validated_insights[:5]  # Limit to 5 insights


@app.get("/")
async def root():
    return {"message": "AI Medical Doctor API is running"}

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
    audio: UploadFile = File(None)
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
            # Use voice-only prompt for text analysis
            full_prompt = voice_only_prompt.replace("[transcribed_symptoms]", transcription)
            analysis = analyze_text_only(full_prompt)
        
        # Ensure we have some analysis to provide audio response
        if not analysis and not transcription:
            raise HTTPException(status_code=400, detail="Please provide either an image or audio recording for consultation")
        
        # Generate audio response
        audio_path = None
        if analysis:
            audio_path = f"temp_response_{os.getpid()}.mp3"
            text_to_speech_elevenLabs(input_text=analysis, output_filepath=audio_path)
        
        response = {
            "transcription": transcription,
            "analysis": analysis,
            "audio_url": f"/download-audio/{audio_path}" if audio_path else None
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
# Health Insights API Endpoint
# -------------------------
@app.post("/api/health-insights")
async def generate_health_insights(request: dict):
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not configured")
        
        user_id = request.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID required")
        
        # Fetch consultations from Supabase
        consultations_response = supabase.table("consultations")\
            .select("*")\
            .eq("user_id", user_id)\
            .execute()
        consultations = consultations_response.data
        
        if not consultations:
            return {"insights": [], "message": "No consultations found"}
        
        # Create prompt and get AI insights
        prompt = create_health_insights_prompt(consultations)
        
        if not OPENROUTER_API_KEY:
            # Fallback response if no AI API key
            return {
                "insights": [{
                    "issue": "general health",
                    "advice": "Based on your consultation history, continue monitoring your health and consult healthcare professionals as needed.",
                    "urgency": "low"
                }],
                "total_consultations": len(consultations),
                "analysis_date": datetime.now().isoformat()
            }
        
        ai_response = await get_ai_health_insights(prompt)
        insights = parse_ai_insights_response(ai_response)
        validated_insights = validate_insights_response(insights)
        
        return {
            "insights": validated_insights,
            "total_consultations": len(consultations),
            "analysis_date": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")


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
