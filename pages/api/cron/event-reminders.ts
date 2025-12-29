import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Server now (ISO):', new Date().toISOString())
  console.log('Server now (local):', new Date().toString())
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
    const nowIsrael = now.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })

    console.log(`\n⏰ Cron Job - בדיקת תזכורות לאירועים`)
    console.log(`   זמן נוכחי: ${nowIsrael} (שעון ישראל)`)
    console.log(`   UTC: ${now.toISOString()}`)

    // Find upcoming events (within the next week)
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startsAt: {
          gte: now,
          lte: oneWeekFromNow,
        },
      },
    })

    console.log(`📅 בודק ${upcomingEvents.length} אירועים עתידיים לתזכורות`)

    let remindersSent = 0

    for (const event of upcomingEvents) {
      const minutesUntilEvent = Math.floor((event.startsAt.getTime() - now.getTime()) / (1000 * 60))

      // Check if any reminder offset matches
      for (const offset of event.scheduledReminderOffsets) {
        // Allow 5-minute window for reminder (since cron runs every 10 minutes)
        if (Math.abs(minutesUntilEvent - offset) <= 5) {
          // Check if we already sent this reminder (in the last 15 minutes)
          const existingReminder = await prisma.deliveryAttempt.findFirst({
            where: {
              itemType: 'EVENT',
              itemId: event.id,
              createdAt: {
                gte: new Date(now.getTime() - 15 * 60 * 1000), // In last 15 minutes
              },
            },
          })

          if (!existingReminder) {
            try {
              const eventIsrael = new Date(event.startsAt).toLocaleString('he-IL', {
                timeZone: 'Asia/Jerusalem',
              })

              console.log(`\n🔔 שולח תזכורת:`)
              console.log(`   אירוע: "${event.title}"`)
              console.log(`   מתחיל ב: ${eventIsrael}`)
              console.log(`   תזכורת: ${offset} דקות לפני`)

              await dispatchService.dispatchEventReminder({
                eventId: event.id,
                familyGroupId: event.familyGroupId,
              })

              remindersSent++
              console.log(`✅ התזכורת נשלחה בהצלחה!`)
            } catch (error: any) {
              console.error(`❌ שגיאה בשליחת תזכורת לאירוע ${event.id}:`, error)
            }
          } else {
            console.log(`⏭️  כבר נשלחה תזכורת לאירוע "${event.title}" (${offset} דקות לפני)`)
          }
        }
      }

      // Small delay between checks
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    console.log(`\n✨ סיום בדיקת תזכורות - נשלחו ${remindersSent} תזכורות`)

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
