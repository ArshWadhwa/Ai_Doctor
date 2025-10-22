import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { consultationService, type Consultation } from '../services/database';
import { ArrowLeft, Mic, Upload, FileText, CheckCircle, Clock, AlertCircle, Brain, Loader } from 'lucide-react';

const ConsultationHistory: React.FC = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        return <Mic className="w-5 h-5 text-emerald-600" />;
      case 'image':
        return <Upload className="w-5 h-5 text-emerald-600" />;
      case 'text':
        return <FileText className="w-5 h-5 text-emerald-600" />;
      default:
        return <FileText className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
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
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                >
                  Consultation
                </Link>
                <Link 
                  to="/health-insights" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                >
                  Insights
                </Link>
                <Link 
                  to="/consultation-history" 
                  className="text-emerald-600 font-semibold text-sm relative pb-1"
                >
                  History
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full"></span>
                </Link>
              </nav>

              {/* Right - Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  to="/consultation"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all"
                >
                  New Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultation History</h1>
          <p className="text-gray-600">
            View all your past consultations and health records
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-gray-600">Loading your consultations...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Consultations List */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">All Consultations</h2>
                <span className="text-sm text-gray-600">{consultations.length} total</span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getTypeIcon(consultation.consultation_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(consultation.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {getStatusIcon(consultation.status)}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {consultation.analysis || consultation.transcription || `${consultation.consultation_type} consultation`}
                      </p>
                    </div>
                    <button className="text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}

              {consultations.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No consultations yet</h3>
                  <p className="text-gray-600 mb-4">Start your first consultation to see your health journey here.</p>
                  <Link
                    to="/consultation"
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Start Consultation
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ConsultationHistory;