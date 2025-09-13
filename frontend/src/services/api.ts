import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ConsultationResult {
  transcription: string;
  analysis: string;
  audio_url?: string;
}

export const consultationService = {
  // Complete medical consultation with image and/or audio
  async medicalConsultation(
    image?: File | null, 
    audio?: Blob | null
  ): Promise<ConsultationResult> {
    const formData = new FormData();
    
    if (image) {
      formData.append('image', image);
    }
    
    if (audio) {
      // Convert Blob to File for proper form data
      const audioFile = new File([audio], 'recording.wav', { type: 'audio/wav' });
      formData.append('audio', audioFile);
    }

    const response = await api.post('/medical-consultation', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
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
