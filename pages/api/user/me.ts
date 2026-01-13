import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Get current user profile from the database
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Find the user in our Prisma database
    let user = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
    })

    if (!user) {
      return res.status(404).json({ error: 'User record not found in database' })
    }

    // If phone is missing, check preferences for WhatsApp/SMS destination
    if (!user.phone) {
      const whatsappPref = await prisma.preference.findUnique({
        where: {
          userId_channel: {
            userId: supabaseUser.id,
            channel: 'WHATSAPP',
          },
        },
      })

      if (whatsappPref?.destination) {
        user.phone = whatsappPref.destination
      } else {
        const smsPref = await prisma.preference.findUnique({
          where: {
            userId_channel: {
              userId: supabaseUser.id,
              channel: 'SMS',
            },
          },
        })
        if (smsPref?.destination) {
          user.phone = smsPref.destination
        }
      }
    }

    return res.status(200).json({
      success: true,
      user,
    })
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch profile' })
  }
}
