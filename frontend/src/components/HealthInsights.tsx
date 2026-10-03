import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/database';
import { API_BASE_URL } from '../services/api';
import { AsklepiosCross } from './BrandElements';
import { 
  ArrowLeft, 
  RefreshCw, 
  Loader, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp,
  Heart,
  CheckCircle2,
  Trash2,
  Activity,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  PieChart,
  BarChart3,
  MessageSquare,
  Send,
  Ban,
  Bot,
  User as UserIcon,
  X
} from 'lucide-react';

interface HealthRecommendation {
  id: string;
  issue: string;
  advice: string;
  full_advice?: string;
  symptoms?: string;
  avoid?: string;
  urgency: 'low' | 'medium' | 'high';
  consultation_count: number;
  created_at: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const HealthInsights: React.FC = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<HealthRecommendation[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<HealthRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [totalConsultations, setTotalConsultations] = useState(0);
  const [hasNewConsultations, setHasNewConsultations] = useState(false);
  const [consultationHistory, setConsultationHistory] = useState<any[]>([]);

  // Health History Chatbot State with localStorage persistence
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`medly_insights_chat_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          // ignore corrupted json
        }
      }
    }
    return [
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Hello! I am your Medly Clinical Records Assistant. Ask me anything about your past consultations — such as when you had an illness, what medications or home care you discussed, or specific activities and foods you should avoid.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Sync from localStorage if user ID becomes available after mount
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`medly_insights_chat_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChatMessages(parsed);
          }
        } catch (e) {}
      }
    }
  }, [user?.id]);

  // Persist chat messages to localStorage whenever they update
  useEffect(() => {
    if (user?.id && chatMessages.length > 0) {
      localStorage.setItem(`medly_insights_chat_${user.id}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, user?.id]);

  const handleClearChat = () => {
    if (user?.id) {
      localStorage.removeItem(`medly_insights_chat_${user.id}`);
    }
    setChatMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Chat history cleared. How can I help you with your consultation records today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = (presetText || chatInput).trim();
    if (!textToSend || !user?.id || chatLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    if (!presetText) setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/health-insights/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, message: textToSend })
      });
      const data = await response.json();
      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || "I couldn't process your question at this moment. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "Could not reach the assistant service. Please ensure your backend server is running.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

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
    setInsights(insights.filter(insight => insight.id !== insightId));
  };

  useEffect(() => {
    if (user?.id) {
      fetchStoredInsights();
      checkForNewConsultations();
    }
  }, [user?.id]);

  useEffect(() => {
    if (insights.length > 0) {
      checkForNewConsultations();
    }
  }, [insights]);

  const getChartData = () => {
    const now = new Date();
    const months: string[] = [];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthLabels[date.getMonth()]);
    }
    
    const totalData = new Array(8).fill(0);
    const highPriorityData = new Array(8).fill(0);
    
    consultationHistory.forEach((consultation) => {
      const date = new Date(consultation.created_at);
      const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      if (monthDiff >= 0 && monthDiff < 8) {
        const index = 7 - monthDiff;
        totalData[index]++;
      }
    });
    
    insights.forEach((insight) => {
      const date = new Date(insight.created_at);
      const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      if (monthDiff >= 0 && monthDiff < 8 && insight.urgency === 'high') {
        const index = 7 - monthDiff;
        highPriorityData[index]++;
      }
    });
    
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
      maxValue: Math.max(...cumulativeTotal, 30)
    };
  };

  const chartData = getChartData();
  
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
              className="text-sm font-semibold text-blue-600 relative py-1"
            >
              Insights
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
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

          <div className="flex items-center gap-3">
            <button
              onClick={generateInsights}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Update Analysis</span>
            </button>
            <Link
              to="/consultation"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              New Session
            </Link>
          </div>
        </header>

        {/* Page Title & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              Longitudinal Health Insights
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Predictive health patterns, recurrence analysis, and AI-recommended lifestyle interventions
            </p>
          </div>
          {hasNewConsultations && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-xl shadow-sm">
              <Sparkles size={14} />
              <span>New Consultations Detected - Click Update</span>
            </div>
          )}
        </div>

        {/* Error / Feedback */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-blue-800 text-xs font-medium">
            <Info size={16} className="text-blue-600 flex-shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
            <Loader className="w-10 h-10 animate-spin mx-auto mb-3 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Synthesizing Health Graph...</h3>
            <p className="text-xs text-slate-500 mt-1">Cross-referencing consultation records</p>
          </div>
        )}

        {!loading && insights.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Chart */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Diagnostic Frequency Trend</h2>
                    <p className="text-xs text-slate-500">Cumulative consultations and high-priority flags</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                      <span className="text-slate-600">Total Visits</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      <span className="text-slate-600">Urgent</span>
                    </div>
                  </div>
                </div>

                {/* SVG Line Chart */}
                <div className="relative h-60 w-full overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 600 200">
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0062ff" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#0062ff" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={i}
                        x1="40"
                        y1={180 - i * 45}
                        x2="580"
                        y2={180 - i * 45}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                    ))}

                    <polyline
                      points={getChartPoints(chartData.totalData, chartData.maxValue)}
                      fill="none"
                      stroke="#0062ff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points={`${getChartPoints(chartData.totalData, chartData.maxValue)} 550,180 60,180`}
                      fill="url(#blueGrad)"
                    />

                    <polyline
                      points={getChartPoints(chartData.highPriorityData, chartData.maxValue)}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {chartData.months.map((month, i) => (
                      <text
                        key={i}
                        x={60 + i * 70}
                        y="195"
                        fontSize="11"
                        fill="#94a3b8"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {month}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Primary Featured Recommendation */}
              {insights[0] && (
                <div 
                  onClick={() => setSelectedInsight(insights[0])}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Heart size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{insights[0].issue || 'Primary Clinical Finding'}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Recorded: {new Date(insights[0].created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteInsight(insights[0].id);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        title="Dismiss insight"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        insights[0].urgency === 'high' ? 'bg-red-100 text-red-800' :
                        insights[0].urgency === 'medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {insights[0].urgency} Priority
                      </span>
                      {insights[0].consultation_count > 1 && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          Recurred in {insights[0].consultation_count} consultations
                        </span>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                      <span className="font-semibold text-slate-900">Clinical Recommendation: </span>
                      {insights[0].advice}
                    </div>

                    {insights[0].avoid && (
                      <div className="mb-4 p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 shadow-sm">
                        <Ban size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-950 leading-relaxed">
                          <span className="font-bold text-amber-900">What to Avoid: </span>
                          {insights[0].avoid}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-blue-600" />
                        <span>Synthesized doctor notes</span>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        View full details <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Other Insights */}
            <div className="space-y-4">
              {insights.slice(1, 5).map((insight, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedInsight(insight)}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{insight.issue}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteInsight(insight.id);
                      }}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      title="Dismiss insight"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      insight.urgency === 'high' ? 'bg-red-100 text-red-800' :
                      insight.urgency === 'medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {insight.urgency}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(insight.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-2">{insight.advice}</p>
                  {insight.avoid && (
                    <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-amber-900 mb-2">
                      <Ban size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-tight">
                        <strong className="text-amber-950 font-semibold">Avoid: </strong>
                        {insight.avoid}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-medium">
                    <span>Click to read full details</span>
                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Records Q&A Assistant */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-950">Ask Your Health History</h2>
                <p className="text-xs text-slate-500">Inquire about past symptoms, diagnosis dates, medications, and what you should avoid</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {chatMessages.length > 1 && (
                <button
                  onClick={handleClearChat}
                  className="text-xs text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100"
                  title="Reset conversation history"
                >
                  <Trash2 size={13} />
                  <span>Reset chat</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 w-fit">
                <Sparkles size={13} />
                <span>Consultation AI Assistant</span>
              </div>
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="pt-4 pb-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Suggested Inquiries:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSendChatMessage("Based on my previous consultations, what should I avoid doing?")}
                className="text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 rounded-xl px-3.5 py-2 transition-all hover:scale-[1.01] active:scale-[0.99] text-left font-medium"
              >
                🚫 What should I avoid doing?
              </button>
              <button
                onClick={() => handleSendChatMessage("When did I report having a fever or illness, and what was noted?")}
                className="text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 rounded-xl px-3.5 py-2 transition-all hover:scale-[1.01] active:scale-[0.99] text-left font-medium"
              >
                📅 When did I have that illness / fever?
              </button>
              <button
                onClick={() => handleSendChatMessage("What remedies and precautions were recommended for my back pain?")}
                className="text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 rounded-xl px-3.5 py-2 transition-all hover:scale-[1.01] active:scale-[0.99] text-left font-medium"
              >
                🩺 What advice was given for my back pain?
              </button>
              <button
                onClick={() => handleSendChatMessage("Summarize my recurring symptoms and health patterns across all sessions.")}
                className="text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 rounded-xl px-3.5 py-2 transition-all hover:scale-[1.01] active:scale-[0.99] text-left font-medium"
              >
                📊 Summarize my health patterns
              </button>
            </div>
          </div>

          {/* Chat Conversation Thread */}
          <div className="my-4 max-h-[360px] min-h-[160px] overflow-y-auto space-y-3.5 p-4 bg-slate-50/60 border border-slate-100 rounded-2xl">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  <div
                    className={`text-[10px] mt-1.5 ${
                      msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 text-xs">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-500 shadow-sm flex items-center gap-2">
                  <Loader size={13} className="animate-spin text-blue-600" />
                  <span>Reviewing consultation history...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChatMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about prior illness dates, precautions, remedies, or what to avoid..."
              className="flex-1 bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            >
              {chatLoading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
              <span className="hidden sm:inline">Ask Assistant</span>
            </button>
          </form>
        </div>

        {/* Empty State */}
        {!loading && insights.length === 0 && !error && (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-md">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Activity size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-950 mb-2">No Health Insights Formed Yet</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mb-6">
              Complete your first medical session. Our diagnostic models analyze past consultations to uncover meaningful patterns.
            </p>
            <Link
              to="/consultation"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-xs shadow-md shadow-blue-500/25 transition-all"
            >
              <span>Begin First Consultation</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Full Medical Details Pop-up Modal */}
        {selectedInsight && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all"
            onClick={() => setSelectedInsight(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[88vh] overflow-y-auto flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      selectedInsight.urgency === 'high' ? 'bg-red-100 text-red-800' :
                      selectedInsight.urgency === 'medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedInsight.urgency} Priority
                    </span>
                    <span className="text-xs text-slate-500">
                      Recorded: {new Date(selectedInsight.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight">
                    {selectedInsight.issue}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0"
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Recurrence Banner */}
              {selectedInsight.consultation_count > 1 && (
                <div className="px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-2 text-purple-900 text-xs font-medium">
                  <Activity size={16} className="text-purple-600 flex-shrink-0" />
                  <span>This condition or related symptom has been documented across {selectedInsight.consultation_count} separate consultation sessions.</span>
                </div>
              )}

              {/* Reported Symptoms */}
              {selectedInsight.symptoms && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Symptoms You Reported</h4>
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-800 italic">
                    "{selectedInsight.symptoms}"
                  </div>
                </div>
              )}

              {/* What to Avoid & Precautions */}
              {selectedInsight.avoid && (
                <div>
                  <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">What to Avoid & Lifestyle Restrictions</h4>
                  <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-start gap-3 shadow-sm">
                    <Ban size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-950 leading-relaxed font-medium">
                      {selectedInsight.avoid}
                    </p>
                  </div>
                </div>
              )}

              {/* Complete Clinical Assessment & Notes */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Complete Clinical Assessment & Doctor Notes</h4>
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                  {selectedInsight.full_advice || selectedInsight.advice}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-blue-600" />
                  Clinical reasoning synthesis
                </span>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
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

export default HealthInsights;