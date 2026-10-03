import os
import logging
from gtts import gTTS
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")

def text_to_speech(input_text: str, output_filepath: str) -> str:
    """Generate speech using gTTS without blocking audio playback"""
    try:
        language = "en"
        audioobj = gTTS(
            text=input_text,
            lang=language,
            slow=False
        )
        audioobj.save(output_filepath)
        return output_filepath
    except Exception as e:
        logger.error(f"gTTS error: {e}")
        raise

def text_to_speech_elevenLabs(input_text: str, output_filepath: str) -> str:
    """
    Convert text to speech using ElevenLabs API with graceful fallback to gTTS
    
    Args:
        input_text (str): Text to convert to speech
        output_filepath (str): Path to save the audio file
    
    Returns:
        str: Path to the generated audio file
    """
    if not ELEVENLABS_API_KEY:
        logger.info("ElevenLabs API key not configured, using gTTS fallback")
        return text_to_speech(input_text, output_filepath)

    try:
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        audio_stream = client.text_to_speech.convert(
            text=input_text,
            voice_id="JBFqnCBsd6RMkjVDRZzb",  # Aria's voice ID
            model_id="eleven_turbo_v2",
            output_format="mp3_22050_32"
        )
        with open(output_filepath, "wb") as f:
            for chunk in audio_stream:
                f.write(chunk)
        return output_filepath
    except Exception as e:
        logger.warning(f"ElevenLabs TTS failed ({e}), falling back to gTTS")
        return text_to_speech(input_text, output_filepath)