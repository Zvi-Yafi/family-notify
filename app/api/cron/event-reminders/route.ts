import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      const minutesUntilEvent = Math.floor(
        (event.startsAt.getTime() - now.getTime()) / (1000 * 60)
      )

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

    return NextResponse.json({
      success: true,
      eventsChecked: upcomingEvents.length,
      remindersSent,
    })
  } catch (error: any) {
    console.error('Error in event-reminders cron:', error)
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    )
  }
}



