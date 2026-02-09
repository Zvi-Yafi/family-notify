import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'
import { createServerClient } from '@/lib/supabase/server'
import { convertIsraelToUTC, formatToIsraelTime } from '@/lib/utils/timezone'
import { roundDateToTenMinutes } from '@/lib/utils/time-utils'
import { invalidateStatsOnAnnouncementCreate } from '@/lib/hooks/cache-invalidation'
import { withRequestContext } from '@/lib/api-wrapper'
import {
  getGroupAnnouncements,
  invalidateGroupCache,
} from '@/lib/services/cached-endpoints.service'

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

      const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'
      const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

      // VERIFY MEMBERSHIP
      let membership = null
      if (!isSuperAdmin) {
        membership = await prisma.membership.findUnique({
          where: {
            userId_familyGroupId: {
              userId,
              familyGroupId,
            },
          },
        })

        if (!membership) {
          return res
            .status(403)
            .json({ error: 'Forbidden - You are not a member of this group' })
        }
      }

      // Create announcement
      // ... (rest of the POST logic remains the same)
      let scheduledDate = null
      if (scheduledAt) {
        const roundedTime = roundDateToTenMinutes(scheduledAt)
        scheduledDate = convertIsraelToUTC(roundedTime)
      }

      const announcement = await prisma.announcement.create({
        data: {
          title,
          body: bodyText,
          type: type || 'GENERAL',
          familyGroupId,
          createdBy: userId,
          scheduledAt: scheduledDate,
          publishedAt: scheduledAt ? null : new Date(),
        },
      })

      invalidateStatsOnAnnouncementCreate(familyGroupId)

      if (!scheduledAt) {
        await dispatchService.dispatchAnnouncement({
          announcementId: announcement.id,
          familyGroupId,
        })
      }

      return res.status(200).json({ success: true, announcement })
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

      // Get authenticated user
      const supabase = createServerClient(req, res)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'
      const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

      // VERIFY MEMBERSHIP
      if (!isSuperAdmin) {
        const membership = await prisma.membership.findUnique({
          where: {
            userId_familyGroupId: {
              userId: user.id,
              familyGroupId,
            },
          },
        })

        if (!membership) {
          return res.status(403).json({ error: 'Forbidden - You are not a member of this group' })
        }
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
