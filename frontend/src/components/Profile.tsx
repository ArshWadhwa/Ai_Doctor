import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/database';
import { User, Mail, Shield, Bell, MessageSquare, Save, Loader } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  // Telegram settings
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      console.log('Loading profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        
        // If user not found (404), create it
        if (error.code === 'PGRST116') {
          console.log('User not found, creating...');
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              created_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Error creating user:', insertError);
            throw insertError;
          }
          
          // Try loading again
          await loadUserProfile();
          return;
        }
        
        throw error;
      }

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || user.email || '');
        setTelegramEnabled(data.telegram_notifications_enabled || false);
        setTelegramChatId(data.telegram_chat_id || '');
        console.log('Profile loaded successfully');
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
          telegram_notifications_enabled: telegramEnabled,
          telegram_chat_id: telegramChatId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your account and notification preferences</p>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Telegram Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Telegram Notifications</h2>
          </div>

          <div className="space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Weekly Health Reminders</p>
                  <p className="text-sm text-gray-600">Get personalized health tips via Telegram</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Chat ID Input */}
            {telegramEnabled && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="Get from @userinfobot on Telegram"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">📱 How to get your Chat ID:</p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Open Telegram and search for <code className="bg-blue-100 px-1 rounded">@userinfobot</code></li>
                    <li>Send the command <code className="bg-blue-100 px-1 rounded">/start</code></li>
                    <li>Copy the Chat ID number shown</li>
                    <li>Paste it in the field above</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-800 font-medium mb-1">Privacy & Security</p>
              <p className="text-xs text-amber-700">
                Your Telegram Chat ID is stored securely and only used to send you personalized health reminders. 
                We never share your information with third parties. You can disable notifications at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
