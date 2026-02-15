import { prisma } from '@/lib/prisma'
import { withCache, getCacheKey } from '@/lib/cache'

export interface ChannelStats {
  EMAIL: number
  WHATSAPP: number
  SMS: number
  PUSH: number
  VOICE_CALL: number
}

export interface PeriodDeliveryStats {
  sent: number
  failed: number
  queued: number
  total: number
  byChannel: ChannelStats
}

export interface DailyTrendItem {
  date: string
  sent: number
  failed: number
  EMAIL: number
  WHATSAPP: number
  SMS: number
  PUSH: number
  VOICE_CALL: number
}

export interface GroupDashboardStats {
  id: string
  name: string
  slug: string
  createdAt: Date
  memberCount: number
  announcementCount: number
  eventCount: number
  admins: string[]
  deliveries: {
    total: number
    sent: number
    failed: number
    queued: number
    todaySent: number
    todayFailed: number
    byChannel: ChannelStats
    todayByChannel: ChannelStats
  }
}

export interface DashboardResult {
  overview: {
    totalUsers: number
    totalGroups: number
    totalAnnouncements: number
    totalEvents: number
    totalDeliveries: number
    totalSent: number
    totalFailed: number
    totalQueued: number
    successRate: number
    newUsers30d: number
    newGroups30d: number
  }
  channelBreakdown: Array<{
    channel: string
    sent: number
    failed: number
    total: number
  }>
  periodStats: {
    today: PeriodDeliveryStats
    week: PeriodDeliveryStats
    month: PeriodDeliveryStats
    year: PeriodDeliveryStats
  }
  dailyTrend: DailyTrendItem[]
  groups: GroupDashboardStats[]
}

function emptyChannelStats(): ChannelStats {
  return { EMAIL: 0, WHATSAPP: 0, SMS: 0, PUSH: 0, VOICE_CALL: 0 }
}

function emptyPeriodStats(): PeriodDeliveryStats {
  return { sent: 0, failed: 0, queued: 0, total: 0, byChannel: emptyChannelStats() }
}

