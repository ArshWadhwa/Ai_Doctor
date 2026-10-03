import { supabase } from './database';
export { supabase };

// Authentication service
export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, fullName: string) {
    console.log('Supabase signUp called with:', { email, fullName, passwordLength: password.length })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    console.log('Supabase signUp response:', { data: data ? 'user data received' : 'no data', error })
    return { data, error }
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    console.log('Supabase signIn called with:', { email, passwordLength: password.length })
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    console.log('Supabase signIn response:', { data: data ? 'user data received' : 'no data', error })
    return { data, error }
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser() {
    return supabase.auth.getUser()
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  }
}

export default supabase