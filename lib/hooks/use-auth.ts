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
          console.error('❌ Session error:', sessionError)
        }

        if (session) {
          console.log('✅ Found session for:', session.user.email)
          setUser(session.user)
        } else {
          console.log('⚠️ No session found')
          // Try getUser as fallback
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()
          if (userError) {
            console.error('❌ Get user error:', userError)
          }
          if (user) {
            console.log('✅ Found user:', user.email)
          }
          setUser(user)
        }
      } catch (error) {
        console.error('❌ Auth error:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}
