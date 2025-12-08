import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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

    // Get current date ranges
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // 1. Count group members
    const memberCount = await prisma.membership.count({
      where: {
        familyGroupId,
      },
    })
    console.log('📊 Stats - Member count:', memberCount)

    // 2. Count announcements this month (optimized - count in database)
    const [totalAnnouncements, announcementsThisMonth] = await Promise.all([
      prisma.announcement.count({
        where: { familyGroupId },
      }),
      prisma.announcement.count({
        where: {
          familyGroupId,
          createdAt: {
            gte: startOfMonth,
            lte: now,
          },
        },
      }),
    ])

    console.log('📊 Stats - Total announcements:', totalAnnouncements)
    console.log('📊 Stats - Announcements this month:', announcementsThisMonth)
    console.log('📊 Stats - Date range:', startOfMonth.toISOString(), 'to', now.toISOString())

    // 3. Count upcoming events (optimized - count in database)
    const upcomingEvents = await prisma.event.count({
      where: {
        familyGroupId,
        startsAt: {
          gte: now,
        },
      },
    })

    console.log('📊 Stats - Upcoming events:', upcomingEvents, 'now:', now.toISOString())

    // 4. Count messages sent today and get delivery stats
    // Get all announcement and event IDs for this group in one batch
    const [groupAnnouncementIds, groupEventIds] = await Promise.all([
      prisma.announcement.findMany({
        where: { familyGroupId },
        select: { id: true },
      }),
      prisma.event.findMany({
        where: { familyGroupId },
        select: { id: true },
      }),
    ])

    const announcementIds = groupAnnouncementIds.map((a) => a.id)
    const eventIds = groupEventIds.map((e) => e.id)
    const allItemIds = [...announcementIds, ...eventIds]

    // Use a single optimized query with GROUP BY to get all delivery stats at once
    // This replaces 8 separate COUNT queries with 1 grouped query
    let messagesSentToday = 0
    let sentCount = 0
    let queuedCount = 0
    let failedCount = 0

    if (allItemIds.length > 0) {
      // Get all delivery attempts for this group's items in one query
      const deliveryStats = await prisma.deliveryAttempt.groupBy({
        by: ['status', 'itemType'],
        where: {
          OR: [
            {
              itemType: 'ANNOUNCEMENT',
              itemId: { in: announcementIds },
            },
            {
              itemType: 'EVENT',
              itemId: { in: eventIds },
            },
          ],
        },
        _count: {
          id: true,
        },
      })

      // Process the grouped results
      for (const stat of deliveryStats) {
        const count = stat._count.id
        if (stat.status === 'SENT') {
          sentCount += count
        } else if (stat.status === 'QUEUED') {
          queuedCount += count
        } else if (stat.status === 'FAILED') {
          failedCount += count
        }
      }

      // Count messages sent today separately (needs date filter)
      const todayDeliveries = await prisma.deliveryAttempt.count({
        where: {
          OR: [
            {
              itemType: 'ANNOUNCEMENT',
              itemId: { in: announcementIds },
            },
            {
              itemType: 'EVENT',
              itemId: { in: eventIds },
            },
          ],
          status: 'SENT',
          createdAt: {
            gte: startOfToday,
          },
        },
      })

      messagesSentToday = todayDeliveries
    }

    return res.status(200).json({
      memberCount,
      announcementsThisMonth,
      upcomingEvents,
      messagesSentToday,
      deliveryStats: {
        sent: sentCount,
        queued: queuedCount,
        failed: failedCount,
      },
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch stats' })
  }
}
