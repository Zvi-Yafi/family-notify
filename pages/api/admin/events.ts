import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { title, description, startsAt, endsAt, location, familyGroupId, reminderOffsets } =
        req.body

      // Get authenticated user
      const supabase = createServerClient(req, res)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const userId = user.id

      // Create event
      const event = await prisma.event.create({
        data: {
          title,
          description,
          startsAt: new Date(startsAt),
          endsAt: endsAt ? new Date(endsAt) : null,
          location,
          familyGroupId,
          createdBy: userId,
          scheduledReminderOffsets: reminderOffsets || [1440, 60], // Default: 24h and 1h before
        },
      })

      return res.status(200).json({
        success: true,
        event,
      })
    } catch (error: any) {
      console.error('Error creating event:', error)
      return res.status(500).json({ error: error.message || 'Failed to create event' })
    }
  }

  if (req.method === 'GET') {
    try {
      const { familyGroupId } = req.query

      if (!familyGroupId || typeof familyGroupId !== 'string') {
        return res.status(400).json({ error: 'familyGroupId required' })
      }

      const now = new Date()

      const events = await prisma.event.findMany({
        where: {
          familyGroupId,
          startsAt: {
            gte: now, // Only future events
          },
        },
        include: {
          creator: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          startsAt: 'asc',
        },
      })

      return res.status(200).json({ events })
    } catch (error: any) {
      console.error('Error fetching events:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch events' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
