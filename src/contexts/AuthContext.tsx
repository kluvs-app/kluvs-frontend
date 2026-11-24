// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase, invokeFunction } from '../supabase'
import type { User } from '@supabase/supabase-js'
import type { Member, UserRole } from '../types'

interface AuthContextType {
  user: User | null
  member: Member | null
  loading: boolean
  isPasswordRecovery: boolean
  getRoleForClub: (clubId: string) => UserRole | null
  signInWithDiscord: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  resetPasswordForEmail: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  signOut: () => Promise<void>
  refreshMemberData: () => Promise<void>
  isOnline: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  // Immediate synchronous tracking of which user is currently being processed
  const processingUserIdRef = useRef<string | null>(null)
  // Stable ref to member — lets handleUserChange (useCallback, no deps) read
  // the latest value without a stale closure.
  const memberRef = useRef<Member | null>(null)

  const getRoleForClub = useCallback((clubId: string): UserRole | null => {
    return member?.clubs.find(c => c.id === clubId)?.role ?? null
  }, [member])

  // Look up member data by user_id using Edge Function with retry logic
  // Retries handle race condition where database trigger may not have completed yet
  const findMemberByUserId = async (userId: string): Promise<Member | null> => {
    const maxRetries = 3
    // Use shorter delays in tests to avoid slow test runs
    const baseDelay = import.meta.env.VITEST ? 1 : 500 // ms

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Wait for session to be ready
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          return null
        }

        const { data, error } = await invokeFunction<Member>(`member?user_id=${encodeURIComponent(userId)}`, {
          method: 'GET'
        })

        if (error) {
          console.error('❌ Edge Function error:', error)
          return null
        }

        // Member found
        if (data) {
          return data
        }

        // Member not found yet - may be race condition with database trigger
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        console.error('💥 Exception in member lookup:', error)
        return null
      }
    }

    return null
  }

  // Refresh member data - needed for profile updates
  const refreshMemberData = async (): Promise<void> => {
    if (user) {
      const memberData = await findMemberByUserId(user.id)
      setMember(memberData)
    }
  }

  // Handle member lookup when user changes
  const handleUserChange = useCallback(async (newUser: User | null) => {

    // Prevent duplicate calls - check both current user and ref immediately
    if (newUser?.id === processingUserIdRef.current) {
      return
    }

    setUser(newUser)

    if (!newUser) {
      setMember(null)
      memberRef.current = null
      processingUserIdRef.current = null
      return
    }

    // Mark this user as being processed (immediate, synchronous)
    processingUserIdRef.current = newUser.id

    try {

      const memberData = await findMemberByUserId(newUser.id)

      if (memberData !== null) {
        // Successful fetch — update member state
        setMember(memberData)
        memberRef.current = memberData
      } else if (memberRef.current === null) {
        // First-ever load and member genuinely not found — clear state
        setMember(null)
      }
      // If fetch returned null but we already have member data (e.g. transient
      // edge-function failure after tab focus with an expired token), keep the
      // existing data. TOKEN_REFRESHED will retry with a fresh token shortly.
    } catch (error) {
      console.error('💥 Error in handleUserChange:', error)
      if (memberRef.current === null) setMember(null)
    } finally {
      // Clear the processing flag (immediate, synchronous)
      processingUserIdRef.current = null
    }
  }, [])

  // Sign in with Discord
  const signInWithDiscord = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: import.meta.env.VITE_OAUTH_REDIRECT_URL
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: import.meta.env.VITE_OAUTH_REDIRECT_URL
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  // Sign in with Apple
  const signInWithApple = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: import.meta.env.VITE_OAUTH_REDIRECT_URL
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Apple:', error)
      throw error
    }
  }

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with email:', error)
      throw error
    }
  }

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return { needsConfirmation: data.session === null }
    } catch (error) {
      console.error('Error signing up with email:', error)
      throw error
    }
  }

  // Send password reset email
  const resetPasswordForEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: import.meta.env.VITE_OAUTH_REDIRECT_URL
      })
      if (error) throw error
    } catch (error) {
      console.error('Error sending password reset email:', error)
      throw error
    }
  }

  // Update password during a recovery session
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setIsPasswordRecovery(false)
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  const signOut = async () => {
    // Clear local state immediately regardless of Supabase response,
    // since an expired session still means the user is logged out locally.
    setUser(null)
    setMember(null)
    processingUserIdRef.current = null
    try {
      const { error } = await supabase.auth.signOut()
      if (error) console.error('❌ Supabase sign out error (session may have already expired):', error)
    } catch (error) {
      console.error('❌ Sign out exception:', error)
    }
  }

  // Initialize auth state and listen for changes - runs only once per app
  useEffect(() => {
    let initialized = false
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserChange(session?.user ?? null)
      setLoading(false)
      initialized = true
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }
      if (initialized) {
        // Do NOT await — Supabase calls this from inside the Web Lock, so
        // awaiting would hold the lock for the entire member HTTP round-trip,
        // blocking every getSession() call in the app until the edge function responds.
        handleUserChange(session?.user ?? null)
        setLoading(false)
      }
      // When !initialized, loading is set to false by the getSession() promise below.
      // Setting it here early would cause a frame where loading=false but user=null,
      // triggering ProtectedRoute to redirect to /login then back to /me on refresh.
    })

    // Only refresh the token when it's within 5 minutes of expiring (or already
    // gone). Skips unnecessary round-trips on brief tab switches.
    const SESSION_REFRESH_THRESHOLD_S = 300

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const secondsUntilExpiry = (session?.expires_at ?? 0) - Math.floor(Date.now() / 1000)
        if (!session || secondsUntilExpiry < SESSION_REFRESH_THRESHOLD_S) {
          const { error } = await supabase.auth.refreshSession()
          if (error) {
            await handleUserChange(null)
          }
          // On success: TOKEN_REFRESHED → onAuthStateChange → handleUserChange
        }
      } catch {
        console.warn('⚠️ Session check failed — network may be unavailable')
      }
    }

    // Track network connectivity and retry the token refresh when coming back online.
    const handleOffline = () => {
      setIsOnline(false)
    }
    const handleOnline = () => {
      setIsOnline(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  const value = {
    user,
    member,
    loading,
    isPasswordRecovery,
    isOnline,
    getRoleForClub,
    signInWithDiscord,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    resetPasswordForEmail,
    updatePassword,
    signOut,
    refreshMemberData,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}