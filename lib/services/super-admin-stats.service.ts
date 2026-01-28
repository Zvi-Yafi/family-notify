import { prisma } from '@/lib/prisma'
import { withCache, getCacheKey } from '@/lib/cache'

export interface SuperAdminStatsResult {
  global: {
    totalUsers: number
    totalGroups: number
    totalAnnouncements: number
    totalEvents: number
    totalInvitations: number
    newUsers30d: number
    newGroups30d: number
  }
  groups: Array<{
    id: string
    name: string
    slug: string
    createdAt: Date
    memberCount: number
    announcementCount: number
    eventCount: number
    admins: string[]
    preferenceCounts: {
      EMAIL: number
      WHATSAPP: number
      SMS: number
      PUSH: number
    }
  }>
}

async function computeSuperAdminStats(): Promise<SuperAdminStatsResult> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalUsers,
    totalGroups,
    totalAnnouncements,
    totalEvents,
    totalInvitations,
    newUsers30d,
    newGroups30d,
    groups,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.familyGroup.count(),
    prisma.announcement.count(),
    prisma.event.count(),
    prisma.groupInvitation.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.familyGroup.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.familyGroup.findMany({
      include: {
        memberships: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                preferences: {
                  where: { enabled: true },
                  select: { channel: true },
                },
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

  const formattedGroups = groups.map((group) => {
    const admins = group.memberships
      .filter((m) => m.role === 'ADMIN')
      .map((m) => m.user.name || m.user.email || 'Unknown')
      .filter((name): name is string => name !== null)

    const preferenceCounts = {
      EMAIL: 0,
      WHATSAPP: 0,
      SMS: 0,
      PUSH: 0,
    }

    group.memberships.forEach((m) => {
      m.user.preferences.forEach((p) => {
        if (p.channel in preferenceCounts) {
          preferenceCounts[p.channel as keyof typeof preferenceCounts]++
        }
      })
    })

    return {
      id: group.id,
      name: group.name,
      slug: group.slug,
      createdAt: group.createdAt,
      memberCount: group._count.memberships,
      announcementCount: group._count.announcements,
      eventCount: group._count.events,
      admins: admins.length > 0 ? admins : ['No Admin'],
      preferenceCounts,
    }
  })

  return {
    global: {
      totalUsers,
      totalGroups,
      totalAnnouncements,
      totalEvents,
      totalInvitations,
      newUsers30d,
      newGroups30d,
    },
    groups: formattedGroups,
  }
}

export async function getSuperAdminStats(): Promise<SuperAdminStatsResult> {
  const cacheKey = getCacheKey('super-admin-stats')
  return withCache(cacheKey, () => computeSuperAdminStats())
}

export function invalidateSuperAdminStatsCache(): void {
  const cacheKey = getCacheKey('super-admin-stats')
  const { cache } = require('@/lib/cache')
  cache.delete(cacheKey)
  console.log(`[Cache INVALIDATE] ${cacheKey}`)
}
