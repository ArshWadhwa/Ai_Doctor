import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  LogOut, 
  Mic, 
  Upload, 
  History, 
  Calendar, 
  FileText,
  Stethoscope,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain
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

  // Fetch real data from Supabase
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
          // If profile doesn't exist, create one
          if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows')) {
            console.log('Profile not found, creating new profile...');
            const { data: newProfile, error: createError } = await profileService.upsertProfile({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            if (createError) {
              console.error('Error creating profile:', createError);
            } else {
              setUserProfile(newProfile);
            }
          }
        } else {
          setUserProfile(profile);
        }

        // Fetch recent consultations
        const { data: consultationsData, error: consultationsError } = await consultationService.getConsultations(user.id, 5);
        if (consultationsError) {
          console.error('Error fetching consultations:', consultationsError);
          setError('Failed to load consultations');
        } else {
          setConsultations(consultationsData || []);
        }

        // Fetch consultation stats
        const stats = await consultationService.getConsultationStats(user.id);
        if (stats.error) {
          console.error('Error fetching stats:', stats.error);
        } else {
          setDashboardStats({
            totalConsultations: stats.total,
            monthlyConsultations: stats.thisMonth,
            completedConsultations: stats.completed,
            healthInsights: 0 // Will be updated with health metrics
          });
        }

        // Fetch health insights
        const { commonSymptoms, error: healthError } = await healthMetricsService.getHealthInsights(user.id);
        if (healthError) {
          console.error('Error fetching health insights:', healthError);
        } else {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'voice': return <Mic className="w-4 h-4" />;
      case 'image': return <Upload className="w-4 h-4" />;
      case 'combined': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getDisplayName = () => {
  return userProfile?.full_name || 
         user?.user_metadata?.full_name || 
         user?.email?.split('@')[0] || 
         'User';
};

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-medical-green" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
                  className="text-emerald-600 font-semibold text-sm relative pb-1"
                >
                  Dashboard
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full"></span>
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
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                >
                  History
                </Link>
                <Link 
                  to="/profile" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                >
                  Profile
                </Link>
              </nav>

              {/* Right - User Menu & Actions */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{getDisplayName()}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {getDisplayName()}!
          </h1>
          <p className="text-gray-600">
            Track your consultations, manage your health records, and get AI-powered medical insights.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalConsultations}</p>
                <p className="text-gray-600 text-sm">Total Consultations</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.monthlyConsultations}</p>
                <p className="text-gray-600 text-sm">This Month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.completedConsultations}</p>
                <p className="text-gray-600 text-sm">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/consultation"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Start Consultation</h3>
                  <p className="text-white/80 text-sm">Record symptoms & get AI analysis</p>
                </div>
              </div>
            </Link>

            <Link 
              to="/consultation-history" 
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <History className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">View History</h3>
                  <p className="text-gray-600 text-sm">Browse past consultations</p>
                </div>
              </div>
            </Link>

            <Link
              to="/health-insights"
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Health Insights</h3>
                  <p className="text-gray-600 text-sm">AI-powered health analysis</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Consultations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Consultations</h2>
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
                        {new Date(consultation.created_at).toLocaleDateString()}
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
          </div>
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
      </main>
    </div>
  );
};

export default Dashboard;