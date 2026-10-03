import { supabase } from './database';
export { supabase };

// Authentication service
export const authService = {
  // Sign up new user with dynamic origin redirect
  async signUp(email: string, password: string, fullName: string) {
    const redirectUrl = `${window.location.origin}/dashboard`;
    console.log('Supabase signUp called with redirect:', redirectUrl);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    console.log('Supabase signUp response:', { data: data ? 'user data received' : 'no data', error });
    return { data, error };
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    console.log('Supabase signIn called with:', { email, passwordLength: password.length });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('Supabase signIn response:', { data: data ? 'user data received' : 'no data', error });
    return { data, error };
  },

  // Sign in with Google OAuth
  async signInWithGoogle() {
    const redirectUrl = `${window.location.origin}/dashboard`;
    console.log('Supabase signInWithGoogle called with redirect:', redirectUrl);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        }
      }
    });
    return { data, error };
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser() {
    return supabase.auth.getUser();
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Reset password
  async resetPassword(email: string) {
    const redirectUrl = `${window.location.origin}/auth`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    return { data, error };
  }
}

export default supabase