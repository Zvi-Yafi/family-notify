import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Get current user from server-side (for API routes)
 */
export async function getCurrentUser(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient(req, res)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(req: NextApiRequest, res: NextApiResponse) {
  const user = await getCurrentUser(req, res)
  return !!user
}

/**
 * Require authentication (server-side)
 * Throws error if not authenticated
 */
export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  const user = await getCurrentUser(req, res)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}
