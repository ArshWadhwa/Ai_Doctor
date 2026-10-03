import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AsklepiosCross, ActionPlusButton } from './BrandElements';
import { consultationService as dbConsultationService } from '../services/database';
import { 
  Mic, 
  MicOff, 
  Upload, 
  X, 
  ArrowLeft, 
  Play, 
  Pause,
  Loader,
  CheckCircle2,
  Sparkles,
  Volume2,
  AlertCircle,
  FileText,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { consultationService, API_BASE_URL } from '../services/api';

interface ConsultationResult {
  transcription: string;
  analysis: string;
  audio_url?: string;
}

const ConsultationPage: React.FC = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
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
        if (timerRef.current) clearInterval(timerRef.current);
      };

      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone. Please check your browser audio permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
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
    if (!audioBlob && !selectedImage && !textSymptoms.trim()) {
      setError('Please provide symptoms via voice recording, clinical text, or medical imaging.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await consultationService.medicalConsultation(
        selectedImage, 
        audioBlob,
        textSymptoms
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
        transcription: response.transcription || (textSymptoms ? textSymptoms : null),
        analysis: response.analysis || null,
        audio_url: response.audio_url || null,
        image_url: selectedImage ? URL.createObjectURL(selectedImage) : null,
        status: 'completed' as const
      };

      await dbConsultationService.createConsultation(consultationData);
    } catch (err) {
      setError('Diagnostic processing encountered an issue. Please verify backend connectivity.');
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
    setRecordingSeconds(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] py-4 sm:py-6 px-2 sm:px-6 lg:px-8 antialiased text-slate-900 flex flex-col items-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-6">
        
        {/* Navigation Bar */}
        <header className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm px-6 sm:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-9 h-9 flex items-center justify-center text-slate-900 group-hover:rotate-90 transition-transform">
              <AsklepiosCross size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Medly
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <Link 
              to="/dashboard" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/consultation" 
              className="text-sm font-semibold text-blue-600 relative py-1"
            >
              Consultation
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            </Link>
            <Link 
              to="/health-insights" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Insights
            </Link>
            <Link 
              to="/consultation-history" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              History
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Header Hero Title */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
            <Sparkles size={14} /> Multi-Modal Diagnostic Console
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 tracking-tight">
            AI Clinical Consultation
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl mx-auto">
            Provide symptoms by recording your voice, typing clinical notes, or attaching medical images. Medly generates differential assessment with ICD-10 coding.
          </p>
        </div>

        {/* Main Consultation Card */}
        <main className="bg-white rounded-3xl sm:rounded-[36px] border border-slate-200/80 shadow-xl p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle size={18} className="flex-shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          {!result ? (
            <div className="space-y-8">
              {/* Text Description Box */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Symptom Description</h3>
                      <p className="text-[11px] text-slate-500">Provide details regarding onset, severity, and triggers</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Text or Spoken</span>
                </div>

                <textarea
                  value={textSymptoms}
                  onChange={(e) => setTextSymptoms(e.target.value)}
                  placeholder="e.g. Sharp pain in lower right abdomen starting 4 hours ago, accompanied by low-grade fever and mild nausea..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none"
                />
              </div>

              {/* Two Column Grid: Voice & Image Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Voice Recording Box */}
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                          <Mic size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Voice Note</h3>
                          <p className="text-[11px] text-slate-500">Natural spoken audio recording</p>
                        </div>
                      </div>
                      {isRecording && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-mono font-bold rounded-full animate-pulse flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-600" />
                          {formatSeconds(recordingSeconds)}
                        </span>
                      )}
                    </div>

                    {!audioBlob ? (
                      <div className="py-4 text-center">
                        {isRecording ? (
                          <div className="space-y-4">
                            {/* Visual Waveform Simulation */}
                            <div className="h-16 bg-white rounded-2xl border border-slate-200 p-3 flex items-center justify-center gap-1">
                              {[35, 70, 45, 90, 60, 40, 85, 95, 65, 40, 80, 50, 75, 90, 40].map((h, i) => (
                                <div
                                  key={i}
                                  className="w-1.5 bg-red-500 rounded-full animate-pulse"
                                  style={{
                                    height: `${Math.min(h, 90)}%`,
                                    animationDuration: `${0.4 + (i % 5) * 0.15}s`
                                  }}
                                />
                              ))}
                            </div>
                            <button
                              onClick={stopRecording}
                              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-500/20 active:scale-95 transition-all"
                            >
                              <MicOff size={16} />
                              <span>Stop Recording ({formatSeconds(recordingSeconds)})</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <button
                              onClick={startRecording}
                              disabled={isLoading}
                              className="w-full py-4 px-4 bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-slate-800 hover:text-blue-700 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                            >
                              <Mic size={18} className="text-blue-600" />
                              <span>Click to Record Symptoms</span>
                            </button>
                            <p className="text-[11px] text-slate-400">Speak clearly near your microphone</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-2xl border border-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                          <CheckCircle2 size={16} />
                          <span>Voice Recording Saved</span>
                        </div>
                        <button
                          onClick={() => setAudioBlob(null)}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          Re-record
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical Scan Dropzone */}
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sky-600">
                          <Upload size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Medical Imaging</h3>
                          <p className="text-[11px] text-slate-500">X-Rays, Derm photos, MRI slices</p>
                        </div>
                      </div>
                    </div>

                    {!imagePreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all group"
                      >
                        <Upload size={24} className="mx-auto text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                        <p className="text-xs font-bold text-slate-800">Attach Medical Image</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, DICOM preview supported</p>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                        <img 
                          src={imagePreview} 
                          alt="Medical scan preview" 
                          className="w-full h-36 object-contain"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors"
                          title="Remove Scan"
                        >
                          <X size={14} />
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

              {/* Submit CTA */}
              <div className="pt-4 flex flex-col items-center">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || (!audioBlob && !selectedImage && !textSymptoms.trim())}
                  className="w-full sm:w-auto min-w-[320px] py-4 px-8 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-sm sm:text-base rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5"
                >
                  {isLoading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      <span>Synthesizing Clinical Analysis...</span>
                    </>
                  ) : (
                    <>
                      <AsklepiosCross size={18} color="#ffffff" />
                      <span>Generate AI Diagnostic Analysis</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 mt-2">
                  Powered by Whisper speech recognition, Llama 4 Scout vision AI, and ElevenLabs voice
                </p>
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Clinical Diagnostic Report</h2>
                    <p className="text-xs text-slate-500">Completed by Medly AI Intelligence Node</p>
                  </div>
                </div>

                <button
                  onClick={resetConsultation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw size={14} />
                  <span>New Session</span>
                </button>
              </div>

              {/* Patient Symptom Transcript */}
              {result.transcription && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Patient Input & Transcription
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed">
                    "{result.transcription}"
                  </p>
                </div>
              )}

              {/* Primary AI Doctor Analysis */}
              <div className="p-6 sm:p-8 rounded-3xl bg-blue-50/60 border border-blue-200/80">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Clinical Differential Assessment
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                    Diagnostic Analysis Complete
                  </span>
                </div>

                <div className="text-slate-900 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal">
                  {result.analysis?.replace(/\*\*/g, '').replace(/\*/g, '')}
                </div>
              </div>

              {/* AI Doctor Spoken Audio Playback */}
              {result.audio_url && (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                      <Volume2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Spoken Doctor Response</h4>
                      <p className="text-xs text-slate-500">Audio playback of clinical insights</p>
                    </div>
                  </div>

                  <button
                    onClick={playAudio}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    {isPlayingAudio ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isPlayingAudio ? 'Pause Response' : 'Listen to Diagnosis'}</span>
                  </button>

                  <audio
                    ref={audioRef}
                    src={`${API_BASE_URL}${result.audio_url}`}
                    onEnded={() => setIsPlayingAudio(false)}
                    onPause={() => setIsPlayingAudio(false)}
                  />
                </div>
              )}

              {/* Next Steps Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={resetConsultation}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
                >
                  Start Another Consultation
                </button>
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl font-semibold text-sm text-center transition-colors"
                >
                  Return to Dashboard
                </Link>
              </div>

              {/* Clinical Notice Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Clinical Notice:</strong> This analysis is intended for clinical education and triage support. For emergency symptoms such as chest compression or stroke signs, please seek immediate emergency care.
                </p>
              </div>

            </div>
          )}

        </main>

      </div>
    </div>
  );
};

export default ConsultationPage;
