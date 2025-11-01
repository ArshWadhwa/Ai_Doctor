import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/database';
import { API_BASE_URL } from '../services/api';
import { 
  ArrowLeft, 
  Brain, 
  RefreshCw, 
  Loader, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  Heart,
  CheckCircle,
  Trash2,
  Activity,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  PieChart,
  BarChart3
} from 'lucide-react';

interface HealthRecommendation {
  id: string;
  issue: string;
  advice: string;
  urgency: 'low' | 'medium' | 'high';
  consultation_count: number;
  created_at: string;
}

const HealthInsights: React.FC = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<HealthRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [totalConsultations, setTotalConsultations] = useState(0);
  const [hasNewConsultations, setHasNewConsultations] = useState(false);
  const [consultationHistory, setConsultationHistory] = useState<any[]>([]);

  const fetchStoredInsights = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      setInfoMessage(null);
      
      const response = await fetch(`${API_BASE_URL}/api/health-insights/${user.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setInsights(data.insights || []);
      setTotalConsultations(data.consultation_count || 0);
      
      // Show appropriate messages based on source
      if (data.source === 'extracted_from_consultations') {
        setInfoMessage('✓ Personalized insights generated from your consultation history');
      } else if (data.source === 'general_health_guidelines') {
        setInfoMessage('📋 General wellness recommendations provided - Complete consultations for personalized insights');
      }
      
    } catch (err) {
      console.error('Error fetching stored insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewConsultations = async () => {
    if (!user?.id) return;
    
    try {
      const { data: consultations } = await supabase
        .from('consultations')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setTotalConsultations(consultations?.length || 0);
      setConsultationHistory(consultations || []);
      
      // Check if there are consultations newer than the latest insight
      if (insights.length > 0 && consultations && consultations.length > 0) {
        const latestConsultation = new Date(consultations[0].created_at);
        const latestInsight = new Date(insights[0].created_at);
        setHasNewConsultations(latestConsultation > latestInsight);
      } else if (consultations && consultations.length > 0 && insights.length === 0) {
        setHasNewConsultations(true);
      }
    } catch (err) {
      console.error('Error checking consultations:', err);
    }
  };

  const generateInsights = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/health-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      setInsights(data.insights || []);
      setTotalConsultations(data.consultation_count || 0);
      setHasNewConsultations(false);
      
      // Show message based on source
      if (data.source === 'extracted_from_consultations') {
        setInfoMessage('✓ Updated insights generated from your latest consultations');
      } else if (data.source === 'comprehensive_wellness_guide') {
        setInfoMessage('📚 Comprehensive wellness guide provided - Complete more consultations for personalized insights');
      }
      
    } catch (err) {
      console.error('Health insights error:', err);
      setError(`Failed to generate health insights: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteInsight = async (insightId: string) => {
    // For the simplified approach, just remove from UI
    setInsights(insights.filter(insight => insight.id !== insightId));
  };

  useEffect(() => {
    if (user?.id) {
      fetchStoredInsights();
      checkForNewConsultations();
    }
  }, [user?.id]); // Remove checkForNewConsultations from dependencies

  useEffect(() => {
    if (insights.length > 0) {
      checkForNewConsultations();
    }
  }, [insights]); // Separate effect for checking consultations when insights change

  // Calculate real chart data from actual consultations and insights
  const getChartData = () => {
    const now = new Date();
    const months: string[] = [];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Get last 8 months
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthLabels[date.getMonth()]);
    }
    
    // Count consultations and high priority insights per month
    const totalData = new Array(8).fill(0);
    const highPriorityData = new Array(8).fill(0);
    
    // Process consultations
    consultationHistory.forEach((consultation) => {
      const date = new Date(consultation.created_at);
      const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      
      if (monthDiff >= 0 && monthDiff < 8) {
        const index = 7 - monthDiff;
        totalData[index]++;
      }
    });
    
    // Process high priority insights
    insights.forEach((insight) => {
      const date = new Date(insight.created_at);
      const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      
      if (monthDiff >= 0 && monthDiff < 8 && insight.urgency === 'high') {
        const index = 7 - monthDiff;
        highPriorityData[index]++;
      }
    });
    
    // Calculate cumulative values for better visualization
    const cumulativeTotal = totalData.map((val, idx) => 
      totalData.slice(0, idx + 1).reduce((a, b) => a + b, 0)
    );
    const cumulativeHigh = highPriorityData.map((val, idx) => 
      highPriorityData.slice(0, idx + 1).reduce((a, b) => a + b, 0)
    );
    
    return { 
      months, 
      totalData: cumulativeTotal, 
      highPriorityData: cumulativeHigh,
      maxValue: Math.max(...cumulativeTotal, 30) // Ensure minimum scale of 30
    };
  };

  const chartData = getChartData();
  
  // Calculate SVG points for polyline
  const getChartPoints = (data: number[], maxValue: number) => {
    const baseY = 180;
    const maxY = 0;
    const xStep = 70;
    const xStart = 60;
    
    return data.map((value, index) => {
      const x = xStart + index * xStep;
      const y = baseY - ((value / maxValue) * (baseY - maxY));
      return `${x},${y}`;
    }).join(' ');
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
                  className="text-emerald-600 font-semibold text-sm relative pb-1"
                >
                  Insights
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full"></span>
                </Link>
                <Link 
                  to="/profile" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                >
                  Profile
                </Link>
              </nav>

              {/* Right - Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={generateInsights}
                  disabled={loading}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
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

          {/* Optional: Badge for new insights */}
          {hasNewConsultations && (
            <div className="mt-3 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 text-sm rounded-full shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">New insights available</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Info Message */}
        {infoMessage && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-800 text-sm">{infoMessage}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-600" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Health Data</h3>
            <p className="text-gray-600">Extracting personalized insights...</p>
          </div>
        )}

        {/* Main Content Grid */}
        {!loading && insights.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Chart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Chart Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Health Insights Trend</h2>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-gray-600">Total ({chartData.totalData[chartData.totalData.length - 1] || 0})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-gray-600">High Priority ({chartData.highPriorityData[chartData.highPriorityData.length - 1] || 0})</span>
                    </div>
                  </div>
                </div>
                
                {/* Dynamic Line Chart Visualization */}
                <div className="relative h-64">
                  <svg className="w-full h-full" viewBox="0 0 600 200">
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={`grid-${i}`}
                        x1="40"
                        y1={180 - i * 45}
                        x2="580"
                        y2={180 - i * 45}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                      />
                    ))}
                    
                    {/* Y-axis labels */}
                    {[0, 1, 2, 3, 4].map((i) => {
                      const value = Math.round((chartData.maxValue / 4) * i);
                      return (
                        <text
                          key={`y-label-${i}`}
                          x="30"
                          y={185 - i * 45}
                          fontSize="12"
                          fill="#6B7280"
                          textAnchor="end"
                        >
                          {value}
                        </text>
                      );
                    })}
                    
                    {/* Total line (green) */}
                    <polyline
                      points={getChartPoints(chartData.totalData, chartData.maxValue)}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points={`${getChartPoints(chartData.totalData, chartData.maxValue)} 550,180 60,180`}
                      fill="url(#greenGradient)"
                      opacity="0.1"
                    />
                    
                    {/* High Priority line (amber) */}
                    <polyline
                      points={getChartPoints(chartData.highPriorityData, chartData.maxValue)}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points={`${getChartPoints(chartData.highPriorityData, chartData.maxValue)} 550,180 60,180`}
                      fill="url(#yellowGradient)"
                      opacity="0.1"
                    />
                    
                    {/* Data points - Total */}
                    {chartData.totalData.map((value, i) => {
                      const x = 60 + i * 70;
                      const y = 180 - ((value / chartData.maxValue) * 180);
                      return (
                        <g key={`total-point-${i}`}>
                          <circle
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#10B981"
                          />
                          {value > 0 && (
                            <text
                              x={x}
                              y={y - 10}
                              fontSize="10"
                              fill="#10B981"
                              textAnchor="middle"
                              fontWeight="bold"
                            >
                              {value}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    
                    {/* Data points - High Priority */}
                    {chartData.highPriorityData.map((value, i) => {
                      const x = 60 + i * 70;
                      const y = 180 - ((value / chartData.maxValue) * 180);
                      return (
                        <circle
                          key={`high-point-${i}`}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#F59E0B"
                        />
                      );
                    })}
                    
                    {/* X-axis labels */}
                    {chartData.months.map((month, i) => (
                      <text
                        key={`x-label-${month}-${i}`}
                        x={60 + i * 70}
                        y="195"
                        fontSize="12"
                        fill="#6B7280"
                        textAnchor="middle"
                      >
                        {month}
                      </text>
                    ))}
                    
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {totalConsultations === 0 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Complete consultations to see your health insights trend over time
                  </p>
                )}
              </div>

              {/* First Insight Card (Left side, bottom) */}
              {insights[0] && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Heart className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">Health Recommendation</h3>
                        <button
                          onClick={() => deleteInsight(insights[0].id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-3">
                        {insights[0].urgency?.toUpperCase()} PRIORITY
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-4">{insights[0].advice}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                        <span className="font-medium">AI-Powered Insight</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Insight Cards */}
            <div className="space-y-4">
              {insights.slice(1, 4).map((insight, index) => (
                <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      insight.urgency === 'high' ? 'bg-gradient-to-br from-red-100 to-red-200' :
                      insight.urgency === 'medium' ? 'bg-gradient-to-br from-yellow-100 to-yellow-200' :
                      'bg-gradient-to-br from-blue-100 to-blue-200'
                    }`}>
                      {index === 0 ? <Heart className="w-6 h-6 text-yellow-600" /> :
                       index === 1 ? <Shield className="w-6 h-6 text-blue-600" /> :
                       <Activity className="w-6 h-6 text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 text-sm">{insight.issue}</h3>
                        <button
                          onClick={() => deleteInsight(insight.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {index === 0 && (
                        <span className="inline-block px-2.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold mb-2">
                          MEDIUM PRIORITY
                        </span>
                      )}
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{insight.advice}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && insights.length === 0 && !error && !infoMessage && (
          <div className="text-center py-20">
            <Brain className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Health Insights Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Complete your first consultation to receive personalized health recommendations powered by AI.
            </p>
            <Link 
              to="/consultation"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-lg transition-all"
            >
              <Activity className="w-5 h-5" />
              Start Your First Consultation
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default HealthInsights;