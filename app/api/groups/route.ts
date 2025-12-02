import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all groups the user is a member of
    const memberships = await prisma.membership.findMany({
      where: {
        userId: user.id,
      },
      include: {
        familyGroup: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Transform the data
    const groups = memberships.map((membership) => ({
      id: membership.familyGroup.id,
      name: membership.familyGroup.name,
      slug: membership.familyGroup.slug,
      role: membership.role,
      joinedAt: membership.createdAt,
    }))

    return NextResponse.json({ groups })
  } catch (error: any) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch groups' }, { status: 500 })
  }
}
