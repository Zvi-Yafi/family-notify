import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'
import { createServerClient } from '@/lib/supabase/server'
import { convertIsraelToUTC } from '@/lib/utils/timezone'
import { roundDateToTenMinutes } from '@/lib/utils/time-utils'
import { invalidateStatsOnAnnouncementCreate } from '@/lib/hooks/cache-invalidation'
import {
  getGroupAnnouncements,
  getGroupAnnouncementsPaginated,
  invalidateGroupCache,
} from '@/lib/services/cached-endpoints.service'

const VALID_TYPES = ['GENERAL', 'SIMCHA']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        bodyText,
        type,
        familyGroupId,
        scheduledAt,
        sendNow = true,
      } = req.body

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

      let scheduledDate = null
      let scheduledResendDate = null

      if (scheduledAt) {
        const roundedTime = roundDateToTenMinutes(scheduledAt)
        const utcDate = convertIsraelToUTC(roundedTime)

        if (sendNow) {
          scheduledResendDate = utcDate
        } else {
          scheduledDate = utcDate
        }
      }

      const announcement = await prisma.announcement.create({
        data: {
          title,
          body: bodyText,
          type: type || 'GENERAL',
          familyGroupId,
          createdBy: userId,
          scheduledAt: scheduledDate,
          scheduledResendAt: scheduledResendDate,
          publishedAt: sendNow ? new Date() : null,
        },
      })

      invalidateStatsOnAnnouncementCreate(familyGroupId)

      if (sendNow) {
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
      const { familyGroupId, page: pageParam, limit: limitParam, type } = req.query

      if (!familyGroupId || typeof familyGroupId !== 'string') {
        return res.status(400).json({ error: 'familyGroupId required' })
      }

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

      if (pageParam !== undefined) {
        const page = Math.max(1, parseInt(String(pageParam), 10) || 1)
        const limit = Math.min(50, Math.max(1, parseInt(String(limitParam), 10) || 10))
        const typeFilter =
          type && typeof type === 'string' && VALID_TYPES.includes(type.toUpperCase())
            ? type.toUpperCase()
            : undefined

        const { items, total } = await getGroupAnnouncementsPaginated(familyGroupId, {
          page,
          limit,
          type: typeFilter,
        })

        const totalPages = Math.ceil(total / limit)
        return res.status(200).json({ items, total, page, totalPages })
      }

      const result = await getGroupAnnouncements(familyGroupId)
      return res.status(200).json(result)
    } catch (error: any) {
      console.error('Error fetching announcements:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch announcements' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
