import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if slug already exists
    const existingGroup = await prisma.familyGroup.findUnique({
      where: { slug },
    })

    if (existingGroup) {
      return NextResponse.json({ error: 'קוד הקבוצה כבר קיים, בחר שם אחר' }, { status: 400 })
    }

    // Create the family group
    const familyGroup = await prisma.familyGroup.create({
      data: {
        name,
        slug,
      },
    })

    // Add the user as an ADMIN member
    await prisma.membership.create({
      data: {
        userId: user.id,
        familyGroupId: familyGroup.id,
        role: 'ADMIN',
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
    console.error('Error creating group:', error)
    return NextResponse.json({ error: error.message || 'Failed to create group' }, { status: 500 })
  }
}
