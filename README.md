# 🏥 AI Medical Doctor

A cutting-edge, full-stack medical consultation platform powered by advanced AI technologies. This application provides instant medical analysis through voice recognition, medical image analysis, and professional AI-generated responses with ICD-10 medical codes.

![Medical AI](https://img.shields.io/badge/Medical-AI-blue) ![React](https://img.shields.io/badge/React-19.1.1-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green) ![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue) ![Python](https://img.shields.io/badge/Python-3.12-yellow)

## 🌟 Features

### 🤖 AI-Powered Medical Analysis
- **Medical Image Analysis**: Upload X-rays, MRIs, CT scans, skin conditions, or any medical images for instant AI-powered diagnostic insights
- **Voice-to-Text Recognition**: Record symptoms naturally using advanced speech recognition technology
- **Professional AI Responses**: Get structured medical insights with differential diagnoses and ICD-10 medical codes
- **Audio Doctor Responses**: Listen to AI-generated doctor responses with natural voice synthesis

### 💻 Technology Highlights
- **Advanced AI Models**: Groq Llama 4 Scout 17B for image analysis, Whisper Large V3 for speech recognition
- **Premium Audio**: ElevenLabs for high-quality text-to-speech with Google TTS fallback
- **Modern Frontend**: React 19 with TypeScript, Tailwind CSS, and responsive design
- **Robust Backend**: FastAPI with async support, comprehensive error handling, and RESTful APIs
- **Professional UI/UX**: Medical-themed interface with glassmorphism effects and smooth animations

## 🏗️ Architecture Overview

```
AI-Medical-Doctor/
├── 🖥️  frontend/              # React 19 + TypeScript Application
│   ├── src/
│   │   ├── components/        # React Components
│   │   │   ├── LandingPage.tsx         # Professional homepage
│   │   │   ├── ConsultationPage.tsx    # Main consultation interface
│   │   │   └── MedicalAICards.tsx      # Feature showcase
│   │   ├── services/
│   │   │   └── api.ts         # Backend API integration
│   │   ├── App.tsx           # Main app with routing
│   │   └── index.css         # Tailwind + custom styles
│   ├── public/               # Static assets
│   ├── package.json          # Dependencies & scripts
│   └── tailwind.config.js    # UI configuration
│
├── 🔧  backend/               # FastAPI Python Server
│   ├── main.py               # FastAPI app & API endpoints
│   ├── brain_of_doc.py       # AI image analysis (Groq/Llama)
│   ├── voice_of_patient.py   # Speech-to-text processing
│   ├── voice_of_doctor.py    # Text-to-speech generation
│   ├── requirements.txt      # Python dependencies
│   └── .env.example         # Environment template
│
├── 📁 Root Files
│   ├── .gitignore           # Comprehensive git ignore
│   ├── build.sh             # Build automation script
│   └── README.md            # This documentation
```

## 🚀 Quick Start Guide

### 📋 Prerequisites

- **Node.js** 16.0+ and npm
- **Python** 3.8+
- **API Keys** (required):
  - **GROQ_API_KEY**: For image analysis and speech transcription
  - **ELEVENLABS_API_KEY**: For premium TTS (optional, falls back to Google TTS)

### 🔧 Installation & Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd Ai-Medical-Doctor
```

#### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env file with your API keys:
# GROQ_API_KEY=your_groq_api_key_here
# ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

#### 3. Frontend Setup
```bash
# Navigate to frontend directory (from root)
cd frontend

# Install Node.js dependencies
npm install
# or
yarn install
```

#### 4. Start the Application
```bash
# Terminal 1 - Start Backend Server
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Start Frontend Server
cd frontend
npm start
```

### 🌐 Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🛠️ Technology Stack

### Backend Technologies
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web Framework** | FastAPI | High-performance async API server |
| **AI Image Analysis** | Groq Llama 4 Scout 17B | Medical image interpretation |
| **Speech Recognition** | Whisper Large V3 | Audio-to-text transcription |
| **Text-to-Speech** | ElevenLabs + Google TTS | Natural voice generation |
| **Audio Processing** | PyDub, SpeechRecognition | Audio file handling |
| **Image Processing** | Pillow, Base64 | Medical image processing |
| **Server** | Uvicorn | ASGI server implementation |

### Frontend Technologies
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | React 19.1.1 | Modern UI framework |
| **Language** | TypeScript 4.9.5 | Type-safe development |
| **Styling** | Tailwind CSS 3.4 | Utility-first styling |
| **Routing** | React Router DOM 7.8.2 | SPA navigation |
| **HTTP Client** | Axios 1.11.0 | API communication |
| **Icons** | Lucide React 0.542.0 | Professional icon set |
| **Build Tool** | Create React App 5.0.1 | Development toolchain |

## 🎯 Core Functionality

### 🖼️ Medical Image Analysis
Upload medical images including:
- **Radiology**: X-rays, MRIs, CT scans, ultrasounds
- **Dermatology**: Skin conditions, rashes, lesions
- **Pathology**: Tissue samples, lab results
- **General**: Any medical photograph or scan

**AI Capabilities**:
- Detailed medical image interpretation
- Differential diagnosis suggestions
- ICD-10 medical code matching
- Treatment recommendations
- Professional medical language

### 🎙️ Voice Recognition System
- **Real-time Recording**: Browser-based audio capture
- **Advanced Transcription**: Groq Whisper Large V3 model
- **Medical Terminology**: Optimized for healthcare vocabulary
- **Multiple Formats**: WAV, MP3, and other audio formats
- **Error Handling**: Microphone permission management

### 🔊 Text-to-Speech Synthesis
- **Premium Quality**: ElevenLabs Aria voice for natural speech
- **Medical Pronunciation**: Accurate medical term pronunciation
- **Fallback System**: Google TTS for reliability
- **Audio Controls**: Play, pause, and volume control
- **Multiple Formats**: MP3 output for broad compatibility

## 📱 User Interface

### 🏠 Landing Page (`/`)
- **Hero Section**: Professional medical branding with animated icons
- **Feature Overview**: Three main capabilities with detailed descriptions
- **Responsive Design**: Mobile-first approach with touch-friendly interface
- **Professional Navigation**: Clean header with mobile hamburger menu
- **Call-to-Action**: Direct routing to consultation interface

### 🏥 Consultation Page (`/consultation`)
- **Audio Recording Interface**: 
  - Visual recording indicators
  - Real-time microphone feedback
  - Recording controls with accessibility
- **Image Upload System**:
  - Drag-and-drop functionality
  - Click-to-upload alternative
  - Instant image preview with removal options
- **Results Display**:
  - Structured transcription display
  - Professional medical analysis formatting
  - Audio playback controls for doctor responses
- **Error Handling**: User-friendly error messages and recovery options

## 🔌 API Endpoints

### Core Medical APIs

#### `POST /medical-consultation`
Complete consultation with optional image and audio
```typescript
// Request: FormData with optional image and audio files
// Response:
{
  "transcription": "Patient's spoken symptoms",
  "analysis": "AI medical analysis with ICD-10 codes", 
  "audio_url": "/download-audio/response.mp3"
}
```

#### `POST /transcribe-audio`
Convert audio recordings to text
```typescript
// Request: FormData with audio file
// Response:
{
  "transcription": "Transcribed patient symptoms"
}
```

#### `POST /analyze-image`
Analyze medical images with optional context
```typescript
// Request: FormData with image + optional transcription
// Response:
{
  "analysis": "Detailed medical analysis with diagnosis"
}
```

#### `POST /text-to-speech`
Generate audio from medical text
```typescript
// Request: { "text": "Medical response text" }
// Response: Audio file (MP3)
```

### Utility APIs
- `GET /` - Health check and server status
- `GET /download-audio/{filename}` - Download generated audio files

## 🎨 Design System

### Color Palette
```css
/* Medical Theme Colors */
primary-blue: #667eea
primary-purple: #764ba2
medical-green: #4ade80
accent-cyan: #0ea5e9

/* Gradient Backgrounds */
gradient-medical: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
gradient-light: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)
```

### UI Components
- **Glassmorphism Cards**: Translucent backgrounds with blur effects
- **Gradient Buttons**: Medical-themed gradients with hover animations
- **Professional Typography**: Clean, readable fonts optimized for medical content
- **Responsive Layouts**: Mobile-first design with breakpoint optimization
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## 🔒 Security & Privacy

### Data Protection
- **No Persistent Storage**: Medical data is processed but not permanently stored
- **Secure Transmission**: HTTPS enforcement for production environments
- **Temporary Files**: Automatic cleanup of uploaded images and audio
- **API Key Security**: Environment variable protection for sensitive credentials

### CORS Configuration
```python
# Backend CORS setup for frontend integration
allow_origins=["http://localhost:3000"]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

