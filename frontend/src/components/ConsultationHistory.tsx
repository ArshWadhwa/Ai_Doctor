import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { consultationService, type Consultation } from '../services/database';
import { AsklepiosCross, ActionPlusButton } from './BrandElements';
import { 
  ArrowLeft, 
  Mic, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Volume2,
  X
} from 'lucide-react';

const ConsultationHistory: React.FC = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  useEffect(() => {
    const fetchAllConsultations = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await consultationService.getConsultations(user.id);
        if (error) {
          setError('Failed to load consultations');
        } else {
          setConsultations(data || []);
        }
      } catch (err) {
        setError('Failed to load consultations');
      } finally {
        setLoading(false);
      }
    };

    fetchAllConsultations();
  }, [user?.id]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Mic className="w-4 h-4 text-blue-600" />;
      case 'image':
        return <Upload className="w-4 h-4 text-sky-600" />;
      case 'combined':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      default:
        return <FileText className="w-4 h-4 text-blue-600" />;
    }
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
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Consultation
            </Link>
            <Link 
              to="/health-insights" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Insights
            </Link>
            <Link 
              to="/consultation-history" 
              className="text-sm font-semibold text-blue-600 relative py-1"
            >
              History
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            </Link>
            <Link 
              to="/profile" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Profile
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/consultation"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              New Consultation
            </Link>
          </div>
        </header>

        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              Consultation History
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Chronological log of clinical diagnostics, symptoms, and AI differential assessments
            </p>
          </div>
          <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm w-max">
            {consultations.length} Consultations Recorded
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <Loader className="w-10 h-10 animate-spin mx-auto mb-3 text-blue-600" />
            <p className="text-xs sm:text-sm font-semibold text-slate-700">Loading Clinical History...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <main className="bg-white rounded-3xl border border-slate-200/80 shadow-md divide-y divide-slate-100 overflow-hidden">
            {consultations.map((consultation) => (
              <div 
                key={consultation.id} 
                className="p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getTypeIcon(consultation.consultation_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {new Date(consultation.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono capitalize">
                        {consultation.consultation_type}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        Completed
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed max-w-3xl">
                      {(consultation.analysis || consultation.transcription || 'Consultation session')?.replace(/\*\*/g, '').replace(/\*/g, '')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedConsultation(consultation)}
                  className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-semibold transition-colors self-end md:self-center flex-shrink-0"
                >
                  View Full Report
                </button>
              </div>
            ))}

            {consultations.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <FileText size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No records found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Begin your first consultation to review diagnoses and recommendations here.
                </p>
                <Link
                  to="/consultation"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  <Mic size={14} />
                  <span>Start Consultation</span>
                </Link>
              </div>
            )}
          </main>
        )}

        {/* Modal: Full Report Details */}
        {selectedConsultation && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Diagnostic Session Detail</h3>
                  <p className="text-xs text-slate-500">
                    {new Date(selectedConsultation.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedConsultation(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              {selectedConsultation.transcription && (
                <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <h4 className="text-[11px] font-bold uppercase text-slate-400 mb-1">Reported Symptoms</h4>
                  <p className="text-xs sm:text-sm text-slate-800 italic">
                    "{selectedConsultation.transcription}"
                  </p>
                </div>
              )}

              <div className="mb-6 p-5 bg-blue-50/60 border border-blue-200/80 rounded-2xl">
                <h4 className="text-[11px] font-bold uppercase text-blue-700 mb-2">Clinical Differential Assessment</h4>
                <div className="text-xs sm:text-sm text-slate-900 whitespace-pre-line leading-relaxed">
                  {selectedConsultation.analysis?.replace(/\*\*/g, '').replace(/\*/g, '')}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedConsultation(null)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ConsultationHistory;