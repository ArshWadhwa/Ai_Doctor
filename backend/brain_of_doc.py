import os
import base64
import logging
import requests
from dotenv import load_dotenv
from functools import lru_cache
from groq import Groq

load_dotenv()

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Primary and fallback models for text consultations
TEXT_MODELS = [
    "liquid/lfm-2.5-2.6b:free",
    "nvidia/nemotron-3.5-lightning:free",
    "inclusionai/ling-3.0-flash-sante:free",
    "qwen/qwen3.8-27b:free"
]

# Vision models for OpenRouter fallback
VISION_MODELS = [
    "inclusionai/ling-3.0-flash-vl:free"
]

_groq_client = None

def get_groq_client():
    """Get or create a singleton Groq client"""
    global _groq_client
    if _groq_client is None and GROQ_API_KEY:
        try:
            _groq_client = Groq(api_key=GROQ_API_KEY)
        except Exception as e:
            logger.warning(f"Could not initialize Groq client: {e}")
            _groq_client = None
    return _groq_client

def encode_image(image_path: str) -> str:
    """Encode local image file to base64 string"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

def analyze_image_with_query(query: str, model: str = None, encoded_image: str = "") -> str:
    """
    Analyze image with clinical query.
    Attempts Groq first (if available), then falls back to OpenRouter multimodal models.
    """
    # 1. Try Groq if client is available
    groq_client = get_groq_client()
    if groq_client:
        try:
            # Use Groq's supported vision model or specified model
            groq_model = "llama-3.2-11b-vision-preview" if not model or "llama-4" in model else model
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": query},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{encoded_image}"
                            },
                        },
                    ],
                }
            ]
            chat_completion = groq_client.chat.completions.create(
                messages=messages,
                model=groq_model,
                timeout=25.0
            )
            content = chat_completion.choices[0].message.content
            if content and content.strip():
                return clean_medical_text(content)
        except Exception as groq_err:
            logger.warning(f"Groq vision analysis failed ({groq_err}), switching to OpenRouter vision fallback...")

    # 2. Fallback to OpenRouter Vision models
    if OPENROUTER_API_KEY:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        for v_model in VISION_MODELS:
            payload = {
                "model": v_model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": query},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{encoded_image}"
                                }
                            }
                        ]
                    }
                ]
            }
            try:
                response = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=25
                )
                if response.status_code == 200:
                    result = response.json()
                    if "choices" in result and len(result["choices"]) > 0:
                        content = result["choices"][0]["message"]["content"]
                        if content and content.strip():
                            return clean_medical_text(content)
                logger.warning(f"OpenRouter vision with {v_model} returned {response.status_code}: {response.text[:100]}")
            except Exception as e:
                logger.warning(f"Error querying OpenRouter vision model {v_model}: {e}")
                continue

def clean_medical_text(text: str) -> str:
    """Remove all asterisks (* or **) and markdown bold markers from text"""
    if not text:
        return ""
    return text.replace("**", "").replace("*", "").strip()

def analyze_text_only(query: str, model: str = None) -> str:
    """
    Analyze text-only medical consultation using OpenRouter with automatic fallback across free models.
    """
    if not OPENROUTER_API_KEY:
        return "OpenRouter API key is not configured. Please check backend environment settings."

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    # Model priority list: custom model (if supplied and not broken) followed by our resilient free models
    models_to_try = []
    if model and "llama-4-scout" not in model and "glm-4.5" not in model:
        models_to_try.append(model)
    for m in TEXT_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    for current_model in models_to_try:
        payload = {
            "model": current_model,
            "messages": [
                {
                    "role": "user",
                    "content": query
                }
            ]
        }
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=25
            )
            if response.status_code == 200:
                result = response.json()
                if "choices" in result and len(result["choices"]) > 0:
                    analysis = result["choices"][0]["message"]["content"]
                    if analysis and analysis.strip():
                        return clean_medical_text(analysis)
            else:
                logger.warning(f"Model {current_model} returned status {response.status_code}, trying next model...")
        except Exception as e:
            logger.warning(f"Model {current_model} call error: {e}, trying next fallback...")
            continue

    return "Unable to generate consultation analysis at this moment. Please try again shortly."