## 🚀 Deployment Options

### Local Development
```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# Frontend  
cd frontend && npm start
```

### Production Deployment

#### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
```

#### Cloud Platforms
- **Backend**: Deploy on Render, Railway, or Heroku
- **Frontend**: Deploy on Netlify, Vercel, or AWS Amplify
- **Environment Variables**: Configure API keys in platform dashboards

## 📊 Performance Metrics

### Response Times
- **Image Analysis**: 3-10 seconds (depending on image size and complexity)
- **Audio Transcription**: 2-5 seconds (based on audio length)
- **Text-to-Speech**: 1-3 seconds (varies by text length)
- **Page Load**: < 2 seconds for initial load
- **API Response**: < 500ms for health checks

### Optimization Features
- **Async Processing**: FastAPI async support for concurrent requests
- **Efficient File Handling**: Temporary file management with automatic cleanup
- **Frontend Optimization**: Code splitting, lazy loading, and bundle optimization
- **Caching**: Browser caching for static assets and API responses

## 🧪 Testing & Quality Assurance

### Frontend Testing
```bash
cd frontend
npm test                    # Run test suite
npm test -- --coverage     # Generate coverage report
npm test -- --watch        # Watch mode for development
```

### API Testing
- **Interactive Documentation**: Available at `/docs` endpoint
- **Manual Testing**: Comprehensive Swagger UI for endpoint testing
- **Error Scenarios**: Built-in error handling and fallback mechanisms

### Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Support**: iOS Safari, Chrome Mobile, Samsung Internet
- **Progressive Enhancement**: Graceful degradation for older browsers

## 🔧 Development Tools

### Code Quality
- **TypeScript**: Strict type checking for frontend code
- **ESLint**: Code linting and style enforcement
- **Prettier**: Consistent code formatting
- **Tailwind CSS**: Utility-first styling with purge for production

### Development Experience
- **Hot Reload**: Both frontend and backend support live reloading
- **Error Boundaries**: React error boundaries for graceful error handling
- **Logging**: Comprehensive logging for debugging and monitoring
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Set up development environment following the Quick Start guide
4. Make your changes following the code style guidelines
5. Test your changes thoroughly
6. Submit a pull request with detailed description

### Code Style Guidelines
- **Frontend**: Follow React best practices and TypeScript conventions
- **Backend**: Follow PEP 8 Python style guide
- **Documentation**: Update README files for any new features
- **Testing**: Add tests for new functionality when applicable

## 📄 Legal & Compliance

### Medical Disclaimer
**⚠️ IMPORTANT**: This application is designed for **educational and research purposes only**. It should never be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions regarding medical conditions.

### Key Points:
- This AI system provides **informational insights only**
- **Not a replacement** for licensed medical professionals
- **No doctor-patient relationship** is established through this application
- Users should **always consult real doctors** for medical concerns
- The developers assume **no liability** for medical decisions based on this tool

### Privacy Notice
- Medical images and audio are processed securely
- No permanent storage of personal health information
- Data transmission uses secure protocols
- Temporary files are automatically cleaned up after processing

## 🆘 Troubleshooting

### Common Issues

#### Backend Issues
```bash
# Issue: Module not found errors
pip install -r requirements.txt

