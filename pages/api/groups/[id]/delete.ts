import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { id: groupId } = req.query

    if (!groupId || typeof groupId !== 'string') {
      return res.status(400).json({ error: 'Group ID required' })
    }

    // Check if user is admin of this group
    const membership = await prisma.membership.findUnique({
      where: {
        userId_familyGroupId: {
          userId: user.id,
          familyGroupId: groupId,
        },
      },
    })

    if (!membership) {
      return res.status(404).json({ error: 'Group not found or you are not a member' })
    }

    if (membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only group admins can delete the group' })
    }

    // Get group info before deletion
    const group = await prisma.familyGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            memberships: true,
            events: true,
            announcements: true,
          },
        },
      },
    })

    if (!group) {
      return res.status(404).json({ error: 'Group not found' })
    }

    // Find all related items to clean up delivery attempts (which don't cascade due to missing FKs)
    const [announcements, events, eventReminders] = await Promise.all([
      prisma.announcement.findMany({
        where: { familyGroupId: groupId },
        select: { id: true },
      }),
      prisma.event.findMany({
        where: { familyGroupId: groupId },
        select: { id: true },
      }),
      prisma.eventReminder.findMany({
        where: { familyGroupId: groupId },
        select: { id: true },
      }),
    ])

    const announcementIds = announcements.map((a) => a.id)
    const eventIds = events.map((e) => e.id)
    const reminderIds = eventReminders.map((r) => r.id)

    // Clean up delivery attempts
    if (announcementIds.length > 0 || eventIds.length > 0 || reminderIds.length > 0) {
      await prisma.deliveryAttempt.deleteMany({
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
            {
              itemType: 'EVENT_REMINDER',
              itemId: { in: reminderIds },
            },
          ],
        },
      })
    }

    // Delete the group (cascade will handle all related records like memberships, events, etc.)
    await prisma.familyGroup.delete({
      where: { id: groupId },
    })

    return res.status(200).json({
      success: true,
      message: 'Group deleted successfully',
      deletedGroup: {
        name: group.name,
        memberCount: group._count.memberships,
        eventCount: group._count.events,
        announcementCount: group._count.announcements,
      },
    })
  } catch (error: any) {
    console.error('Error deleting group:', error)
    return res.status(500).json({ error: error.message || 'Failed to delete group' })
  }
}
