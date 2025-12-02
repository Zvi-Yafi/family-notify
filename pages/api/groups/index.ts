import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
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
      return res.status(401).json({ error: 'Unauthorized' })
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

    return res.status(200).json({ groups })
  } catch (error: any) {
    console.error('Error fetching groups:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch groups' })
  }
}
