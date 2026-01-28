import { prisma } from '@/lib/prisma'
import { withCache, getCacheKey, cache } from '@/lib/cache'

export async function getGroupById(groupId: string) {
  const cacheKey = getCacheKey('group', groupId)
  return withCache(cacheKey, async () => {
    const group = await prisma.familyGroup.findUnique({
      where: { id: groupId },
    })
    return group
  })
}

export async function getGroupMembers(familyGroupId: string) {
  const cacheKey = getCacheKey('admin-members', familyGroupId)
  return withCache(cacheKey, async () => {
    const memberships = await prisma.membership.findMany({
      where: { familyGroupId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            preferences: {
              where: { enabled: true },
              select: { channel: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const members = memberships.map((membership) => ({
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      phone: membership.user.phone,
      role: membership.role,
      joinedAt: membership.createdAt,
      preferences: membership.user.preferences.map((p) => p.channel),
    }))

    return { members }
  })
}

export async function getGroupEvents(familyGroupId: string, includePast: boolean = false) {
  const cacheKey = getCacheKey('admin-events', familyGroupId, includePast)
  return withCache(cacheKey, async () => {
    const now = new Date()
    const where: any = { familyGroupId }

    if (!includePast) {
      where.startsAt = { gte: now }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        reminders: {
          select: {
            id: true,
            message: true,
            scheduledAt: true,
            sentAt: true,
          },
        },
      },
      orderBy: { startsAt: includePast ? 'desc' : 'asc' },
    })

    return { events }
  })
}

export async function getGroupAnnouncements(familyGroupId: string) {
  const cacheKey = getCacheKey('admin-announcements', familyGroupId)
  return withCache(cacheKey, async () => {
    const announcements = await prisma.announcement.findMany({
      where: { familyGroupId },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        topics: {
          include: {
            topic: true,
          },
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })

    return { announcements }
  })
}

export function invalidateGroupCache(groupId: string): void {
  cache.delete(getCacheKey('group', groupId))
  cache.delete(getCacheKey('admin-members', groupId))
  cache.delete(getCacheKey('admin-events', groupId, true))
  cache.delete(getCacheKey('admin-events', groupId, false))
  cache.delete(getCacheKey('admin-announcements', groupId))
  cache.delete(getCacheKey('admin-stats', groupId))
  console.log(`[Cache INVALIDATE] All caches for group ${groupId}`)
}
