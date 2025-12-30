import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
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
      const { title, description, startsAt, endsAt, location, familyGroupId, reminderOffsets } =
        req.body

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

      // Create event
      // Convert times from Israel timezone to UTC
      const startsAtUTC = convertIsraelToUTC(startsAt)
      const endsAtUTC = endsAt ? convertIsraelToUTC(endsAt) : null

      console.log(`⏰ Event timezone conversion:`)
      console.log(
        `   Starts: ${startsAt} → ${startsAtUTC.toISOString()} (${formatToIsraelTime(startsAtUTC)} Israel)`
      )
      if (endsAt) {
        console.log(
          `   Ends: ${endsAt} → ${endsAtUTC?.toISOString()} (${formatToIsraelTime(endsAtUTC!)} Israel)`
        )
      }

      const event = await prisma.event.create({
        data: {
          title,
          description,
          startsAt: startsAtUTC,
          endsAt: endsAtUTC,
          location,
          familyGroupId,
          createdBy: userId,
        },
      })

      return res.status(200).json({
        success: true,
        event,
      })
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

      // Only filter future events if includePast is not 'true'
      if (includePast !== 'true') {
        whereClause.startsAt = {
          gte: now,
        }
      }

      const events = await prisma.event.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          startsAt: 'asc',
        },
      })

      return res.status(200).json({ events })
    } catch (error: any) {
      console.error('Error fetching events:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch events' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
