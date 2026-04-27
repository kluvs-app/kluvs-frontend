// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabase'
import type { User } from '@supabase/supabase-js'
import type { Member } from '../types'

interface AuthContextType {
  user: User | null
  member: Member | null
  loading: boolean
  isAdmin: boolean
  signInWithDiscord: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshMemberData: () => Promise<void>
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
  
  // Use ref for immediate synchronous tracking of processing state
  const processingUserIdRef = useRef<string | null>(null)
  
  // Check if user is admin
  const isAdmin = member?.role === 'admin'

  // Look up member data by user_id using Edge Function with retry logic
  // Retries handle race condition where database trigger may not have completed yet
  const findMemberByUserId = async (userId: string): Promise<Member | null> => {
    const maxRetries = 3
    const baseDelay = 500 // ms

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt === 0) {
          console.log('🔍 Looking up member for user_id via Edge Function:', userId)
        } else {
          console.log(`🔄 Member lookup attempt ${attempt + 1}/${maxRetries}`)
        }

        // Wait for session to be ready
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          console.log('❌ No active session for Edge Function call')
          return null
        }

        console.log('✅ Session ready, calling Edge Function')

        const { data, error } = await supabase.functions.invoke(`member?user_id=${encodeURIComponent(userId)}`, {
          method: 'GET'
        })

        console.log('📡 Edge Function response:', { data, error })

        if (error) {
          console.error('❌ Edge Function error:', error)
          return null
        }

        // Member found
        if (data) {
          console.log('✅ Found member via Edge Function:', data)
          return data
        }

        // Member not found yet - may be race condition with database trigger
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          console.log(`⏳ Member not found, retrying in ${delay}ms (database trigger may still be executing)...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        console.error('💥 Exception in member lookup:', error)
        return null
      }
    }

    console.log('❌ Member not found after all retry attempts')
    return null
  }


  // Refresh member data - needed for profile updates
  const refreshMemberData = async (): Promise<void> => {
    if (user) {
      console.log('🔄 Refreshing member data...')
      const memberData = await findMemberByUserId(user.id)
      console.log('🔄 Refreshed member:', memberData)
      setMember(memberData)
    }
  }

  // Handle member lookup/creation when user changes
  const handleUserChange = useCallback(async (newUser: User | null) => {
    console.log('🚀 handleUserChange called with user:', newUser?.email)

    // Prevent duplicate calls - check both current user and ref immediately
    if (newUser?.id === processingUserIdRef.current) {
      console.log('⚡ Skipping duplicate handleUserChange - already processing this user')
      return
    }

    setUser(newUser)

    if (!newUser) {
      console.log('❌ No user, clearing member')
      setMember(null)
      processingUserIdRef.current = null
      return
    }

    // Mark this user as being processed (immediate, synchronous)
    processingUserIdRef.current = newUser.id

    try {
      console.log('🔄 Starting member lookup...')

      // Look up member by user_id (created by database trigger on signup)
      const memberData = await findMemberByUserId(newUser.id)

      console.log('🎯 Member lookup completed:', memberData)
      setMember(memberData)
    } catch (error) {
      console.error('💥 Error in handleUserChange:', error)
      setMember(null)
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
          redirectTo: `${window.location.origin}/app`
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
          redirectTo: `${window.location.origin}/app`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('🔓 Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Immediately clear local state
      setUser(null)
      setMember(null)
      processingUserIdRef.current = null
      console.log('✅ Sign out successful')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (initialized) {
        await handleUserChange(session?.user ?? null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    member,
    loading,
    isAdmin,
    signInWithDiscord,
    signInWithGoogle,
    signOut,
    refreshMemberData,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}