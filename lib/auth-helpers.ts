import { createServerClient } from '@/lib/supabase/server'

/**
 * Get current user from server-side
 */
export async function getCurrentUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Require authentication (server-side)
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

