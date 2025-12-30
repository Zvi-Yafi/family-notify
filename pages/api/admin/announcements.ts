import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'
import { createServerClient } from '@/lib/supabase/server'
import { convertIsraelToUTC, formatToIsraelTime } from '@/lib/utils/timezone'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const { title, bodyText, type, familyGroupId, scheduledAt } = req.body

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

      // Create announcement
      // Convert scheduled time from Israel timezone to UTC
      let scheduledDate = null
      if (scheduledAt) {
        scheduledDate = convertIsraelToUTC(scheduledAt)

        console.log(`⏰ Timezone conversion:`)
        console.log(`   User input: ${scheduledAt}`)
        console.log(`   Adjusted to UTC: ${scheduledDate.toISOString()}`)
        console.log(`   Will show as: ${formatToIsraelTime(scheduledDate)} Israel`)
      }
      const announcement = await prisma.announcement.create({
        data: {
          title,
          body: bodyText,
          type: type || 'GENERAL',
          familyGroupId,
          createdBy: userId,
          scheduledAt: scheduledDate,
          publishedAt: scheduledAt ? null : new Date(), // Publish immediately if not scheduled
        },
      })

      // Log announcement creation
      if (scheduledDate) {
        console.log(`📅 הודעה מתוזמנת נוצרה:`)
        console.log(`   כותרת: "${announcement.title}"`)
        console.log(`   מתוזמנת ל: ${formatToIsraelTime(scheduledDate)} (שעון ישראל)`)
        console.log(`   UTC: ${scheduledDate.toISOString()}`)
        console.log(`   תישלח ב-Cron job הבא (כל 10 דקות)`)
      } else {
        console.log(`📨 הודעה מיידית נוצרה: "${announcement.title}"`)
      }

      // If not scheduled, dispatch immediately
      if (!scheduledAt) {
        await dispatchService.dispatchAnnouncement({
          announcementId: announcement.id,
          familyGroupId,
        })
        console.log(`✅ ההודעה נשלחה מיד`)
      }

      return res.status(200).json({
        success: true,
        announcement,
      })
    } catch (error: any) {
      console.error('Error creating announcement:', error)
      return res.status(500).json({ error: error.message || 'Failed to create announcement' })
    }
  }

  if (req.method === 'GET') {
    try {
      const { familyGroupId } = req.query

      if (!familyGroupId || typeof familyGroupId !== 'string') {
        return res.status(400).json({ error: 'familyGroupId required' })
      }

      const announcements = await prisma.announcement.findMany({
        where: { familyGroupId },
        include: {
          creator: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      })

      return res.status(200).json({ announcements })
    } catch (error: any) {
      console.error('Error fetching announcements:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch announcements' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
