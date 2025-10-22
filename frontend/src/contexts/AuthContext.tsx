import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { authService } from '../services/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ data: any; error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { user } } = await authService.getCurrentUser()
      setUser(user)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    try {
      console.log('Attempting to sign up with email:', email)
      const result = await authService.signUp(email, password, fullName)
      console.log('Sign up result:', result)
      
      if (result.error) {
        console.error('Sign up error:', result.error)
      } else {
        console.log('Sign up successful, user:', result.data?.user)
      }
      
      setLoading(false)
      return result
    } catch (error) {
      console.error('Sign up exception:', error)
      setLoading(false)
      return { data: null, error: { message: 'An unexpected error occurred' } }
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log('Attempting to sign in with email:', email)
      const result = await authService.signIn(email, password)
      console.log('Sign in result:', result)
      
      if (result.error) {
        console.error('Sign in error:', result.error)
      } else {
        console.log('Sign in successful, user:', result.data?.user)
      }
      
      setLoading(false)
      return result
    } catch (error) {
      console.error('Sign in exception:', error)
      setLoading(false)
      return { data: null, error: { message: 'An unexpected error occurred' } }
    }
  }

  const signOut = async () => {
    setLoading(true)
    const result = await authService.signOut()
    setLoading(false)
    return result
  }

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email)
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}