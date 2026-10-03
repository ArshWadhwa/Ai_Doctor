import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AsklepiosCross, ActionPlusButton } from './BrandElements';
import { 
  User, 
  LogOut, 
  Mic, 
  Upload, 
  History, 
  Calendar, 
  FileText,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { 
  consultationService, 
  healthMetricsService, 
  profileService, 
  type Consultation, 
  type UserProfile 
} from '../services/database';

interface DashboardStats {
  totalConsultations: number;
  monthlyConsultations: number;
  completedConsultations: number;
  healthInsights: number;
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalConsultations: 0,
    monthlyConsultations: 0,
    completedConsultations: 0,
    healthInsights: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const { data: profile, error: profileError } = await profileService.getProfile(user.id);
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows')) {
            const { data: newProfile, error: createError } = await profileService.upsertProfile({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            if (!createError) {
              setUserProfile(newProfile);
            }
          }
        } else {
          setUserProfile(profile);
        }

        // Fetch recent consultations
        const { data: consultationsData, error: consultationsError } = await consultationService.getConsultations(user.id, 6);
        if (consultationsError) {
          setError('Failed to load consultations');
        } else {
          setConsultations(consultationsData || []);
        }

        // Fetch stats
        const stats = await consultationService.getConsultationStats(user.id);
        if (!stats.error) {
          setDashboardStats(prev => ({
            ...prev,
            totalConsultations: stats.total,
            monthlyConsultations: stats.thisMonth,
            completedConsultations: stats.completed,
          }));
        }

        // Fetch health insights
        const { commonSymptoms, error: healthError } = await healthMetricsService.getHealthInsights(user.id);
        if (!healthError) {
          setDashboardStats(prev => ({
            ...prev,
            healthInsights: commonSymptoms.length
          }));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getDisplayName = () => {
    return userProfile?.full_name || 
           user?.user_metadata?.full_name || 
           user?.email?.split('@')[0] || 
           'User';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'voice': return <Mic className="w-4 h-4 text-blue-600" />;
      case 'image': return <Upload className="w-4 h-4 text-sky-600" />;
      case 'combined': return <FileText className="w-4 h-4 text-indigo-600" />;
      default: return <FileText className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#edf2f7] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center max-w-sm w-full">
          <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-800">Synchronizing Clinical Profile...</p>
          <p className="text-xs text-slate-500 mt-1">Loading your Medly intelligence dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf2f7] py-4 sm:py-6 px-2 sm:px-6 lg:px-8 antialiased text-slate-900 flex flex-col items-center">
      <div className="w-full max-w-[1400px] flex flex-col gap-6">
        
        {/* Navigation Bar */}
        <header className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm px-6 sm:px-8 py-4 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-9 h-9 flex items-center justify-center text-slate-900 group-hover:rotate-90 transition-transform">
              <AsklepiosCross size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Medly
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            <Link 
              to="/dashboard" 
              className="text-sm font-semibold text-blue-600 relative py-1"
            >
              Dashboard
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            </Link>
            <Link 
              to="/consultation" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              New Consultation
            </Link>
            <Link 
              to="/health-insights" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Health Insights
            </Link>
            <Link 
              to="/consultation-history" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              History
            </Link>
            <Link 
              to="/profile" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Profile
            </Link>
          </nav>

          {/* User & Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 transition-colors"
            >
              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                {getDisplayName().charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                {getDisplayName()}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Log out"
            >
              <LogOut size={18} />
            </button>

            <ActionPlusButton to="/consultation" size="sm" title="Start Consultation" />
          </div>
        </header>

        {/* Welcome Section */}
        <section className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-blue-100/40 via-sky-50/20 to-transparent -mr-20 -mt-20 pointer-events-none rounded-full" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  AI Medical Assistant Ready
                </span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <ShieldCheck size={14} className="text-blue-600" /> Private & Secure
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                Welcome back, {getDisplayName()}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                Your personal health dashboard. Record voice symptoms, upload medical images, or review your past consultation records and insights.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/consultation"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Start Consultation</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
            {[
              { label: 'Total Consultations', value: dashboardStats.totalConsultations, icon: FileText, color: 'text-blue-600 bg-blue-50' },
              { label: 'This Month', value: dashboardStats.monthlyConsultations, icon: Calendar, color: 'text-sky-600 bg-sky-50' },
              { label: 'Completed Diagnoses', value: dashboardStats.completedConsultations, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Tracked Health Insights', value: dashboardStats.healthInsights, icon: Activity, color: 'text-indigo-600 bg-indigo-50' }
            ].map((stat, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 font-mono leading-none">{stat.value}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Launch Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/consultation"
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Mic size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Voice Consultation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Describe symptoms naturally using your microphone with real-time Whisper transcription.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs font-semibold text-blue-600">
              <span>Launch Mic</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/consultation"
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Upload size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Upload Medical Scans</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Drop X-rays, MRI slices, or dermatological photographs for automated computer vision detection.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs font-semibold text-sky-600">
              <span>Scan Analyzer</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/health-insights"
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Activity size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Health Graph & ICD-10</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                View longitudinal trend analysis, recurrent symptoms, and personalized wellness recommendations.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs font-semibold text-indigo-600">
              <span>View Insights</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </section>

        {/* Recent Consultations List */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Consultations</h2>
              <p className="text-xs text-slate-500">Your latest diagnostic sessions and reports</p>
            </div>
            <Link
              to="/consultation-history"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {consultations.map((consultation) => (
              <div key={consultation.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-2 rounded-2xl transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getTypeIcon(consultation.consultation_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-900">
                        {new Date(consultation.created_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono capitalize">
                        {consultation.consultation_type}
                      </span>
                      {consultation.status === 'completed' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                          Completed
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                          {consultation.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 max-w-2xl leading-relaxed">
                      {(consultation.analysis || consultation.transcription || 'Consultation session')?.replace(/\*\*/g, '').replace(/\*/g, '')}
                    </p>
                  </div>
                </div>

                <Link
                  to="/consultation-history"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 w-max self-end sm:self-center transition-colors"
                >
                  Review Diagnosis →
                </Link>
              </div>
            ))}

            {consultations.length === 0 && (
              <div className="py-12 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <FileText size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No consultations on file yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Start your first voice or scan session to populate your personal diagnostic log.
                </p>
                <Link
                  to="/consultation"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  <Mic size={14} />
                  <span>Start First Consultation</span>
                </Link>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;