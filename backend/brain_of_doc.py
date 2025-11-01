from dotenv import load_dotenv
import os
from functools import lru_cache
import requests

# Load environment variables from .env file
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

import base64
from groq import Groq

# Global client instance for connection reuse
_groq_client = None

@lru_cache(maxsize=1)
def get_groq_client():
    """Get or create a singleton Groq client for connection reuse"""
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq()
    return _groq_client



#  image_path = "acne.jpg"
def encode_image(image_path):
   
    image_file = open(image_path, "rb")
    return base64.b64encode(image_file.read()).decode('utf-8')



query = "Is there something wrong with my face?"
model = "meta-llama/llama-4-scout-17b-16e-instruct"

def analyze_image_with_query(query,model,encoded_image):
    client = get_groq_client()  # Use singleton client

# Prepare the messages
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", 
                "text": query},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{encoded_image}"
                    },
                },
            ],
        }
    ]

    chat_completition = client.chat.completions.create(
        messages=messages,
        model=model
    )

    return chat_completition.choices[0].message.content

def analyze_text_only(query: str, model: str = "meta-llama/llama-4-scout-17b-16e-instruct") -> str:
    """
    Analyze text-only medical consultation using OpenRouter API
    
    Args:
        query: Complete prompt with symptoms already included
        model: AI model to use
        
    Returns:
        Medical analysis text
    """
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json"
    }
    
    # ✅ Use the complete query as-is (already has symptoms)
    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": query  # This should already be the complete formatted prompt
            }
        ]
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        
        if 'choices' in result and len(result['choices']) > 0:
            analysis = result['choices'][0]['message']['content']
            return analysis.strip()
        else:
            return "Unable to generate analysis. Please try again."
            
    except Exception as e:
        print(f"Error in analyze_text_only: {e}")
        return f"Error analyzing symptoms: {str(e)}"