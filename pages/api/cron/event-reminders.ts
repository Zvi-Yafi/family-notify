import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify cron secret
    const authHeader = req.headers.authorization
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const now = new Date()
    let remindersSent = 0

    // Find upcoming events in the next 48 hours
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startsAt: {
          gte: now,
          lte: new Date(now.getTime() + 48 * 60 * 60 * 1000), // Next 48 hours
        },
      },
    })

    console.log(`📅 Checking ${upcomingEvents.length} upcoming events for reminders`)

    for (const event of upcomingEvents) {
      const minutesUntilEvent = Math.floor((event.startsAt.getTime() - now.getTime()) / (1000 * 60))

      // Check if any reminder offset matches
      for (const offset of event.scheduledReminderOffsets) {
        // Allow 5-minute window for reminder
        if (Math.abs(minutesUntilEvent - offset) <= 5) {
          // Check if we already sent this reminder
          const existingReminder = await prisma.deliveryAttempt.findFirst({
            where: {
              itemType: 'EVENT',
              itemId: event.id,
              createdAt: {
                gte: new Date(now.getTime() - 10 * 60 * 1000), // In last 10 minutes
              },
            },
          })

          if (!existingReminder) {
            try {
              console.log(
                `🔔 Sending reminder for event "${event.title}" (${offset} minutes before)`
              )
              await dispatchService.dispatchEventReminder({
                eventId: event.id,
                familyGroupId: event.familyGroupId,
              })
              remindersSent++
            } catch (error: any) {
              console.error(`❌ Failed to send reminder for event ${event.id}:`, error)
            }
          }
        }
      }

      // Small delay between checks
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    return res.status(200).json({
      success: true,
      eventsChecked: upcomingEvents.length,
      remindersSent,
    })
  } catch (error: any) {
    console.error('Error in event-reminders cron:', error)
    return res.status(500).json({ error: error.message || 'Cron job failed' })
  }
}
