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

    return res.status(200).json({
      success: true,
      processed: dueAnnouncements.length,
    })
  } catch (error: any) {
    console.error('Error in due-announcements cron:', error)
    return res.status(500).json({ error: error.message || 'Cron job failed' })
  }
}
