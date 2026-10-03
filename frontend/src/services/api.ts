import axios from 'axios';

// Smart API configuration that works both locally and in production
const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  const isDevelopment = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('localhost');
  
  const localApiUrl = 'http://localhost:8000';
  const productionApiUrl = process.env.REACT_APP_API_BASE_URL || 'https://ai-doctor-tq5i.onrender.com';
  
  if (isDevelopment) {
    return localApiUrl;
  } else {
    return productionApiUrl;
  }
};

const API_BASE_URL = getApiBaseUrl();

// Export for use in other components
export { API_BASE_URL };

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout for large files
});

export interface ConsultationResult {
  transcription: string;
  analysis: string;
  audio_url?: string;
}

export const consultationService = {
  // Complete medical consultation with image and/or audio
  async medicalConsultation(
    image: File | null, 
    audio: Blob | null,
    textInput?: string  // ✅ ADD THIS PARAMETER
  ): Promise<ConsultationResult> {
    const formData = new FormData();
    
    if (image) {
      formData.append('image', image);
    }
    
    if (audio) {
      formData.append('audio', audio, 'audio.wav');
    }
    
    // ✅ ADD TEXT INPUT TO FORMDATA
    if (textInput) {
      formData.append('text_input', textInput);
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/medical-consultation`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Consultation API Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Response headers:', error.response?.headers);
      }
      throw error;
    }
  },

  // Transcribe audio only
  async transcribeAudio(audio: File): Promise<{ transcription: string }> {
    const formData = new FormData();
    formData.append('audio', audio);

    const response = await api.post('/transcribe-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Analyze image only
  async analyzeImage(
    image: File, 
    transcription?: string
  ): Promise<{ analysis: string }> {
    const formData = new FormData();
    formData.append('image', image);
    
    if (transcription) {
      formData.append('transcription', transcription);
    }

    const response = await api.post('/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Convert text to speech
  async textToSpeech(text: string): Promise<Blob> {
    const response = await api.post('/text-to-speech', 
      { text },
      { responseType: 'blob' }
    );

    return response.data;
  },

  // Health check
  async healthCheck(): Promise<{ message: string }> {
    const response = await api.get('/');
    return response.data;
  }
};

export default api;
