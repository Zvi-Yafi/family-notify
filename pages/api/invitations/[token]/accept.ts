import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { token } = req.query
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' })
  }

  try {
    // 1. Auth check
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized. Please login to accept the invitation.' })
    }

    // 2. Validate invitation
    const invitation = await prisma.groupInvitation.findUnique({
      where: { token },
      include: {
        familyGroup: true, // Need this to check/create membership
      },
    })

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invitation is no longer valid or already accepted.' })
    }

    // 3. Check if already member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_familyGroupId: {
          userId: user.id,
          familyGroupId: invitation.familyGroup.id,
        },
      },
    })

    if (existingMembership) {
      return res.status(400).json({ error: 'You are already a member of this group.' })
    }

    // 4. Accept transaction
    await prisma.$transaction(async (tx) => {
      // Create Membership
      await tx.membership.create({
        data: {
          userId: user.id,
          familyGroupId: invitation.familyGroup.id,
          role: 'MEMBER',
        },
      })

      // Update Invitation
      await tx.groupInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedByUserId: user.id,
          acceptedAt: new Date(),
        },
      })

      // Ensure default preferences
      // If user already has preferences, we might not need to touch them.
      // But if they are new to the platform (invited), likely they need defaults.
      // Let's ensure EMAIL is enabled if we have their email.

      const existingPref = await tx.preference.findUnique({
        where: {
          userId_channel: {
            userId: user.id,
            channel: 'EMAIL',
          },
        },
      })

      if (!existingPref && user.email) {
        await tx.preference.create({
          data: {
            userId: user.id,
            channel: 'EMAIL',
            enabled: true,
            destination: user.email,
            verifiedAt: new Date(), // Trusting the auth provider verify
          },
        })
      }
    })

    return res.status(200).json({ success: true, groupslug: invitation.familyGroup.slug })
  } catch (error: any) {
    console.error('Invitation accept error:', error)
    return res.status(500).json({ error: error.message })
  }
}
