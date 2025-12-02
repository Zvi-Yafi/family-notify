import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params

    // Get event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Dispatch reminders
    await dispatchService.dispatchEventReminder({
      eventId,
      familyGroupId: event.familyGroupId,
    })

    return NextResponse.json({
      success: true,
      message: 'Event reminders dispatched',
    })
  } catch (error: any) {
    console.error('Error dispatching event reminders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch reminders' },
      { status: 500 }
    )
  }
}


