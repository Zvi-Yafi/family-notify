import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'
import { dispatchService } from '@/lib/dispatch/dispatch.service'
import { convertIsraelToUTC } from '@/lib/utils/timezone'

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

      // Convert times from Israel timezone to UTC
      const scheduledAtUTC = scheduledAt ? convertIsraelToUTC(scheduledAt) : null

      // Create reminder
      const reminder = await prisma.eventReminder.create({
        data: {
          eventId,
          familyGroupId: event.familyGroupId,
          message,
          createdBy: userId,
          scheduledAt: scheduledAtUTC,
        },
      })

      // If no scheduledAt, dispatch immediately
      if (!scheduledAt) {
        console.log(`📤 Sending event reminder immediately (ID: ${reminder.id})`)
        await dispatchService.dispatchEventReminder({
          eventReminderId: reminder.id,
          familyGroupId: event.familyGroupId,
        })

        // Mark as sent
        await prisma.eventReminder.update({
          where: { id: reminder.id },
          data: { sentAt: new Date() },
        })
      }

      return res.status(200).json({
        success: true,
        reminder,
      })
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
