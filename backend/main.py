from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import tempfile
import logging
from pathlib import Path

# Import existing modules
from brain_of_doc import encode_image, analyze_image_with_query
from voice_of_patient import transcribe_with_groq
from voice_of_doctor import text_to_speech_elevenLabs

app = FastAPI(title="AI Medical Doctor API")

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
First of all just tell me whether you can hear me or not.. 
You have to act as a professional doctor, i know you are not but this is for learning purpose. 
What's in this image?. Do you find anything wrong with it medically? 
If you make a differential, suggest some remedies for them. Donot add any numbers or special characters in 
your response. Your response should be in one long paragraph. Also always answer as if you are answering to a real person.
Donot say 'In the image I see' but say 'With what I see, I think you have ....'
Dont respond as an AI model in markdown, your answer should mimic that of an actual doctor not an AI bot, 
Keep your answer concise (max 2 sentences). No preamble, start your answer right away please
After providing a diagnosis, match the condition with the most relevant ICD-10 medical code, and display it clearly.
If unsure, mention possible conditions with their ICD-10 codes and advise follow-up with a certified doctor.
Your responses should be helpful, concise, and clinically accurate.

Here is a medical image and a patient question. Image: [image]. Patient says: [transcribed audio]. Please answer using both.
"""

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
