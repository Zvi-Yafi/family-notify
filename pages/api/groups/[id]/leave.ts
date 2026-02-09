import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { invalidateGroupCache } from '@/lib/services/cached-endpoints.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { id: groupId } = req.query
    const { confirmDelete } = req.body || {}

    if (!groupId || typeof groupId !== 'string') {
      return res.status(400).json({ error: 'Group ID required' })
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_familyGroupId: {
          userId: user.id,
          familyGroupId: groupId,
        },
      },
    })

    if (!membership) {
      return res.status(404).json({ error: 'You are not a member of this group' })
    }

    if (membership.role === 'ADMIN') {
      const adminCount = await prisma.membership.count({
        where: {
          familyGroupId: groupId,
          role: 'ADMIN',
        },
      })

      if (adminCount === 1) {
        const totalMembers = await prisma.membership.count({
          where: {
            familyGroupId: groupId,
          },
        })

        if (totalMembers > 1 && !confirmDelete) {
          return res.status(409).json({
            code: 'LAST_ADMIN_WITH_MEMBERS',
            error:
              'אתה המנהל היחיד בקבוצה. אם תעזוב, הקבוצה תימחק לצמיתות כולל כל החברים, ההודעות והאירועים.',
            memberCount: totalMembers - 1,
          })
        }

        if (!confirmDelete) {
          return res.status(409).json({
            code: 'LAST_ADMIN_ALONE',
            error: 'אתה המנהל והחבר היחיד בקבוצה. אם תעזוב, הקבוצה תימחק לצמיתות.',
          })
        }

        const [announcements, events, eventReminders] = await Promise.all([
          prisma.announcement.findMany({
            where: { familyGroupId: groupId },
            select: { id: true },
          }),
          prisma.event.findMany({
            where: { familyGroupId: groupId },
            select: { id: true },
          }),
          prisma.eventReminder.findMany({
            where: { familyGroupId: groupId },
            select: { id: true },
          }),
        ])

        const announcementIds = announcements.map((a) => a.id)
        const eventIds = events.map((e) => e.id)
        const reminderIds = eventReminders.map((r) => r.id)

        if (announcementIds.length > 0 || eventIds.length > 0 || reminderIds.length > 0) {
          await prisma.deliveryAttempt.deleteMany({
            where: {
              OR: [
                ...(announcementIds.length > 0
                  ? [{ itemType: 'ANNOUNCEMENT' as const, itemId: { in: announcementIds } }]
                  : []),
                ...(eventIds.length > 0
                  ? [{ itemType: 'EVENT' as const, itemId: { in: eventIds } }]
                  : []),
                ...(reminderIds.length > 0
                  ? [{ itemType: 'EVENT_REMINDER' as const, itemId: { in: reminderIds } }]
                  : []),
              ],
            },
          })
        }

        await prisma.familyGroup.delete({
          where: { id: groupId },
        })

        return res.status(200).json({
          success: true,
          groupDeleted: true,
          message: 'עזבת את הקבוצה והקבוצה נמחקה בהצלחה',
        })
      }
    }

    await prisma.membership.delete({
      where: {
        id: membership.id,
      },
    })

    invalidateGroupCache(groupId)

    return res.status(200).json({
      success: true,
      groupDeleted: false,
      message: 'עזבת את הקבוצה בהצלחה',
    })
  } catch (error: any) {
    console.error('Error leaving group:', error)
    return res.status(500).json({ error: error.message || 'Failed to leave group' })
  }
}
