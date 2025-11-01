import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

console.log('Supabase Config:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Types
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  user_id: string;
  consultation_type: 'voice' | 'image' | 'combined';
  transcription: string | null;
  analysis: string | null;
  audio_url: string | null;
  image_url: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

export interface HealthMetric {
  id: string;
  user_id: string;
  consultation_id: string | null;
  metric_type: 'symptom' | 'vital_sign' | 'condition' | 'medication' | 'allergy';
  metric_name: string;
  metric_value: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical' | null;
  recorded_at: string;
  created_at: string;
}

// Profile Services
export const profileService = {
  // Get user profile
  async getProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  // Create or update profile
  async upsertProfile(profile: Partial<UserProfile>): Promise<{ data: UserProfile | null; error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    
    return { data, error };
  }
};


// Consultation Services
export const consultationService = {
  // Get user's consultations
  async getConsultations(userId: string, limit: number = 10): Promise<{ data: Consultation[] | null; error: any }> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  // Create new consultation
  async createConsultation(consultation: Omit<Consultation, 'id' | 'created_at'>): Promise<{ data: Consultation | null; error: any }> {
    const { data, error } = await supabase
      .from('consultations')
      .insert(consultation)
      .select()
      .single();
    
    return { data, error };
  },
  // Update consultation
  async updateConsultation(id: string, updates: Partial<Consultation>): Promise<{ data: Consultation | null; error: any }> {
    const { data, error } = await supabase
      .from('consultations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Get consultation stats
  async getConsultationStats(userId: string): Promise<{ 
    total: number; 
    thisMonth: number; 
    completed: number; 
    error: any 
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total consultations
    const { count: total, error: totalError } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get this month's consultations
    const { count: thisMonth, error: monthError } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    // Get completed consultations
    const { count: completed, error: completedError } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    const error = totalError || monthError || completedError;

    return {
      total: total || 0,
      thisMonth: thisMonth || 0,
      completed: completed || 0,
      error
    };
  }
};


// Health Metrics Services
export const healthMetricsService = {
  // Get user's health metrics
  async getHealthMetrics(userId: string, limit: number = 50): Promise<{ data: HealthMetric[] | null; error: any }> {
    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  // Create health metric
  async createHealthMetric(metric: Omit<HealthMetric, 'id' | 'created_at'>): Promise<{ data: HealthMetric | null; error: any }> {
    const { data, error } = await supabase
      .from('health_metrics')
      .insert(metric)
      .select()
      .single();
    
    return { data, error };
  },

  // Get health insights
  async getHealthInsights(userId: string): Promise<{ 
    commonSymptoms: { name: string; count: number }[]; 
    error: any 
  }> {
    const { data, error } = await supabase
      .from('health_metrics')
      .select('metric_name')
      .eq('user_id', userId)
      .eq('metric_type', 'symptom');

    if (error || !data) {
      return { commonSymptoms: [], error };
    }

    // Count symptom occurrences
    const symptomCounts: { [key: string]: number } = {};
    data.forEach(metric => {
      if (metric.metric_name) {
        symptomCounts[metric.metric_name] = (symptomCounts[metric.metric_name] || 0) + 1;
      }
    });
// Convert to array and sort
    const commonSymptoms = Object.entries(symptomCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { commonSymptoms, error: null };
  }
};