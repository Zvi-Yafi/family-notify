import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id: announcementId } = req.query

    if (!announcementId || typeof announcementId !== 'string') {
      return res.status(400).json({ error: 'Announcement ID required' })
    }

    // Get announcement
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    })

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    // Dispatch
    await dispatchService.dispatchAnnouncement({
      announcementId,
      familyGroupId: announcement.familyGroupId,
    })

    // Update published timestamp
    await prisma.announcement.update({
      where: { id: announcementId },
      data: { publishedAt: new Date() },
    })

    return res.status(200).json({
      success: true,
      message: 'Announcement dispatched',
    })
  } catch (error: any) {
    console.error('Error dispatching announcement:', error)
    return res.status(500).json({ error: error.message || 'Failed to dispatch announcement' })
  }
}
