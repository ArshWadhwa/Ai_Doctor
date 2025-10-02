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

print(f"Environment check:")
print(f"SUPABASE_URL: {'✓ Set' if SUPABASE_URL else '✗ Missing'}")
print(f"SUPABASE_SERVICE_KEY: {'✓ Set' if SUPABASE_KEY else '✗ Missing'}")
print(f"OPENROUTER_API_KEY: {'✓ Set' if os.getenv('OPENROUTER_API_KEY') else '✗ Missing'}")

# Initialize supabase client only if environment variables are properly set
if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL != "your_supabase_url":
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✓ Supabase client initialized successfully")
        
        # Try to create health_insights table if it doesn't exist
        try:
            # Test if table exists by trying to select from it
            supabase.table("health_insights").select("id").limit(1).execute()
            print("✓ health_insights table exists")
        except Exception as table_error:
            print(f"⚠ health_insights table check failed: {table_error}")
            print("You may need to create the health_insights table in Supabase dashboard")
            
    except Exception as e:
        print(f"✗ Supabase client initialization failed: {e}")
        supabase = None
else:
    supabase = None
    print("✗ Supabase not configured. Check environment variables.")
    print(f"   SUPABASE_URL: {SUPABASE_URL[:20] + '...' if SUPABASE_URL else 'None'}")
    print(f"   SUPABASE_KEY: {SUPABASE_KEY[:20] + '...' if SUPABASE_KEY else 'None'}")

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
    return {
        "message": "AI Medical Doctor API is running",
        "cors_origins": all_origins,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {
        "status": "healthy",
        "message": "AI Medical Doctor API is operational",
        "database_configured": bool(supabase),
        "openrouter_configured": bool(OPENROUTER_API_KEY),
        "cors_origins": all_origins,
        "timestamp": datetime.now().isoformat(),
        "supabase_configured": supabase is not None,
        "openrouter_configured": OPENROUTER_API_KEY is not None,
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
# Health Insights API Endpoints
# -------------------------
@app.get("/api/health-insights/{user_id}")
async def get_stored_health_insights(user_id: str):
    """Get stored health insights for a user"""
    try:
        if not supabase:
            # Return empty insights if database is not configured
            return {
                "insights": [],
                "message": "Database not configured. Please set up Supabase environment variables.",
                "database_configured": False
            }
        
        insights_response = supabase.table("health_insights").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        insights = []
        for insight in insights_response.data:
            insights.append({
                "id": insight["id"],
                "issue": insight["issue"],
                "advice": insight["advice"],
                "urgency": insight["urgency"],
                "consultation_count": insight["consultation_count"],
                "created_at": insight["created_at"]
            })
        
        return {"insights": insights, "database_configured": True}
        
    except Exception as e:
        print(f"Error fetching stored insights: {str(e)}")
        # Return empty insights instead of raising an exception
        return {
            "insights": [],
            "error": f"Error fetching insights: {str(e)}",
            "database_configured": bool(supabase)
        }

@app.post("/api/health-insights")
async def generate_and_store_health_insights(request: dict):
    """Generate new AI health insights and store them in database"""
    try:
        user_id = request.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID required")
        
        if not supabase:
            # Generate insights without storing if database not configured
            print("Database not configured - generating fallback insights")
            insights = get_fallback_insights()
            return {
                "insights": [
                    {
                        "id": f"fallback-{i}",
                        "issue": insight["issue"],
                        "advice": insight["advice"],
                        "urgency": insight["urgency"],
                        "consultation_count": 0,
                        "created_at": datetime.now().isoformat()
                    }
                    for i, insight in enumerate(insights)
                ],
                "message": "Database not configured. Displaying sample insights.",
                "database_configured": False
            }
        
        # Get user consultations
        consultations_response = supabase.table("consultations").select("*").eq("user_id", user_id).execute()
        
        if not consultations_response.data:
            return {
                "insights": [],
                "message": "No consultations found. Complete a consultation first to get insights."
            }
        
        consultation_count = len(consultations_response.data)
        
        # Clear existing insights for this user
        supabase.table("health_insights").delete().eq("user_id", user_id).execute()
        
        # Prepare consultation data for AI analysis
        consultation_data = []
        for consultation in consultations_response.data:
            consultation_data.append({
                "symptoms": consultation.get("symptoms", ""),
                "diagnosis": consultation.get("diagnosis", ""),
                "recommendations": consultation.get("recommendations", ""),
                "analysis": consultation.get("analysis", ""),
                "transcription": consultation.get("transcription", ""),
                "date": consultation.get("created_at", "")
            })
        
        # Generate AI insights using OpenRouter
        if OPENROUTER_API_KEY:
            prompt = f"""You are a medical AI assistant. Analyze the consultation history and provide health insights.

IMPORTANT: Respond ONLY with a valid JSON array. No explanations, no markdown, no extra text.

Consultation Data: {consultation_data}

Generate 2-4 personalized health insights based on patterns in the consultation history.

Required JSON format:
[
  {{
    "issue": "Brief health concern or pattern",
    "advice": "Specific actionable advice",
    "urgency": "low"
  }},
  {{
    "issue": "Another health concern",
    "advice": "Another piece of advice",
    "urgency": "medium"
  }}
]

Valid urgency levels: "low", "medium", "high"
Respond with JSON array only:"""
            
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "deepseek/deepseek-chat-v3.1:free",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 1000,
                "temperature": 0.7
            }
            
            print(f"Making OpenRouter API call with model: deepseek/deepseek-chat-v3.1:free")
            print(f"API Key present: {bool(OPENROUTER_API_KEY)}")
            print(f"API Key starts with: {OPENROUTER_API_KEY[:10] if OPENROUTER_API_KEY else 'None'}...")
            
            response = requests.post("https://openrouter.ai/api/v1/chat/completions", 
                                   headers=headers, json=payload, timeout=30)
            
            print(f"OpenRouter response status: {response.status_code}")
            print(f"OpenRouter response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                ai_response = response.json()
                print(f"AI Response structure: {list(ai_response.keys())}")
                
                if 'choices' in ai_response and ai_response['choices']:
                    ai_content = ai_response['choices'][0]['message']['content'].strip()
                    print(f"Raw AI Response: {ai_content}")
                    
                    # Extract JSON insights
                    insights = extract_json_insights(ai_content)
                    print(f"Extracted insights: {insights}")
                    
                    if not insights:
                        print("No insights extracted, using fallback")
                        insights = get_fallback_insights()
                else:
                    print("No choices in AI response, using fallback")
                    insights = get_fallback_insights()
            else:
                error_text = response.text
                print(f"OpenRouter API error: {response.status_code} - {error_text}")
                insights = get_fallback_insights()
        else:
            insights = get_fallback_insights()
        
        # Store insights in database
        stored_insights = []
        for insight in insights:
            try:
                result = supabase.table("health_insights").insert({
                    "user_id": user_id,
                    "issue": insight.get("issue", "General Health"),
                    "advice": insight.get("advice", "Continue regular health monitoring"),
                    "urgency": insight.get("urgency", "low"),
                    "consultation_count": consultation_count
                }).execute()
                
                if result.data:
                    stored_insight = result.data[0]
                    stored_insights.append({
                        "id": stored_insight["id"],
                        "issue": stored_insight["issue"],
                        "advice": stored_insight["advice"],
                        "urgency": stored_insight["urgency"],
                        "consultation_count": stored_insight["consultation_count"],
                        "created_at": stored_insight["created_at"]
                    })
            except Exception as store_error:
                print(f"Error storing insight: {store_error}")
                continue
        
        return {"insights": stored_insights}
        
    except Exception as e:
        print(f"Health insights error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")

@app.delete("/api/health-insights/{insight_id}")
async def delete_health_insight(insight_id: str, user_id: str = Query(...)):
    """Delete a specific health insight"""
    try:
        if not supabase:
            return {
                "message": "Database not configured. Cannot delete insights.",
                "database_configured": False
            }
        
        # Verify the insight belongs to the user
        insight_response = supabase.table("health_insights").select("user_id").eq("id", insight_id).execute()
        
        if not insight_response.data:
            raise HTTPException(status_code=404, detail="Insight not found")
        
        if insight_response.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this insight")
        
        # Delete the insight
        supabase.table("health_insights").delete().eq("id", insight_id).execute()
        
        return {"message": "Insight deleted successfully", "database_configured": True}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting insight: {str(e)}")
        return {
            "message": f"Error deleting insight: {str(e)}",
            "database_configured": bool(supabase)
        }

def extract_json_insights(ai_content):
    """Extract JSON insights from AI response"""
    try:
        # Try to find JSON array in the response
        start_idx = ai_content.find('[')
        end_idx = ai_content.rfind(']') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = ai_content[start_idx:end_idx]
            insights = json.loads(json_str)
            
            # Validate each insight
            valid_insights = []
            for insight in insights:
                if isinstance(insight, dict) and 'issue' in insight and 'advice' in insight:
                    valid_insights.append({
                        "issue": insight.get("issue", "").strip(),
                        "advice": insight.get("advice", "").strip(),
                        "urgency": insight.get("urgency", "low").lower()
                    })
            
            return valid_insights[:4]  # Limit to 4 insights
        
        return []
    except Exception as e:
        print(f"Error extracting JSON insights: {e}")
        return []

def get_fallback_insights():
    """Provide fallback insights when AI fails"""
    return [
        {
            "issue": "Regular Health Monitoring",
            "advice": "Continue tracking your health through regular consultations. This helps identify patterns and potential health concerns early.",
            "urgency": "low"
        },
        {
            "issue": "Lifestyle Optimization", 
            "advice": "Focus on maintaining a balanced diet, regular exercise, and adequate sleep. These are fundamental pillars of good health.",
            "urgency": "medium"
        }
    ]


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
