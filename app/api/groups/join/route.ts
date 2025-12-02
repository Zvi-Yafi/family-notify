import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slug } = body

    if (!slug) {
      return NextResponse.json(
        { error: 'Group slug is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the family group
    const familyGroup = await prisma.familyGroup.findUnique({
      where: { slug },
    })

    if (!familyGroup) {
      return NextResponse.json(
        { error: 'קבוצה לא נמצאה. בדוק את קוד הקבוצה.' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_familyGroupId: {
          userId: user.id,
          familyGroupId: familyGroup.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'כבר חבר בקבוצה זו' },
        { status: 400 }
      )
    }

    // Add the user as a MEMBER
    await prisma.membership.create({
      data: {
        userId: user.id,
        familyGroupId: familyGroup.id,
        role: 'MEMBER',
      },
    })

    return NextResponse.json({
      success: true,
      group: {
        id: familyGroup.id,
        name: familyGroup.name,
        slug: familyGroup.slug,
      },
    })
  } catch (error: any) {
    console.error('Error joining group:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to join group' },
      { status: 500 }
    )
  }
}

