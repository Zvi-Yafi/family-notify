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

    console.log(`\n⏰ Cron Job - בדיקת הודעות מתוזמנות`)
    console.log(`   זמן נוכחי: ${nowIsrael} (שעון ישראל)`)
    console.log(`   UTC: ${now.toISOString()}`)

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

    console.log(`📅 נמצאו ${dueAnnouncements.length} הודעות צביקה`)

    for (const announcement of dueAnnouncements) {
      try {
        const scheduledIsrael = announcement.scheduledAt
          ? new Date(announcement.scheduledAt).toLocaleString('he-IL', {
              timeZone: 'Asia/Jerusalem',
            })
          : 'לא מוגדר'

        console.log(`\n📤 שולח הודעה:`)
        console.log(`   כותרת: "${announcement.title}"`)
        console.log(`   תוזמנה ל: ${scheduledIsrael}`)

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

        console.log(`✅ ההודעה נשלחה בהצלחה!`)
      } catch (error: any) {
        console.error(`❌ שגיאה בשליחת הודעה ${announcement.id}:`, error)
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
