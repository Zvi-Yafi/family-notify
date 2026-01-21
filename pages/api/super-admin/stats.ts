import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'

  try {
    // 1. Auth check
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // 2. Fetch Global Stats
    const [totalUsers, totalGroups, totalAnnouncements, totalEvents, totalInvitations] =
      await Promise.all([
        prisma.user.count(),
        prisma.familyGroup.count(),
        prisma.announcement.count(),
        prisma.event.count(),
        prisma.groupInvitation.count(),
      ])

    // 3. Fetch Detailed Groups Info
    const groups = await prisma.familyGroup.findMany({
      include: {
        memberships: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                preferences: {
                  where: {
                    enabled: true,
                  },
                  select: {
                    channel: true,
                  },
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedGroups = groups.map((group) => {
      const admins = group.memberships
        .filter((m) => m.role === 'ADMIN')
        .map((m) => m.user.name || m.user.email)

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

    // 4. Activity Summary (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [newUsers30d, newGroups30d] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.familyGroup.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ])

    return res.status(200).json({
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
    })
  } catch (error: any) {
    console.error('Super Admin Stats Error:', error)
    return res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
