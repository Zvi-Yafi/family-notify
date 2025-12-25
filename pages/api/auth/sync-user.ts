import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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

    // Check if user already exists in Prisma
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email!,
          name:
            user.user_metadata?.full_name || user.user_metadata?.name || existingUser.name || null,
          phone: user.phone || null,
          updatedAt: new Date(),
        },
      })

      return res.status(200).json({
        success: true,
        user: updatedUser,
        action: 'updated',
      })
    }

    // Create new user in Prisma
    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        phone: user.phone || null,
      },
    })

    // Create default EMAIL preference
    try {
      await prisma.preference.create({
        data: {
          userId: newUser.id,
          channel: 'EMAIL',
          enabled: true,
          destination: newUser.email,
          verifiedAt: new Date(), // Auto-verify email since they signed up with it
        },
      })
    } catch (prefError) {
      console.error('Failed to create default email preference:', prefError)
      // Don't fail user creation if preference creation fails
    }

    return res.status(200).json({
      success: true,
      user: newUser,
      action: 'created',
    })
  } catch (error: any) {
    console.error('Error syncing user:', error)
    return res.status(500).json({ error: error.message || 'Failed to sync user' })
  }
}
