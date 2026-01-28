import { prisma } from '@/lib/prisma'
import { withCache, getCacheKey } from '@/lib/cache'

export interface StatsResult {
  memberCount: number
  announcementsThisMonth: number
  scheduledAnnouncements: number
  upcomingEvents: number
  messagesSentToday: number
  deliveryStats: {
    sent: number
    queued: number
    failed: number
  }
}

async function computeStats(familyGroupId: string): Promise<StatsResult> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    memberCount,
    announcementsThisMonth,
    scheduledAnnouncements,
    upcomingEvents,
    deliveryStatsRaw,
    todayDeliveriesRaw,
  ] = await prisma.$transaction([
    prisma.membership.count({
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

    prisma.announcement.count({
      where: {
        familyGroupId,
        scheduledAt: { gte: now },
        publishedAt: null,
      },
    }),

    prisma.event.count({
      where: {
        familyGroupId,
        startsAt: { gte: now },
      },
    }),

    prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT da.status, COUNT(*) as count
      FROM "delivery_attempts" da
      WHERE (
        (da."itemType" = 'ANNOUNCEMENT' AND da."itemId" IN (
          SELECT id FROM "announcements" WHERE "familyGroupId" = ${familyGroupId}
        ))
        OR
        (da."itemType" = 'EVENT' AND da."itemId" IN (
          SELECT id FROM "events" WHERE "familyGroupId" = ${familyGroupId}
        ))
      )
      GROUP BY da.status
    `,

    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "delivery_attempts" da
      WHERE da.status = 'SENT'
        AND da."createdAt" >= ${startOfToday}
        AND (
          (da."itemType" = 'ANNOUNCEMENT' AND da."itemId" IN (
            SELECT id FROM "announcements" WHERE "familyGroupId" = ${familyGroupId}
          ))
          OR
          (da."itemType" = 'EVENT' AND da."itemId" IN (
            SELECT id FROM "events" WHERE "familyGroupId" = ${familyGroupId}
          ))
        )
    `,
  ])

  let sentCount = 0
  let queuedCount = 0
  let failedCount = 0

  for (const stat of deliveryStatsRaw) {
    const count = Number(stat.count)
    if (stat.status === 'SENT') sentCount += count
    else if (stat.status === 'QUEUED') queuedCount += count
    else if (stat.status === 'FAILED') failedCount += count
  }

  const messagesSentToday = Number(todayDeliveriesRaw[0]?.count || 0)

  return {
    memberCount,
    announcementsThisMonth,
    scheduledAnnouncements,
    upcomingEvents,
    messagesSentToday,
    deliveryStats: {
      sent: sentCount,
      queued: queuedCount,
      failed: failedCount,
    },
  }
}

export async function getGroupStats(familyGroupId: string): Promise<StatsResult> {
  const cacheKey = getCacheKey('admin-stats', familyGroupId)
  return withCache(cacheKey, () => computeStats(familyGroupId))
}

export function invalidateGroupStatsCache(familyGroupId: string): void {
  const cacheKey = getCacheKey('admin-stats', familyGroupId)
  const { cache } = require('@/lib/cache')
  cache.delete(cacheKey)
  console.log(`[Cache INVALIDATE] ${cacheKey}`)
}
