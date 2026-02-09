import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'
import { convertIsraelToUTC, formatToIsraelTime } from '@/lib/utils/timezone'
import { roundDateToTenMinutes } from '@/lib/utils/time-utils'
import { invalidateStatsOnEventCreate } from '@/lib/hooks/cache-invalidation'
import { withRequestContext } from '@/lib/api-wrapper'
import { getGroupEvents, invalidateGroupCache } from '@/lib/services/cached-endpoints.service'

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.status(200).end()
    return
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        description,
        startsAt,
        endsAt,
        location,
        familyGroupId,
        reminderOffsets,
        imageUrl,
        fileUrl,
      } = req.body

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
      if (!isSuperAdmin) {
        const membership = await prisma.membership.findUnique({
          where: {
            userId_familyGroupId: {
              userId,
              familyGroupId,
            },
          },
        })

        if (!membership) {
          return res.status(403).json({
            error: 'Forbidden - You are not a member of this group',
          })
        }
      }

      // Create event
      const startsAtUTC = convertIsraelToUTC(roundDateToTenMinutes(startsAt))
      const endsAtUTC = endsAt ? convertIsraelToUTC(roundDateToTenMinutes(endsAt)) : null

      const event = await prisma.event.create({
        data: {
          title,
          description,
          startsAt: startsAtUTC,
          endsAt: endsAtUTC,
          location,
          imageUrl,
          fileUrl,
          familyGroupId,
          createdBy: userId,
        },
      })

      invalidateStatsOnEventCreate(familyGroupId)
      invalidateGroupCache(familyGroupId)

      return res.status(200).json({ success: true, event })
    } catch (error: any) {
      console.error('Error creating event:', error)
      return res.status(500).json({ error: error.message || 'Failed to create event' })
    }
  }

  if (req.method === 'GET') {
    try {
      const { familyGroupId, includePast } = req.query

      if (!familyGroupId || typeof familyGroupId !== 'string') {
        return res.status(400).json({ error: 'familyGroupId required' })
      }

      const now = new Date()

      // Build where clause - include past events if requested
      const whereClause: any = {
        familyGroupId,
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

      const result = await getGroupEvents(familyGroupId, includePast === 'true')
      return res.status(200).json(result)
    } catch (error: any) {
      console.error('Error fetching events:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch events' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withRequestContext(handler)
