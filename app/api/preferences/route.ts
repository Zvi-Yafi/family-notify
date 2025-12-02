import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get all preferences for user
    const preferences = await prisma.preference.findMany({
      where: { userId: user.id },
    })

    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// POST - Save preferences
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { preferences } = body

    if (!Array.isArray(preferences)) {
      return NextResponse.json({ error: 'Invalid preferences format' }, { status: 400 })
    }

    // Update or create each preference
    const results = await Promise.all(
      preferences.map(async (pref: any) => {
        return prisma.preference.upsert({
          where: {
            userId_channel: {
              userId: user.id,
              channel: pref.channel,
            },
          },
          update: {
            enabled: pref.enabled,
            destination: pref.destination || null,
            verifiedAt: pref.verified ? new Date() : null,
          },
          create: {
            userId: user.id,
            channel: pref.channel,
            enabled: pref.enabled,
            destination: pref.destination || null,
            verifiedAt: pref.verified ? new Date() : null,
          },
        })
      })
    )

    return NextResponse.json({
      success: true,
      preferences: results,
    })
  } catch (error: any) {
    console.error('Error saving preferences:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save preferences' },
      { status: 500 }
    )
  }
}
