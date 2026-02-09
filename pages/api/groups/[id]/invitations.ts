import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'
import { emailProvider } from '@/lib/providers/email.provider'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: familyGroupId } = req.query
  if (!familyGroupId || typeof familyGroupId !== 'string') {
    return res.status(400).json({ error: 'Invalid group ID' })
  }

  try {
    // 1. Auth check
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // 2. Check membership and permissions
    const membership = await prisma.membership.findUnique({
      where: {
        userId_familyGroupId: {
          userId: user.id,
          familyGroupId,
        },
      },
      include: {
        familyGroup: true,
        user: true, // Inviter details
      },
    })

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' })
    }

    if (membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // GET: List invitations
    if (req.method === 'GET') {
      try {
        const invitations = await prisma.groupInvitation.findMany({
          where: { familyGroupId },
          orderBy: { createdAt: 'desc' },
          include: {
            inviter: { select: { name: true, email: true } },
            acceptedBy: { select: { name: true, email: true } },
          },
        })
        return res.status(200).json({ invitations })
      } catch (error: any) {
        console.error('Failed to list invitations:', error)
        return res.status(500).json({ error: 'Failed to list invitations' })
      }
    }

    // POST: Create invitations
    if (req.method === 'POST') {
      const { emails } = req.body
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ error: 'No emails provided' })
      }

      const results = []
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      for (const email of emails) {
        const normalizedEmail = email.trim().toLowerCase()

        try {
          // Check if already a member
          const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
              memberships: {
                where: { familyGroupId },
              },
            },
          })

          if (existingUser && existingUser.memberships.length > 0) {
            results.push({ email: normalizedEmail, status: 'error', message: 'Already a member' })
            continue
          }

          // Upsert invitation
          const token = crypto.randomUUID()

          const existingInvitation = await prisma.groupInvitation.findFirst({
            where: {
              familyGroupId,
              email: normalizedEmail,
              status: 'PENDING',
            },
          })

          let invitation
          if (existingInvitation) {
            invitation = await prisma.groupInvitation.update({
              where: { id: existingInvitation.id },
              data: {
                token,
                invitedBy: user.id,
                updatedAt: new Date(),
              },
            })
          } else {
            invitation = await prisma.groupInvitation.create({
              data: {
                familyGroupId,
                email: normalizedEmail,
                token,
                invitedBy: user.id,
                status: 'PENDING',
              },
            })
          }

          const inviteUrl = `${baseUrl}/invitations/${token}`
          const emailResult = await emailProvider.sendInvitation(
            normalizedEmail,
            membership.familyGroup.name,
            membership.user.name || membership.user.email || 'Group Admin',
            inviteUrl
          )

          if (!emailResult.success) {
            results.push({
              email: normalizedEmail,
              status: 'warning',
              message: 'Invitation created but email failed',
              error: emailResult.error,
            })
          } else {
            results.push({ email: normalizedEmail, status: 'success' })
          }
        } catch (err: any) {
          console.error(`Failed to invite ${normalizedEmail}:`, err)
          results.push({ email: normalizedEmail, status: 'error', message: err.message })
        }
      }

      return res.status(200).json({ results })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Invitation error:', error)
    return res.status(500).json({ error: error.message })
  }
}
