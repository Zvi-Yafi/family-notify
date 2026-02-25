import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'
import { dispatchService } from '@/lib/dispatch/dispatch.service'
import { convertIsraelToUTC } from '@/lib/utils/timezone'
import { roundDateToTenMinutes } from '@/lib/utils/time-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const { eventId, message, scheduledAt } = req.body

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

      // Verify event exists and get familyGroupId
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { familyGroupId: true },
      })

      if (!event) {
        return res.status(404).json({ error: 'Event not found' })
      }

      // VERIFY MEMBERSHIP
      const membership = await prisma.membership.findUnique({
        where: {
          userId_familyGroupId: {
            userId,
            familyGroupId: event.familyGroupId,
          },
        },
      })

      if (!membership) {
        return res
          .status(403)
          .json({
            error: 'Forbidden - You are not a member of this group',
          })
      }

      // Convert times from Israel timezone to UTC
      // ... (rest of POST remains same)
      const scheduledAtUTC = scheduledAt
        ? convertIsraelToUTC(roundDateToTenMinutes(scheduledAt))
        : null

      const reminder = await prisma.eventReminder.create({
        data: {
          eventId,
          familyGroupId: event.familyGroupId,
          message,
          createdBy: userId,
          scheduledAt: scheduledAtUTC,
        },
      })

      if (!scheduledAt) {
        await dispatchService.dispatchEventReminder({
          eventReminderId: reminder.id,
          familyGroupId: event.familyGroupId,
          isInitial: true,
        })

        await prisma.eventReminder.update({
          where: { id: reminder.id },
          data: { sentAt: new Date() },
        })
      }

      return res.status(200).json({ success: true, reminder })
    } catch (error: any) {
      console.error('Error creating event reminder:', error)
      return res.status(500).json({ error: error.message || 'Failed to create reminder' })
    }
  }

  if (req.method === 'GET') {
    try {
      const { eventId } = req.query

      if (!eventId || typeof eventId !== 'string') {
        return res.status(400).json({ error: 'eventId required' })
      }

      // Get authenticated user
      const supabase = createServerClient(req, res)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // First check if the event exists and get its group
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { familyGroupId: true },
      })

      if (!event) {
        return res.status(404).json({ error: 'Event not found' })
      }

      // VERIFY MEMBERSHIP
      const membership = await prisma.membership.findUnique({
        where: {
          userId_familyGroupId: {
            userId: user.id,
            familyGroupId: event.familyGroupId,
          },
        },
      })

      if (!membership) {
        return res
          .status(403)
          .json({ error: 'Forbidden - You are not a member of the group this event belongs to' })
      }

      const reminders = await prisma.eventReminder.findMany({
        where: { eventId },
        include: {
          creator: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      })

      return res.status(200).json({ reminders })
    } catch (error: any) {
      console.error('Error fetching event reminders:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch reminders' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
