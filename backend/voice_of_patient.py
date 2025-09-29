import logging
import speech_recognition as sr
from pydub import AudioSegment
from io import BytesIO
from dotenv import load_dotenv
from groq import Groq
import os

# Global client instance for connection reuse
_groq_client = None

def get_groq_client(api_key: str):
    """Get or create a singleton Groq client for connection reuse"""
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=api_key)
    return _groq_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s-%(levelname)s -%(message)s')

def record_audio(file_path, timeout=20, phrase_time_limit=None):
    """
    Simplified function to record audio from the microphone and save it as an MP3 file.

    Args:
    file_path (str): Path to save the recorded audio file.
    timeout (int): Maximum time to wait for a phrase to start (in seconds).
    phrase_time_lfimit (int): Maximum time for the phrase to be recorded (in seconds).
    """
    recognizer = sr.Recognizer()
    
    try:
        with sr.Microphone() as source:
            logging.info("Adjusting for ambient noise...")
            recognizer.adjust_for_ambient_noise(source, duration=1)
            logging.info("Start speaking now...")
            
            # Record the audio
            audio_data = recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
            logging.info("Recording complete.")
            
            # Convert the recorded audio to an MP3 file
            wav_data = audio_data.get_wav_data()
            audio_segment = AudioSegment.from_wav(BytesIO(wav_data))
            audio_segment.export(file_path, format="mp3", bitrate="128k")
            
            logging.info(f"Audio saved to {file_path}")

    except Exception as e:
        logging.error(f"An error occurred: {e}")

audio_filepath="patient_voice_test_for_patient.mp3"
#record_audio(file_path=audio_filepath)

#Step2: Setup Speech to text–STT–model for transcription
import os
from groq import Groq
from dotenv import load_dotenv

stt_model="whisper-large-v3"
GROQ_API_KEY=os.environ.get("GROQ_API_KEY")
def transcribe_with_groq(GROQ_API_KEY, audio_filepath, stt_model):
    """
    Transcribe audio using Groq API
    
    Args:
        GROQ_API_KEY (str): Groq API key
        audio_filepath (str): Path to audio file
        stt_model (str): Speech-to-text model name
    
    Returns:
        str: Transcribed text
    """
    load_dotenv()
    
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is required")
    
    client = get_groq_client(GROQ_API_KEY)  # Use singleton client
    
    try:
        with open(audio_filepath, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model=stt_model,
                file=audio_file,
                language="en"
            )
        return transcription.text
    except Exception as e:
        logging.error(f"Transcription error: {e}")
        return f"Transcription failed: {str(e)}"