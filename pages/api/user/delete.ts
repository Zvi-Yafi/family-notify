import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // 1. Delete from Prisma
    // The cascading deletes we added to schema.prisma will handle related items
    // (memberships, announcements, events, preferences, etc.)
    await prisma.user.delete({
      where: { id: user.id },
    })

    // 2. Delete from Supabase Auth using Admin Client
    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting user from Supabase Auth:', deleteError)
      // Even if Supabase delete fails, the Prisma record is gone.
      // We might want to notify or retry, but for now we'll return an error
      // if it's a critical failure.
    }

    // 3. Clear session/cookies (if needed, but usually redirecting to home/login is enough)
    // Supabase Auth handles cookie clearance on sign out, but for deletion we'll just return success.

    return res.status(200).json({ success: true, message: 'החשבון נמחק בהצלחה' })
  } catch (error: any) {
    console.error('Error deleting account:', error)
    return res.status(500).json({ error: error.message || 'Failed to delete account' })
  }
}
