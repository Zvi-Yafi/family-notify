import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Fetch pending invitations for this user's email
    const invitations = await prisma.groupInvitation.findMany({
      where: {
        email: user.email!,
        status: 'PENDING',
      },
      include: {
        familyGroup: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.status(200).json({ invitations })
  } catch (error: any) {
    console.error('Error fetching pending invitations:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch pending invitations' })
  }
}
