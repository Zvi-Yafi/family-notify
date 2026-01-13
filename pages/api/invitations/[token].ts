import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { token } = req.query
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' })
  }

  try {
    const invitation = await prisma.groupInvitation.findUnique({
      where: { token },
      include: {
        familyGroup: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    if (invitation.status !== 'PENDING') {
      return res
        .status(400)
        .json({ error: 'Invitation is no longer valid', status: invitation.status })
    }

    // Optional: Check if current user is already a member
    let isMember = false
    let isSameUser = false

    const supabase = createServerClient(req, res)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Check if this user is a member of the group
      const membership = await prisma.membership.findUnique({
        where: {
          userId_familyGroupId: {
            userId: user.id,
            familyGroupId: invitation.familyGroup.id,
          },
        },
      })
      if (membership) isMember = true
      if (user.email === invitation.email) isSameUser = true
    }

    return res.status(200).json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        familyGroup: invitation.familyGroup,
        inviter: invitation.inviter,
      },
      context: {
        isMember,
        isSameUser,
        currentUserEmail: user?.email,
      },
    })
  } catch (error: any) {
    console.error('Invitation fetch error:', error)
    return res.status(500).json({ error: error.message })
  }
}
