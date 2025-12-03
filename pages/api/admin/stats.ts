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

    // 2. Count announcements this month
    // Get all announcements and filter by month
    const allAnnouncements = await prisma.announcement.findMany({
      where: { familyGroupId },
      select: { id: true, createdAt: true },
    })

    // Count announcements created this month
    const announcementsThisMonth = allAnnouncements.filter((a) => {
      const created = new Date(a.createdAt)
      return created >= startOfMonth && created <= now
    }).length

    console.log('📊 Stats - Total announcements:', allAnnouncements.length)
    console.log('📊 Stats - Announcements this month:', announcementsThisMonth)
    console.log('📊 Stats - Date range:', startOfMonth.toISOString(), 'to', now.toISOString())

    // 3. Count upcoming events (future events)
    const allEvents = await prisma.event.findMany({
      where: { familyGroupId },
      select: { id: true, startsAt: true },
    })
    console.log(
      '📊 Stats - All events:',
      allEvents.length,
      allEvents.map((e) => ({ id: e.id, startsAt: e.startsAt }))
    )

    const upcomingEvents = allEvents.filter((e) => e.startsAt >= now).length
    console.log('📊 Stats - Upcoming events:', upcomingEvents, 'now:', now.toISOString())

    // 4. Count messages sent today (successful delivery attempts)
    // Get all announcement and event IDs for this group
    const groupAnnouncementIds = await prisma.announcement.findMany({
      where: { familyGroupId },
      select: { id: true },
    })
    const groupEventIds = await prisma.event.findMany({
      where: { familyGroupId },
      select: { id: true },
    })

    const announcementIds = groupAnnouncementIds.map((a) => a.id)
    const eventIds = groupEventIds.map((e) => e.id)

    // Count successful delivery attempts - do separate queries for announcements and events
    // Note: status is 'SENT' not 'SUCCESS' according to schema
    const [announcementDeliveries, eventDeliveries] = await Promise.all([
      announcementIds.length > 0
        ? prisma.deliveryAttempt.count({
            where: {
              itemType: 'ANNOUNCEMENT',
              itemId: { in: announcementIds },
              status: 'SENT',
              createdAt: {
                gte: startOfToday,
              },
            },
          })
        : 0,
      eventIds.length > 0
        ? prisma.deliveryAttempt.count({
            where: {
              itemType: 'EVENT',
              itemId: { in: eventIds },
              status: 'SENT',
              createdAt: {
                gte: startOfToday,
              },
            },
          })
        : 0,
    ])

    const messagesSentToday = announcementDeliveries + eventDeliveries

    // 5. Get delivery status counts (for stats tab)
    // Do separate queries for announcements and events, then combine
    const [
      announcementSent,
      announcementQueued,
      announcementFailed,
      eventSent,
      eventQueued,
      eventFailed,
    ] = await Promise.all([
      // Announcement deliveries - SENT
      announcementIds.length > 0
        ? prisma.deliveryAttempt.count({
            where: {
              itemType: 'ANNOUNCEMENT',
              itemId: { in: announcementIds },
              status: 'SENT',
            },
          })
        : 0,
      // Announcement deliveries - QUEUED
      announcementIds.length > 0
        ? prisma.deliveryAttempt.count({
            where: {
              itemType: 'ANNOUNCEMENT',
              itemId: { in: announcementIds },
              status: 'QUEUED',
            },
          })
        : 0,
      // Announcement deliveries - FAILED
      announcementIds.length > 0
        ? prisma.deliveryAttempt.count({
            where: {
              itemType: 'ANNOUNCEMENT',
              itemId: { in: announcementIds },
              status: 'FAILED',
            },
          })
        : 0,
      // Event deliveries - SENT
      eventIds.length > 0
        ? prisma.deliveryAttempt.count({
            where: {
              itemType: 'EVENT',
              itemId: { in: eventIds },
              status: 'SENT',
            },
          })
        : 0,
      // Event deliveries - QUEUED
      eventIds.length > 0
        ? prisma.deliveryAttempt.count({
            where: {
              itemType: 'EVENT',
              itemId: { in: eventIds },
              status: 'QUEUED',
            },
          })
        : 0,
      // Event deliveries - FAILED
      eventIds.length > 0
        ? prisma.deliveryAttempt.count({
            where: {
              itemType: 'EVENT',
              itemId: { in: eventIds },
              status: 'FAILED',
            },
          })
        : 0,
    ])

    const sentCount = announcementSent + eventSent
    const queuedCount = announcementQueued + eventQueued
    const failedCount = announcementFailed + eventFailed

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
