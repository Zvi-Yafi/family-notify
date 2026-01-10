import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { syncUser } from '@/lib/users'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get authenticated user
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Groups API: Not authenticated', { authError: authError?.message })
      return res.status(401).json({ error: 'Unauthorized' })
    }

    console.log('✅ Groups API: Authenticated user found', { userId: user.id, email: user.email })

    // Ensure user exists and is synced in Prisma using shared utility
    let userInDb = await syncUser({
      userId: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      phone: user.phone || null,
    })

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

    console.log('✅ Groups API: Found memberships', { userId: user.id, count: memberships.length })

    // Transform the data
    const groups = memberships.map((membership) => ({
      id: membership.familyGroup.id,
      name: membership.familyGroup.name,
      slug: membership.familyGroup.slug,
      role: membership.role,
      joinedAt: membership.createdAt,
    }))

    return res.status(200).json({ groups })
  } catch (error: any) {
    console.error('Error fetching groups:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch groups' })
  }
}
