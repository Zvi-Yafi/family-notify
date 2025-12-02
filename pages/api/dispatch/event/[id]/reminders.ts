import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id: eventId } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Event ID required' })
    }

    // Get event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Dispatch reminders
    await dispatchService.dispatchEventReminder({
      eventId,
      familyGroupId: event.familyGroupId,
    })

    return res.status(200).json({
      success: true,
      message: 'Event reminders dispatched',
    })
  } catch (error: any) {
    console.error('Error dispatching event reminders:', error)
    return res.status(500).json({ error: error.message || 'Failed to dispatch reminders' })
  }
}