# Issue: API key authentication failed
# Check .env file for correct GROQ_API_KEY

# Issue: Port already in use
lsof -ti:8000 | xargs kill -9
```

#### Frontend Issues
```bash
# Issue: Dependencies not installed
npm install

# Issue: Build errors
npm run build

# Issue: CORS errors
# Ensure backend is running on port 8000
```

#### Audio/Media Issues
- **Microphone Access**: Ensure browser permissions are granted
- **Audio Format**: Use WAV or MP3 for best compatibility
- **File Size**: Keep audio files under 25MB for optimal processing

### Debug Mode
Enable detailed logging for troubleshooting:
```python
# Backend debug mode
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📞 Support & Resources

### Getting Help
- **Documentation**: Comprehensive README files in both `/frontend` and `/backend` directories
- **API Reference**: Interactive documentation at `http://localhost:8000/docs`
- **Error Logs**: Check browser console and server logs for detailed error information

### External Resources
- **Groq API Documentation**: https://groq.com/docs
- **ElevenLabs API**: https://elevenlabs.io/docs
- **FastAPI Documentation**: https://fastapi.tiangolo.com
- **React Documentation**: https://react.dev

## 🎉 Acknowledgments

### Technology Partners
- **Groq**: For providing advanced AI models (Llama 4 Scout, Whisper Large V3)
- **ElevenLabs**: For high-quality text-to-speech synthesis
- **Meta**: For the foundational Llama models
- **OpenAI**: For the Whisper speech recognition model

### Development Frameworks
- **FastAPI**: For the excellent Python web framework
- **React**: For the powerful frontend framework
- **Tailwind CSS**: For the utility-first CSS framework
- **TypeScript**: For enhanced JavaScript development experience

---

## 🏁 Conclusion

The AI Medical Doctor platform represents a cutting-edge fusion of artificial intelligence and healthcare technology. By combining advanced AI models with a professional, user-friendly interface, this application demonstrates the potential of AI-assisted medical consultation while maintaining the highest standards of user experience and data security.

Whether you're a developer interested in AI applications, a healthcare professional exploring digital tools, or a student learning about medical technology, this platform provides a comprehensive example of modern full-stack development with real-world medical applications.

**Remember**: While this technology is impressive and educational, always prioritize real medical professional advice for any health-related concerns.

---

*Built with ❤️ for the future of healthcare technology and AI education.*