import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

import { consultationService as dbConsultationService } from '../services/database';
import { 
  Stethoscope, 
  Mic, 
  MicOff, 
  Upload, 
  X, 
  ArrowLeft, 
  Play, 
  Pause,
  Loader,
  Brain
} from 'lucide-react';
import { consultationService, API_BASE_URL } from '../services/api';
import { stat } from 'fs';

interface ConsultationResult {
  transcription: string;
  analysis: string;
  audio_url?: string;
}

const ConsultationPage: React.FC = () => {
    const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<ConsultationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textSymptoms, setTextSymptoms] = useState('');
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
    // ✅ Validation is already correct
    if (!audioBlob && !selectedImage && !textSymptoms) {
      setError('Please provide symptoms via text, voice, or image.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ✅ PASS textSymptoms to API
      const response = await consultationService.medicalConsultation(
        selectedImage, 
        audioBlob,
        textSymptoms  // ✅ ADD THIS PARAMETER
      );
      
      setResult(response);

      // Save to Supabase database
      const consultationData = {
        user_id: user?.id ?? 'guest',
        consultation_type: (selectedImage && (audioBlob || textSymptoms)
          ? 'combined' 
          : selectedImage 
            ? 'image' 
            : 'voice') as 'combined' | 'image' | 'voice',
        transcription: response.transcription || null,
        analysis: response.analysis || null,
        audio_url: response.audio_url || null,
        image_url: selectedImage ? URL.createObjectURL(selectedImage) : null,
        status: 'completed' as const
      };

      const { data: savedConsultation, error: dbError } = await dbConsultationService.createConsultation(consultationData);

      if (dbError) {
        console.error('Error saving consultation to database:', dbError);
      } else {
        console.log('Consultation saved successfully:', savedConsultation);
      }
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
    setTextSymptoms('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Autofy Style Navigation */}
      <header className="sticky top-0 z-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between h-16 px-6">
              {/* Left - Logo/Brand */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">AI Doctor</span>
              </div>

              {/* Center - Navigation Links */}
              <nav className="hidden md:flex items-center gap-8">
                <Link 
                  to="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/consultation" 
                  className="text-emerald-600 font-semibold text-sm relative pb-1"
                >
                  Consultation
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full"></span>
                </Link>
                <Link 
                  to="/health-insights" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                >
                  Insights
                </Link>
                <Link 
                  to="/consultation-history" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                >
                  History
                </Link>
              </nav>

              {/* Right - Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-6 shadow-xl">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            AI Medical Consultation
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get instant AI-powered medical analysis by describing your symptoms or uploading medical images
          </p>
        </div>

        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-3xl p-8 sm:p-10 lg:p-12 shadow-xl">
          {!result ? (
            <div className="space-y-10">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}

              {/* ✅ NEW: Text Symptoms Section (MOVED TO TOP) */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Describe Your Symptoms</h3>
                    <p className="text-gray-600 text-sm">Type your health concerns in detail</p>
                  </div>
                </div>
                <textarea
                  value={textSymptoms}
                  onChange={(e) => setTextSymptoms(e.target.value)}
                  placeholder="Example: I have been experiencing a persistent headache and mild fever for the past 2 days. The headache is more severe in the mornings..."
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 placeholder-gray-400 resize-none"
                />
                <p className="text-gray-600 text-sm mt-2">
                  💡 <strong>Tip:</strong> Be specific about when symptoms started, their intensity, and any triggers.
                </p>
              </div>

              <div className="text-center">
                <p className="text-gray-500 font-medium mb-4">OR</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
                {/* Audio Recording Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 hover:bg-emerald-50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Record Symptoms</h3>
                      <p className="text-gray-600 text-sm">Describe your condition</p>
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
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25'
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
                        <p className="text-gray-600 text-sm">Click to start voice recording</p>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <p className="text-green-700 font-semibold text-lg flex items-center justify-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Audio recorded successfully
                          </p>
                        </div>
                        <button 
                          onClick={() => setAudioBlob(null)} 
                          className="text-red-600 border border-red-300 hover:bg-red-600 hover:text-white px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          Record Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 hover:bg-emerald-50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Upload Image</h3>
                      <p className="text-gray-600 text-sm">Medical scans or photos</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {!imagePreview ? (
                      <div
                        className="border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-white hover:bg-emerald-50 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 mb-2">Upload Medical Image</p>
                        <span className="text-gray-600 text-sm">JPG, PNG, GIF supported</span>
                      </div>
                    ) : (
                      <div className="relative group">
                        <img 
                          src={imagePreview} 
                          alt="Medical upload" 
                          className="w-full rounded-xl shadow-xl border border-gray-200"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-200 transform hover:scale-110 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
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
                  disabled={isLoading || (!audioBlob && !selectedImage && !textSymptoms)} // ✅ Changed this line
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-lg px-12 py-4 rounded-2xl flex items-center justify-center gap-3 mx-auto transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl shadow-emerald-500/25 min-w-[280px]"
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
                <p className="text-gray-600 text-sm mt-3">AI-powered medical consultation in seconds</p>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Results Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-4 shadow-xl">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-900">
                  Medical Analysis Results
                </h2>
                <p className="text-gray-600">AI-powered medical consultation complete</p>
              </div>
              
              {/* Transcription */}
              {result.transcription && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 hover:bg-gray-50 transition-all duration-300 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Your Symptoms</h3>
                      <p className="text-gray-600 text-sm">Transcribed from audio</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
                    <p className="text-gray-800 italic text-lg leading-relaxed font-medium">{result.transcription}</p>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">AI Doctor Analysis</h3>
                    <p className="text-gray-600 text-sm">Professional medical assessment</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <p className="text-lg leading-relaxed text-gray-800 font-medium">{result.analysis}</p>
                </div>
              </div>

              {/* Audio Response */}
              {result.audio_url && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center hover:bg-gray-50 transition-all duration-300 shadow-sm">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Audio Response</h3>
                      <p className="text-gray-600 text-sm">Listen to the diagnosis</p>
                    </div>
                  </div>
                  <button 
                    onClick={playAudio} 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-3 mx-auto transition-all duration-300 transform hover:scale-105 shadow-xl shadow-emerald-500/25"
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
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl shadow-emerald-500/25 min-w-[200px]"
                >
                  New Consultation
                </button>
                <Link 
                  to="/dashboard" 
                  className="bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg min-w-[200px] text-center"
                >
                  Back to Dashboard
                </Link>
              </div>

              {/* Enhanced Disclaimer */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-yellow-600 text-lg">⚠️</span>
                  </div>
                  <div>
                    <h4 className="text-yellow-800 font-semibold text-lg mb-2">Important Medical Disclaimer</h4>
                    <p className="text-yellow-700 leading-relaxed">
                      This AI analysis is for <strong className="text-yellow-800">educational and informational purposes only</strong>. 
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
  
