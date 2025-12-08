'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      try {
        // First try to get the session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          // If it's AuthSessionMissingError, it's normal - just means no session
          if (sessionError.message?.includes('Auth session missing')) {
            console.log('ℹ️ No active session (user not logged in)')
            setUser(null)
            setLoading(false)
            return
          }
          console.error('❌ Session error:', sessionError)
        }

        if (session) {
          console.log('✅ Found session for:', session.user.email)
          setUser(session.user)
          setLoading(false)
          return
        }

        // No session found - user is not logged in
        console.log('⚠️ No session found - user not logged in')
        setUser(null)
      } catch (error: any) {
        // Handle AuthSessionMissingError gracefully
        if (error?.message?.includes('Auth session missing')) {
          console.log('ℹ️ No active session (user not logged in)')
          setUser(null)
        } else {
          console.error('❌ Auth error:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'no user')
      setUser(session?.user ?? null)
      setLoading(false)

      // Redirect to home if user signed out (but not if we're already on home or login)
      if (event === 'SIGNED_OUT' && typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        // Only redirect if we're on a protected page (not home, login, or onboarding)
        if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/onboarding') {
          window.location.href = '/'
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    // Redirect to home page after sign out
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}
