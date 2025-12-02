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

    // Find announcements that are scheduled and due
    const dueAnnouncements = await prisma.announcement.findMany({
      where: {
        scheduledAt: {
          lte: now,
        },
        publishedAt: null, // Not yet published
      },
      take: 10, // Process in batches
    })

    console.log(`📅 Found ${dueAnnouncements.length} due announcements`)

    for (const announcement of dueAnnouncements) {
      try {
        // Dispatch
        await dispatchService.dispatchAnnouncement({
          announcementId: announcement.id,
          familyGroupId: announcement.familyGroupId,
        })

        // Mark as published
        await prisma.announcement.update({
          where: { id: announcement.id },
          data: { publishedAt: now },
        })

        console.log(`✅ Dispatched announcement: ${announcement.title}`)
      } catch (error: any) {
        console.error(`❌ Failed to dispatch announcement ${announcement.id}:`, error)
      }

      // Small delay between dispatches
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      processed: dueAnnouncements.length,
    })
  } catch (error: any) {
    console.error('Error in due-announcements cron:', error)
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    )
  }
}



