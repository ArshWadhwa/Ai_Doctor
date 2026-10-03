import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/database';
import { AsklepiosCross } from './BrandElements';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Bell, 
  MessageSquare, 
  Save, 
  Loader, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              created_at: new Date().toISOString()
            });
          
          if (!insertError) {
            await loadUserProfile();
            return;
          }
        }
        throw error;
      }

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || user.email || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to load profile. Please refresh the page.' 
      });
    }
  };

  const handleSaveProfile = async (): Promise<void> => {
    if (!user?.id) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: email || user.email,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Clinical profile updated successfully!' });
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile changes' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] py-4 sm:py-6 px-2 sm:px-6 lg:px-8 antialiased text-slate-900 flex flex-col items-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-6">
        
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
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              History
            </Link>
            <Link 
              to="/profile" 
              className="text-sm font-semibold text-blue-600 relative py-1"
            >
              Profile
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl">
            {firstName ? firstName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
              Profile & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage your personal identity, notification channels, and security settings
            </p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Personal Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <User size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>
        </div>



        {/* Security / Privacy Banner */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-start gap-3 text-xs text-slate-500 leading-relaxed">
          <ShieldCheck size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            Your account credentials, consultation history, and notification preferences are stored securely in your Supabase account. We do not sell your personal data.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;
