import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Update user profile in the database
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createServerClient(req, res)

    // Get the authenticated user from Supabase
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !supabaseUser) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { name, phone, email } = req.body

    // Update the user in the Prisma database
    // Note: We are updating based on the Supabase ID which is the source of truth
    const updatedUser = await prisma.user.update({
      where: { id: supabaseUser.id },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        email: email !== undefined ? email : undefined,
        updatedAt: new Date(),
      },
    })

    // If phone is updated, sync it to preferences without changing enabled status
    if (phone !== undefined) {
      const channels: ('WHATSAPP' | 'SMS')[] = ['WHATSAPP', 'SMS']

      await Promise.all(
        channels.map((channel) =>
          prisma.preference.upsert({
            where: {
              userId_channel: {
                userId: supabaseUser.id,
                channel,
              },
            },
            update: {
              destination: phone || null,
            },
            create: {
              userId: supabaseUser.id,
              channel,
              destination: phone || null,
              enabled: false, // Default to disabled for new records
            },
          })
        )
      )
    }

    return res.status(200).json({
      success: true,
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return res.status(500).json({ error: error.message || 'Failed to update profile' })
  }
}
