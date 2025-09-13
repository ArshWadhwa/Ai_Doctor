# AI Medical Doctor - Backend API

A powerful FastAPI-based backend service that provides AI-powered medical consultation capabilities including medical image analysis, audio transcription, and text-to-speech functionality.

## 🚀 Features

- **Medical Image Analysis**: AI-powered analysis of medical images (X-rays, MRIs, skin conditions, etc.)
- **Speech-to-Text**: Convert patient audio recordings to text using Groq's Whisper API
- **Text-to-Speech**: Generate doctor's audio responses using ElevenLabs or Google TTS
- **Professional Medical Responses**: Get structured medical insights with ICD-10 codes
- **RESTful API**: Well-documented FastAPI endpoints with automatic Swagger documentation
- **Error Handling**: Comprehensive error handling with fallback mechanisms
- **CORS Support**: Configured for frontend integration

## 🏗️ Architecture

```
backend/
├── main.py                 # FastAPI application and API endpoints
├── brain_of_doc.py        # Medical image analysis using Groq/Llama Vision
├── voice_of_patient.py    # Audio recording and speech-to-text
├── voice_of_doctor.py     # Text-to-speech functionality
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## 🛠️ Technology Stack

- **Framework**: FastAPI 
- **AI Models**: 
  - Groq Llama 4 Scout (Image Analysis)
  - Whisper Large V3 (Speech Recognition)
- **TTS Services**: 
  - ElevenLabs (Premium TTS)
  - Google TTS (Fallback)
- **Audio Processing**: PyDub, SpeechRecognition
- **Image Processing**: Pillow, Base64 encoding
- **Web Server**: Uvicorn

## 📋 Prerequisites

- Python 3.8+
- Required API Keys:
  - **GROQ_API_KEY**: For image analysis and speech transcription
  - **ELEVENLABS_API_KEY**: For high-quality text-to-speech (optional, falls back to Google TTS)

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```bash
# Required for image analysis and speech transcription
GROQ_API_KEY=your_groq_api_key_here

# Optional for premium TTS (falls back to Google TTS if not provided)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### 3. Run the Server

```bash
# Development server with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production server
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API Base URL**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📚 API Documentation

### Health Check
```http
GET /
```
Returns server status.

**Response:**
```json
{
  "message": "AI Medical Doctor API is running"
}
```

### Medical Consultation (Recommended)
```http
POST /medical-consultation
```
Complete medical consultation with optional image and audio.

**Parameters:**
- `image` (file, optional): Medical image file
- `audio` (file, optional): Audio recording file

**Response:**
```json
{
  "transcription": "Patient's spoken symptoms",
  "analysis": "AI medical analysis with ICD-10 codes",
  "audio_url": "/download-audio/temp_response_12345.mp3"
}
```

### Audio Transcription
```http
POST /transcribe-audio
```
Convert audio to text.

**Parameters:**
- `audio` (file): Audio file (WAV, MP3, etc.)

**Response:**
```json
{
  "transcription": "Transcribed text from audio"
}
```

### Image Analysis
```http
POST /analyze-image
```
Analyze medical images.

**Parameters:**
- `image` (file): Medical image file
- `transcription` (string, optional): Additional patient symptoms

**Response:**
```json
{
  "analysis": "Medical analysis with diagnosis and ICD-10 codes"
}
```

### Text-to-Speech
```http
POST /text-to-speech
```
Convert text to audio.

**Body:**
```json
{
  "text": "Text to convert to speech"
}
```

**Response:** Audio file (MP3)

### Download Audio
```http
GET /download-audio/{filename}
```
Download generated audio files.

## 🧠 AI Models & Services

### Medical Image Analysis
- **Model**: Meta Llama 4 Scout 17B Instruct
- **Provider**: Groq
- **Capabilities**: 
  - Medical image interpretation
  - Differential diagnosis
  - ICD-10 code matching
  - Treatment recommendations

### Speech Recognition
- **Model**: Whisper Large V3
- **Provider**: Groq
- **Features**:
  - High accuracy transcription
  - Medical terminology support
  - Multiple audio formats

### Text-to-Speech
- **Primary**: ElevenLabs (Aria voice)
  - Premium quality
  - Natural sounding
  - Medical pronunciation
- **Fallback**: Google TTS
  - Free alternative
  - Basic quality

## 🔧 Configuration

### System Prompt
The AI uses a carefully crafted system prompt that:
- Instructs the AI to act as a professional doctor
- Provides specific response formatting
- Ensures inclusion of ICD-10 codes
- Maintains professional tone
- Includes safety disclaimers

### CORS Configuration
```python
allow_origins=["http://localhost:3000"]  # React frontend
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

## 🛡️ Error Handling

The API includes comprehensive error handling:

1. **API Key Validation**: Graceful fallbacks when keys are missing
2. **File Processing**: Proper cleanup of temporary files
3. **Model Failures**: Fallback mechanisms for all AI services
4. **Network Issues**: Timeout handling and retry logic
5. **Input Validation**: Proper request validation and error messages

## 📊 Logging

The application uses Python's logging module:
- **Level**: INFO
- **Format**: Timestamp, level, and message
- **Coverage**: All major operations and errors

## 🚀 Deployment

### Local Development
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production (Docker)
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Deployment (Render/Heroku)
1. Set environment variables in your platform's dashboard
2. Use the build command: `pip install -r requirements.txt`
3. Use the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## 🔒 Security Considerations

1. **API Keys**: Store securely in environment variables
2. **File Uploads**: Validate file types and sizes
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **HTTPS**: Use HTTPS in production
5. **CORS**: Configure appropriately for your frontend domain

## 🧪 Testing

### Manual Testing
Use the interactive documentation at `/docs` to test endpoints.

### Curl Examples
```bash
# Health check
curl http://localhost:8000/

# Transcribe audio
curl -X POST "http://localhost:8000/transcribe-audio" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@recording.wav"

# Analyze image
curl -X POST "http://localhost:8000/analyze-image" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@xray.jpg" \
  -F "transcription=Patient has chest pain"
```

## 📈 Performance

- **Concurrent Requests**: FastAPI's async support
- **File Processing**: Efficient temporary file handling
- **Memory Management**: Automatic cleanup of temporary files
- **Response Times**: 
  - Image analysis: 3-10 seconds
  - Audio transcription: 2-5 seconds
  - Text-to-speech: 1-3 seconds

## 🔧 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   ModuleNotFoundError: No module named 'groq'
   ```
   **Solution**: Install dependencies with `pip install -r requirements.txt`

2. **API Key Errors**
   ```
   groq.AuthenticationError: Invalid API key
   ```
   **Solution**: Check your GROQ_API_KEY in the .env file

3. **Audio Processing Errors**
   ```
   Failed to access microphone
   ```
   **Solution**: Ensure audio file format is supported (WAV, MP3, etc.)

4. **CORS Errors**
   ```
   Access-Control-Allow-Origin error
   ```
   **Solution**: Add your frontend URL to the CORS origins list

### Debug Mode
Set logging level to DEBUG for detailed information:
```python
logging.basicConfig(level=logging.DEBUG)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is for educational purposes. Always consult with licensed medical professionals for actual medical advice.

## 🙏 Acknowledgments

- **Groq**: For providing advanced AI models
- **ElevenLabs**: For high-quality text-to-speech
- **FastAPI**: For the excellent web framework
- **Meta**: For the Llama models

---

**⚠️ Medical Disclaimer**: This application is for educational and research purposes only. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers.