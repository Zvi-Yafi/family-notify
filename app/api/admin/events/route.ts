import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, startsAt, endsAt, location, familyGroupId, reminderOffsets } = body

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // Create event
    const event = await prisma.event.create({
      data: {
        title,
        description,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        location,
        familyGroupId,
        createdBy: userId,
        scheduledReminderOffsets: reminderOffsets || [1440, 60], // Default: 24h and 1h before
      },
    })

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error: any) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
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

    const now = new Date()

    const events = await prisma.event.findMany({
      where: {
        familyGroupId,
        startsAt: {
          gte: now, // Only future events
        },
      },
      include: {
        creator: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    })

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    )
  }
}



