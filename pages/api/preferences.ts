import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { syncUser } from '@/lib/users'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET - Get user preferences
  if (req.method === 'GET') {
    try {
      const supabase = createServerClient(req, res)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      // Ensure user exists and is synced in Prisma
      await syncUser({
        userId: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        phone: user.phone,
      })

      // Get all preferences for user
      const preferences = await prisma.preference.findMany({
        where: { userId: user.id },
      })

      return res.status(200).json({ preferences })
    } catch (error: any) {
      console.error('Error fetching preferences:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch preferences' })
    }
  }

  // POST - Save preferences
  if (req.method === 'POST') {
    try {
      const supabase = createServerClient(req, res)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      // Ensure user exists and is synced in Prisma
      await syncUser({
        userId: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        phone: user.phone,
      })

      const { preferences } = req.body

      if (!Array.isArray(preferences)) {
        return res.status(400).json({ error: 'Invalid preferences format' })
      }

      // Update or create each preference
      const results = await Promise.all(
        preferences.map(async (pref: any) => {
          const result = await prisma.preference.upsert({
            where: {
              userId_channel: {
                userId: user.id,
                channel: pref.channel,
              },
            },
            update: {
              enabled: pref.enabled,
              destination: pref.destination || null,
              verifiedAt: pref.verified ? new Date() : null,
            },
            create: {
              userId: user.id,
              channel: pref.channel,
              enabled: pref.enabled,
              destination: pref.destination || null,
              verifiedAt: pref.verified ? new Date() : null,
            },
          })

          // Sync back to User table if this is WhatsApp or SMS and has a destination
          if ((pref.channel === 'WHATSAPP' || pref.channel === 'SMS') && pref.destination) {
            await prisma.user.update({
              where: { id: user.id },
              data: { phone: pref.destination },
            })
          }

          return result
        })
      )

      return res.status(200).json({
        success: true,
        preferences: results,
      })
    } catch (error: any) {
      console.error('Error saving preferences:', error)
      return res.status(500).json({ error: error.message || 'Failed to save preferences' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
