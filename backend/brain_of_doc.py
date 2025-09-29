from dotenv import load_dotenv
import os
from functools import lru_cache

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

def analyze_text_only(query):
    """Analyze text-only queries without images"""
    client = get_groq_client()  # Use singleton client
    
    messages = [
        {
            "role": "user",
            "content": query
        }
    ]
    
    chat_completion = client.chat.completions.create(
        messages=messages,
        model="meta-llama/llama-4-scout-17b-16e-instruct"
    )
    
    return chat_completion.choices[0].message.content