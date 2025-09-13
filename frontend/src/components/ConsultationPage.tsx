import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, 
  Mic, 
  MicOff, 
  Upload, 
  X, 
  ArrowLeft, 
  Play, 
  Pause,
  Loader
} from 'lucide-react';
import { consultationService } from '../services/api';

// Get API base URL from environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

interface ConsultationResult {
  transcription: string;
  analysis: string;
  audio_url?: string;
}

const ConsultationPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<ConsultationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob && !selectedImage) {
      setError('Please provide either an audio recording or an image for analysis.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await consultationService.medicalConsultation(selectedImage, audioBlob);
      setResult(response);
    } catch (err) {
      setError('Failed to process consultation. Please try again.');
      console.error('Consultation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = () => {
    if (result?.audio_url && audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const resetConsultation = () => {
    setAudioBlob(null);
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-800 to-indigo-900 text-white">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-20 px-6 lg:px-8">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">MediCare AI</h1>
                  <p className="text-sm text-white/70">Medical Consultation</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link 
                to="/" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Back to Home</span>
              </Link>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Link 
                to="/" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Home</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl mb-6 shadow-xl">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            AI Medical Consultation
          </h2>
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Get instant AI-powered medical analysis by describing your symptoms or uploading medical images
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl">
          {!result ? (
            <div className="space-y-10">
              {error && (
                <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-red-200 font-medium">{error}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
                {/* Audio Recording Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Record Symptoms</h3>
                      <p className="text-white/70 text-sm">Describe your condition</p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-4">
                    {!audioBlob ? (
                      <>
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isLoading}
                          className={`w-full ${
                            isRecording 
                              ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse shadow-red-500/25' 
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25'
                          } text-white font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none shadow-xl`}
                        >
                          {isRecording ? (
                            <>
                              <MicOff className="w-5 h-5" />
                              <span>Stop Recording</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-5 h-5" />
                              <span>Start Recording</span>
                            </>
                          )}
                        </button>
                        <p className="text-white/60 text-sm">Click to start voice recording</p>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-4">
                          <p className="text-green-400 font-semibold text-lg flex items-center justify-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Audio recorded successfully
                          </p>
                        </div>
                        <button 
                          onClick={() => setAudioBlob(null)} 
                          className="text-red-400 border border-red-400/30 hover:bg-red-400 hover:text-white px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          Record Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Upload Image</h3>
                      <p className="text-white/70 text-sm">Medical scans or photos</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {!imagePreview ? (
                      <div
                        className="border-2 border-dashed border-white/30 hover:border-purple-400/60 bg-white/5 hover:bg-purple-500/10 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-lg font-semibold mb-2">Upload Medical Image</p>
                        <span className="text-white/60 text-sm">JPG, PNG, GIF supported</span>
                      </div>
                    ) : (
                      <div className="relative group">
                        <img 
                          src={imagePreview} 
                          alt="Medical upload" 
                          className="w-full rounded-xl shadow-xl border border-white/10"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-full transition-all duration-200 transform hover:scale-110 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-200"></div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || (!audioBlob && !selectedImage)}
                  className="bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 hover:from-green-500 hover:via-green-600 hover:to-emerald-700 text-white font-bold text-lg px-12 py-4 rounded-2xl flex items-center justify-center gap-3 mx-auto transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl shadow-green-500/25 min-w-[280px]"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Analyzing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Stethoscope className="w-5 h-5" />
                      <span>Get AI Medical Analysis</span>
                    </>
                  )}
                </button>
                <p className="text-white/60 text-sm mt-3">AI-powered medical consultation in seconds</p>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Results Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-4 shadow-xl">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Medical Analysis Results
                </h2>
                <p className="text-white/70">AI-powered medical consultation complete</p>
              </div>
              
              {/* Transcription */}
              {result.transcription && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Your Symptoms</h3>
                      <p className="text-white/70 text-sm">Transcribed from audio</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500/10 to-indigo-600/10 border border-blue-400/20 rounded-xl p-6">
                    <p className="text-white/95 italic text-lg leading-relaxed font-medium">{result.transcription}</p>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-2 border-green-400/30 rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-400">AI Doctor Analysis</h3>
                    <p className="text-white/70 text-sm">Professional medical assessment</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <p className="text-lg leading-relaxed text-white/95 font-medium">{result.analysis}</p>
                </div>
              </div>

              {/* Audio Response */}
              {result.audio_url && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 text-center hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Audio Response</h3>
                      <p className="text-white/70 text-sm">Listen to the diagnosis</p>
                    </div>
                  </div>
                  <button 
                    onClick={playAudio} 
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-3 mx-auto transition-all duration-300 transform hover:scale-105 shadow-xl shadow-purple-500/25"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-5 h-5" />
                        <span>Pause Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Play Audio Response</span>
                      </>
                    )}
                  </button>
                  <audio
                    ref={audioRef}
                    src={`${API_BASE_URL}${result.audio_url}`}
                    onEnded={() => setIsPlayingAudio(false)}
                    onPause={() => setIsPlayingAudio(false)}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={resetConsultation} 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl shadow-blue-500/25 min-w-[200px]"
                >
                  New Consultation
                </button>
                <Link 
                  to="/" 
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl min-w-[200px] text-center"
                >
                  Back to Home
                </Link>
              </div>

              {/* Enhanced Disclaimer */}
              <div className="bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border border-yellow-400/30 rounded-2xl p-6 shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-yellow-400 text-lg">⚠️</span>
                  </div>
                  <div>
                    <h4 className="text-yellow-200 font-semibold text-lg mb-2">Important Medical Disclaimer</h4>
                    <p className="text-yellow-100/90 leading-relaxed">
                      This AI analysis is for <strong className="text-yellow-200">educational and informational purposes only</strong>. 
                      It should not replace professional medical advice, diagnosis, or treatment. Always consult with a 
                      licensed healthcare provider for any medical concerns or before making treatment decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationPage;
