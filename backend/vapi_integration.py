import os
import logging
from typing import Dict, Optional, List
from dotenv import load_dotenv
import httpx
from groq import Groq

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VAPIIntegration:
    """VAPI voice integration for AI medical assistant"""
    
    def __init__(self):
        self.vapi_api_key = os.getenv("VAPI_API_KEY")
        self.vapi_base_url = "https://api.vapi.ai"
        self.headers = {
            "Authorization": f"Bearer {self.vapi_api_key}",
            "Content-Type": "application/json"
        }
        
    async def create_assistant(self, system_prompt: str) -> Dict:
        """Create a VAPI assistant with medical system prompt"""
        
        assistant_config = {
            "name": "AI Medical Assistant",
            "model": {
                "provider": "openai",
                "model": "gpt-4-turbo",
                "temperature": 0.7,
                "systemPrompt": system_prompt
            },
            "voice": {
                "provider": "11labs",
                "voiceId": "rachel",  # Professional, calm voice
                "stability": 0.8,
                "similarityBoost": 0.75
            },
            "firstMessage": "Hello, I'm your AI medical assistant. I'm here to help understand your symptoms. Please note that I cannot provide medical diagnosis, but I can help gather information and suggest when to seek professional care. How can I help you today?",
            "endCallMessage": "Thank you for speaking with me. Please remember to consult a healthcare professional if your symptoms persist or worsen. Take care!",
            "recordingEnabled": True,
            "hipaaEnabled": True,
            "silenceTimeoutSeconds": 30,
            "maxDurationSeconds": 600,  # 10 minutes max
            "backgroundSound": "off"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.vapi_base_url}/assistant",
                headers=self.headers,
                json=assistant_config
            )
            response.raise_for_status()
            return response.json()
    
    async def create_phone_call(self, phone_number: str, assistant_id: str) -> Dict:
        """Initiate a phone call with the medical assistant"""
        
        call_config = {
            "assistantId": assistant_id,
            "phoneNumberId": os.getenv("VAPI_PHONE_NUMBER"),
            "customer": {
                "number": phone_number
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.vapi_base_url}/call/phone",
                headers=self.headers,
                json=call_config
            )
            response.raise_for_status()
            return response.json()
    
    async def end_call(self, call_id: str) -> Dict:
        """End an active call"""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.vapi_base_url}/call/{call_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
