import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { syncUser } from '@/lib/users'

/**
 * Sync user from Supabase Auth to Prisma database
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createServerClient(req, res)

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Sync user using shared utility
    const syncedUser = await syncUser({
      userId: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      phone: user.phone,
    })

    return res.status(200).json({
      success: true,
      user: syncedUser,
      action: 'synced',
    })
  } catch (error: any) {
    console.error('Error syncing user:', error)
    return res.status(500).json({ error: error.message || 'Failed to sync user' })
  }
}
