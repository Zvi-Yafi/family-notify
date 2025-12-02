import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: announcementId } = await params

    // Get announcement
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
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

    return NextResponse.json({
      success: true,
      message: 'Announcement dispatched',
    })
  } catch (error: any) {
    console.error('Error dispatching announcement:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch announcement' },
      { status: 500 }
    )
  }
}