async function computeDashboard(): Promise<DashboardResult> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalUsers,
    totalGroups,
    totalAnnouncements,
    totalEvents,
    newUsers30d,
    newGroups30d,
    allDeliveryStats,
    channelStatusBreakdown,
    todayChannelStatus,
    weekChannelStatus,
    monthChannelStatus,
    yearChannelStatus,
    dailyTrend,
    groups,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.familyGroup.count(),
    prisma.announcement.count(),
    prisma.event.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.familyGroup.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

    prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT status, COUNT(*) as count
      FROM "delivery_attempts"
      GROUP BY status
    `,

    prisma.$queryRaw<Array<{ channel: string; status: string; count: bigint }>>`
      SELECT channel, status, COUNT(*) as count
      FROM "delivery_attempts"
      GROUP BY channel, status
    `,

    prisma.$queryRaw<Array<{ channel: string; status: string; count: bigint }>>`
      SELECT channel, status, COUNT(*) as count
      FROM "delivery_attempts"
      WHERE "createdAt" >= ${startOfToday}
      GROUP BY channel, status
    `,

    prisma.$queryRaw<Array<{ channel: string; status: string; count: bigint }>>`
      SELECT channel, status, COUNT(*) as count
      FROM "delivery_attempts"
      WHERE "createdAt" >= ${startOfWeek}
      GROUP BY channel, status
    `,

    prisma.$queryRaw<Array<{ channel: string; status: string; count: bigint }>>`
      SELECT channel, status, COUNT(*) as count
      FROM "delivery_attempts"
      WHERE "createdAt" >= ${startOfMonth}
      GROUP BY channel, status
    `,

    prisma.$queryRaw<Array<{ channel: string; status: string; count: bigint }>>`
      SELECT channel, status, COUNT(*) as count
      FROM "delivery_attempts"
      WHERE "createdAt" >= ${startOfYear}
      GROUP BY channel, status
    `,

    prisma.$queryRaw<Array<{ day: string; channel: string; status: string; count: bigint }>>`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM-DD') as day,
        channel,
        status,
        COUNT(*) as count
      FROM "delivery_attempts"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY day, channel, status
      ORDER BY day ASC
    `,

    prisma.familyGroup.findMany({
      include: {
        memberships: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            announcements: true,
            events: true,
            memberships: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  let totalSent = 0
  let totalFailed = 0
  let totalQueued = 0
  for (const row of allDeliveryStats) {
    const c = Number(row.count)
    if (row.status === 'SENT') totalSent = c
    else if (row.status === 'FAILED') totalFailed = c
    else if (row.status === 'QUEUED') totalQueued = c
  }
  const totalDeliveries = totalSent + totalFailed + totalQueued
  const successRate = totalDeliveries > 0 ? Math.round((totalSent / totalDeliveries) * 100) : 0

  const channelBreakdown: DashboardResult['channelBreakdown'] = []
  const channelMap: Record<string, { sent: number; failed: number; total: number }> = {}
  for (const row of channelStatusBreakdown) {
    const c = Number(row.count)
    if (!channelMap[row.channel]) channelMap[row.channel] = { sent: 0, failed: 0, total: 0 }
    channelMap[row.channel].total += c
    if (row.status === 'SENT') channelMap[row.channel].sent += c
    else if (row.status === 'FAILED') channelMap[row.channel].failed += c
  }
  for (const [channel, stats] of Object.entries(channelMap)) {
    channelBreakdown.push({ channel, ...stats })
  }

  function buildPeriodStats(
    rows: Array<{ channel: string; status: string; count: bigint }>
  ): PeriodDeliveryStats {
    const result = emptyPeriodStats()
    for (const row of rows) {
      const c = Number(row.count)
      result.total += c
      if (row.status === 'SENT') {
        result.sent += c
        if (row.channel in result.byChannel) {
          result.byChannel[row.channel as keyof ChannelStats] += c
        }
      } else if (row.status === 'FAILED') {
        result.failed += c
      } else if (row.status === 'QUEUED') {
        result.queued += c
      }
    }
    return result
  }

  const periodStats = {
    today: buildPeriodStats(todayChannelStatus),
    week: buildPeriodStats(weekChannelStatus),
    month: buildPeriodStats(monthChannelStatus),
    year: buildPeriodStats(yearChannelStatus),
  }

  const trendMap: Record<string, DailyTrendItem> = {}
  for (let i = 30; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    trendMap[key] = {
      date: key,
      sent: 0,
      failed: 0,
      EMAIL: 0,
      WHATSAPP: 0,
      SMS: 0,
      PUSH: 0,
      VOICE_CALL: 0,
    }
  }
  for (const row of dailyTrend) {
    const c = Number(row.count)
    if (!trendMap[row.day]) continue
    if (row.status === 'SENT') {
      trendMap[row.day].sent += c
      if (row.channel in trendMap[row.day]) {
        trendMap[row.day][row.channel as keyof ChannelStats] += c
      }
    } else if (row.status === 'FAILED') {
      trendMap[row.day].failed += c
    }
  }

  const groupIds = groups.map((g) => g.id)

  let groupDeliveryRows: Array<{
    familyGroupId: string
    channel: string
    status: string
    count: bigint
  }> = []

  let groupTodayDeliveryRows: Array<{
    familyGroupId: string
    channel: string
    status: string
    count: bigint
  }> = []

  if (groupIds.length > 0) {
    ;[groupDeliveryRows, groupTodayDeliveryRows] = await prisma.$transaction([
      prisma.$queryRaw<
        Array<{ familyGroupId: string; channel: string; status: string; count: bigint }>
      >`
        SELECT sub."familyGroupId", da.channel, da.status, COUNT(*) as count
        FROM "delivery_attempts" da
        INNER JOIN (
          SELECT id, "familyGroupId" FROM "announcements"
          UNION ALL
          SELECT id, "familyGroupId" FROM "events"
          UNION ALL
          SELECT id, "familyGroupId" FROM "event_reminders"
        ) sub ON da."itemId" = sub.id
        WHERE sub."familyGroupId" = ANY(${groupIds})
        GROUP BY sub."familyGroupId", da.channel, da.status
      `,
      prisma.$queryRaw<
        Array<{ familyGroupId: string; channel: string; status: string; count: bigint }>
      >`
        SELECT sub."familyGroupId", da.channel, da.status, COUNT(*) as count
        FROM "delivery_attempts" da
        INNER JOIN (
          SELECT id, "familyGroupId" FROM "announcements"
          UNION ALL
          SELECT id, "familyGroupId" FROM "events"
          UNION ALL
          SELECT id, "familyGroupId" FROM "event_reminders"
        ) sub ON da."itemId" = sub.id
        WHERE sub."familyGroupId" = ANY(${groupIds})
          AND da."createdAt" >= ${startOfToday}
        GROUP BY sub."familyGroupId", da.channel, da.status
      `,
    ])
  }

  const groupDeliveryMap: Record<
    string,
    {
      total: number
      sent: number
      failed: number
      queued: number
      byChannel: ChannelStats
    }
  > = {}

  const groupTodayDeliveryMap: Record<
    string,
    {
      sent: number
      failed: number
      byChannel: ChannelStats
    }
  > = {}

  for (const row of groupDeliveryRows) {
    const gid = row.familyGroupId
    if (!groupDeliveryMap[gid]) {
      groupDeliveryMap[gid] = {
        total: 0,
        sent: 0,
        failed: 0,
        queued: 0,
        byChannel: emptyChannelStats(),
      }
    }
    const c = Number(row.count)
    groupDeliveryMap[gid].total += c
    if (row.status === 'SENT') {
      groupDeliveryMap[gid].sent += c
      if (row.channel in groupDeliveryMap[gid].byChannel) {
        groupDeliveryMap[gid].byChannel[row.channel as keyof ChannelStats] += c
      }
    } else if (row.status === 'FAILED') {
      groupDeliveryMap[gid].failed += c
    } else if (row.status === 'QUEUED') {
      groupDeliveryMap[gid].queued += c
    }
  }

  for (const row of groupTodayDeliveryRows) {
    const gid = row.familyGroupId
    if (!groupTodayDeliveryMap[gid]) {
      groupTodayDeliveryMap[gid] = {
        sent: 0,
        failed: 0,
        byChannel: emptyChannelStats(),
      }
    }
    const c = Number(row.count)
    if (row.status === 'SENT') {
      groupTodayDeliveryMap[gid].sent += c
      if (row.channel in groupTodayDeliveryMap[gid].byChannel) {
        groupTodayDeliveryMap[gid].byChannel[row.channel as keyof ChannelStats] += c
      }
    } else if (row.status === 'FAILED') {
      groupTodayDeliveryMap[gid].failed += c
    }
  }

  const formattedGroups: GroupDashboardStats[] = groups.map((group) => {
    const admins = group.memberships
      .filter((m) => m.role === 'ADMIN')
      .map((m) => m.user.name || m.user.email || 'Unknown')
      .filter((name): name is string => name !== null)

    const gd = groupDeliveryMap[group.id]
    const gtd = groupTodayDeliveryMap[group.id]

    return {
      id: group.id,
      name: group.name,
      slug: group.slug,
      createdAt: group.createdAt,
      memberCount: group._count.memberships,
      announcementCount: group._count.announcements,
      eventCount: group._count.events,
      admins: admins.length > 0 ? admins : ['ללא מנהל'],
      deliveries: {
        total: gd?.total ?? 0,
        sent: gd?.sent ?? 0,
        failed: gd?.failed ?? 0,
        queued: gd?.queued ?? 0,
        todaySent: gtd?.sent ?? 0,
        todayFailed: gtd?.failed ?? 0,
        byChannel: gd?.byChannel ?? emptyChannelStats(),
        todayByChannel: gtd?.byChannel ?? emptyChannelStats(),
      },
    }
  })

  return {
    overview: {
      totalUsers,
      totalGroups,
      totalAnnouncements,
      totalEvents,
      totalDeliveries,
      totalSent,
      totalFailed,
      totalQueued,
      successRate,
      newUsers30d,
      newGroups30d,
    },
    channelBreakdown,
    periodStats,
    dailyTrend: Object.values(trendMap),
    groups: formattedGroups,
  }
}

export async function getSuperAdminDashboard(): Promise<DashboardResult> {
  const cacheKey = getCacheKey('super-admin-dashboard')
  return withCache(cacheKey, () => computeDashboard(), 60000)
}

export function invalidateSuperAdminDashboardCache(): void {
  const cacheKey = getCacheKey('super-admin-dashboard')
  const { cache: c } = require('@/lib/cache')
  c.delete(cacheKey)
}
