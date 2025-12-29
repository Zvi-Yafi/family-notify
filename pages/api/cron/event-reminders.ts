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

    console.log(`\n⏰ Cron Job - בדיקת תזכורות מתוזמנות לאירועים`)
    console.log(`   זמן נוכחי: ${nowIsrael} (שעון ישראל)`)
    console.log(`   UTC: ${now.toISOString()}`)

    // Find event reminders that are scheduled and due
    const dueReminders = await prisma.eventReminder.findMany({
      where: {
        scheduledAt: {
          lte: now,
        },
        sentAt: null, // Not yet sent
      },
      include: {
        event: true,
      },
      take: 10, // Process in batches
    })

    console.log(`📅 נמצאו ${dueReminders.length} תזכורות לשליחה`)

    for (const reminder of dueReminders) {
      try {
        const scheduledIsrael = reminder.scheduledAt
          ? new Date(reminder.scheduledAt).toLocaleString('he-IL', {
              timeZone: 'Asia/Jerusalem',
            })
          : 'לא מוגדר'

        console.log(`\n📤 שולח תזכורת:`)
        console.log(`   אירוע: "${reminder.event.title}"`)
        console.log(`   הודעה: "${reminder.message}"`)
        console.log(`   תוזמנה ל: ${scheduledIsrael}`)

        // Dispatch
        await dispatchService.dispatchEventReminder({
          eventReminderId: reminder.id,
          familyGroupId: reminder.familyGroupId,
        })

        // Mark as sent
        console.log(`🔄 מעדכן sentAt ל-${now.toISOString()}...`)
        const updated = await prisma.eventReminder.update({
          where: { id: reminder.id },
          data: { sentAt: now },
        })
        console.log(`✅ sentAt עודכן בהצלחה! (ID: ${updated.id})`)

        console.log(`✅ התזכורת נשלחה בהצלחה!`)
      } catch (error: any) {
        console.error(`❌ שגיאה בשליחת תזכורת ${reminder.id}:`, error)
        console.error(`   Error name: ${error.name}`)
        console.error(`   Error message: ${error.message}`)
        console.error(`   Stack: ${error.stack}`)
      }

      // Small delay between dispatches
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return res.status(200).json({
      success: true,
      processed: dueReminders.length,
    })
  } catch (error: any) {
    console.error('Error in event-reminders cron:', error)
    return res.status(500).json({ error: error.message || 'Cron job failed' })
  }
}
