import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

console.log('API Base URL:', API_BASE_URL); // Debug log

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
    image?: File | null, 
    audio?: Blob | null
  ): Promise<ConsultationResult> {
    try {
      console.log('Starting consultation...', { hasImage: !!image, hasAudio: !!audio });
      
      const formData = new FormData();
      
      if (image) {
        console.log('Adding image to form data:', image.name, image.type, image.size);
        formData.append('image', image);
      }
      
      if (audio) {
        // Convert Blob to File for proper form data
        const audioFile = new File([audio], 'recording.wav', { type: 'audio/wav' });
        console.log('Adding audio to form data:', audioFile.name, audioFile.type, audioFile.size);
        formData.append('audio', audioFile);
      }

      console.log('Making API request to:', `${API_BASE_URL}/medical-consultation`);
      
      const response = await api.post('/medical-consultation', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('API response received:', response.status);
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
