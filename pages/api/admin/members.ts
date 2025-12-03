import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { familyGroupId } = req.query

    if (!familyGroupId || typeof familyGroupId !== 'string') {
      return res.status(400).json({ error: 'familyGroupId required' })
    }

    // Get authenticated user
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get all members of the group
    const memberships = await prisma.membership.findMany({
      where: {
        familyGroupId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const members = memberships.map((membership) => ({
      id: membership.user.id,
      email: membership.user.email,
      phone: membership.user.phone,
      role: membership.role,
      joinedAt: membership.createdAt,
    }))

    return res.status(200).json({ members })
  } catch (error: any) {
    console.error('Error fetching members:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch members' })
  }
}
