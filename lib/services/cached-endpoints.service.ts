import { prisma } from '@/lib/prisma'
import { withCache, getCacheKey, cache } from '@/lib/cache'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { startOfMonth, addMonths, addDays, format } from 'date-fns'

const ISRAEL_TZ = 'Asia/Jerusalem'

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

function buildIsraelDayRange(dateStr: string): { gte: Date; lt: Date } {
  const [year, month, day] = dateStr.split('-').map(Number)
  const zonedStart = new Date(year, month - 1, day, 0, 0, 0, 0)
  const gte = fromZonedTime(zonedStart, ISRAEL_TZ)
  const zonedNext = addDays(zonedStart, 1)
  const lt = fromZonedTime(zonedNext, ISRAEL_TZ)
  return { gte, lt }
}

function buildIsraelMonthRange(monthStr: string): { gte: Date; lt: Date } {
  const [year, month] = monthStr.split('-').map(Number)
  const zonedStart = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const gte = fromZonedTime(zonedStart, ISRAEL_TZ)
  const zonedNext = addMonths(zonedStart, 1)
  const lt = fromZonedTime(zonedNext, ISRAEL_TZ)
  return { gte, lt }
}

export async function getGroupEventsPaginated(
  familyGroupId: string,
  params: { page: number; limit: number; date?: string }
) {
  const { page, limit, date } = params
  const cacheKey = getCacheKey('events', familyGroupId, page, limit, date || 'all')
  return withCache(cacheKey, async () => {
    const where: any = { familyGroupId }

    if (date) {
      const range = buildIsraelDayRange(date)
      where.startsAt = { gte: range.gte, lt: range.lt }
    }

    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          creator: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { startsAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ])

    return { items, total }
  })
}

export async function getGroupEventDatesForMonth(familyGroupId: string, month: string) {
  const cacheKey = getCacheKey('event-dates', familyGroupId, month)
  return withCache(cacheKey, async () => {
    const range = buildIsraelMonthRange(month)

    const events = await prisma.event.findMany({
      where: {
        familyGroupId,
        startsAt: { gte: range.gte, lt: range.lt },
      },
      select: { startsAt: true },
    })

    const dateSet = new Set<string>()
    for (const event of events) {
      const zoned = toZonedTime(event.startsAt, ISRAEL_TZ)
      dateSet.add(format(zoned, 'yyyy-MM-dd'))
    }

    return { eventDates: Array.from(dateSet) }
  })
}

export async function getGroupAnnouncementsPaginated(
  familyGroupId: string,
  params: { page: number; limit: number; type?: string }
) {
  const { page, limit, type } = params
  const cacheKey = getCacheKey('announcements', familyGroupId, page, limit, type || 'all')
  return withCache(cacheKey, async () => {
    const where: any = { familyGroupId }

    if (type && type !== 'ALL') {
      where.type = type
    }

    const [items, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          creator: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ])

    return { items, total }
  })
}

export function invalidateGroupCache(groupId: string): void {
  cache.delete(getCacheKey('group', groupId))
  cache.delete(getCacheKey('admin-members', groupId))
  cache.delete(getCacheKey('admin-events', groupId, true))
  cache.delete(getCacheKey('admin-events', groupId, false))
  cache.delete(getCacheKey('admin-announcements', groupId))
  cache.delete(getCacheKey('admin-stats', groupId))
  cache.invalidatePattern(`events:${groupId}`)
  cache.invalidatePattern(`event-dates:${groupId}`)
  cache.invalidatePattern(`announcements:${groupId}`)
  console.log(`[Cache INVALIDATE] All caches for group ${groupId}`)
}
