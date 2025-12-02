import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, bodyText, type, familyGroupId, scheduledAt } = body

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        body: bodyText,
        type: type || 'GENERAL',
        familyGroupId,
        createdBy: userId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: scheduledAt ? null : new Date(), // Publish immediately if not scheduled
      },
    })

    // If not scheduled, dispatch immediately
    if (!scheduledAt) {
      await dispatchService.dispatchAnnouncement({
        announcementId: announcement.id,
        familyGroupId,
      })
    }

    return NextResponse.json({
      success: true,
      announcement,
    })
  } catch (error: any) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create announcement' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const familyGroupId = searchParams.get('familyGroupId')

    if (!familyGroupId) {
      return NextResponse.json({ error: 'familyGroupId required' }, { status: 400 })
    }

    const announcements = await prisma.announcement.findMany({
      where: { familyGroupId },
      include: {
        creator: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json({ announcements })
  } catch (error: any) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}



