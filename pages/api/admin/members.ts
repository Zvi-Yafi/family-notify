import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { CommunicationChannel } from '@prisma/client'
import { dispatchService } from '@/lib/dispatch/dispatch.service'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (req.method === 'POST') {
    try {
      const { familyGroupId, email, name, phone, channel } = req.body

      if (!familyGroupId || !email || !name) {
        return res.status(400).json({ error: 'familyGroupId, email, and name are required' })
      }

      // 1. Get authenticated user (admin)
      const supabase = createServerClient(req, res)
      const {
        data: { user: adminUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !adminUser) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'
      const isSuperAdmin = adminUser.email === SUPER_ADMIN_EMAIL

      // 2. VERIFY PERMISSION
      if (!isSuperAdmin) {
        const adminMembership = await prisma.membership.findUnique({
          where: {
            userId_familyGroupId: {
              userId: adminUser.id,
              familyGroupId,
            },
          },
        })

        if (
          !adminMembership ||
          (adminMembership.role !== 'ADMIN' && adminMembership.role !== 'EDITOR')
        ) {
          return res
            .status(403)
            .json({ error: 'Forbidden - Only admins and editors can add members' })
        }
      }

      // 3. Normalize email
      const normalizedEmail = email.trim().toLowerCase()

      // 4. Supabase Auth Management
      const adminClient = createAdminClient()
      let supabaseUserId: string | null = null

      // Check if user exists in Supabase Auth
      const {
        data: { users },
        error: listError,
      } = await adminClient.auth.admin.listUsers()
      if (listError) throw listError

      const existingAuthUser = users.find((u) => u.email?.toLowerCase() === normalizedEmail)

      if (existingAuthUser) {
        supabaseUserId = existingAuthUser.id
        console.log(
          `🔗 User ${normalizedEmail} already exists in Supabase Auth with ID ${supabaseUserId}`
        )
      } else {
        // Create new user in Supabase Auth
        const {
          data: { user: newAuthUser },
          error: createError,
        } = await adminClient.auth.admin.createUser({
          email: normalizedEmail,
          password: req.body.password || Math.random().toString(36).slice(-8), // Fallback if no password provided
          email_confirm: true,
          user_metadata: { full_name: name },
        })

        if (createError) throw createError
        supabaseUserId = newAuthUser!.id
        console.log(
          `✨ Created new Supabase Auth user for ${normalizedEmail} with ID ${supabaseUserId}`
        )
      }

      // 5. Create/Update user in Prisma
      let targetUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: normalizedEmail }, { id: supabaseUserId }],
        },
      })

      if (!targetUser) {
        targetUser = await prisma.user.create({
          data: {
            id: supabaseUserId,
            email: normalizedEmail,
            name: name,
            phone: phone || null,
          },
        })
      } else {
        targetUser = await prisma.user.update({
          where: { id: targetUser.id },
          data: {
            id: supabaseUserId, // Ensure ID is synced with Supabase
            name: targetUser.name || name,
            phone: targetUser.phone || phone || null,
          },
        })
      }

      // 5. Create/Update membership
      const membership = await prisma.membership.upsert({
        where: {
          userId_familyGroupId: {
            userId: targetUser.id,
            familyGroupId,
          },
        },
        update: {}, // Keep existing role
        create: {
          userId: targetUser.id,
          familyGroupId,
          role: 'MEMBER',
        },
      })

      // 6. Set preferences if channel is provided
      if (channel) {
        await prisma.preference.upsert({
          where: {
            userId_channel: {
              userId: targetUser.id,
              channel: channel as CommunicationChannel,
            },
          },
          update: {
            enabled: true,
            destination: (channel === 'EMAIL' ? normalizedEmail : phone) || undefined,
            verifiedAt: new Date(),
          },
          create: {
            userId: targetUser.id,
            channel: channel as CommunicationChannel,
            enabled: true,
            destination: (channel === 'EMAIL' ? normalizedEmail : phone) || undefined,
            verifiedAt: new Date(),
          },
        })
      }

      // 7. Trigger Welcome Notification
      const familyGroup = await prisma.familyGroup.findUnique({
        where: { id: familyGroupId },
      })

      if (channel && familyGroup) {
        // Run asnyc dispatch
        dispatchService
          .dispatchWelcomeNotification(
            targetUser,
            familyGroup,
            channel as CommunicationChannel,
            req.body.password
          )
          .catch((err) => console.error('Failed to dispatch welcome notification:', err))
      }

      return res.status(200).json({
        success: true,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
        },
        membership,
      })
    } catch (error: any) {
      console.error('Error adding member:', error)
      return res.status(500).json({ error: error.message || 'Failed to add member' })
    }
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

    const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'
    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

    // VERIFY MEMBERSHIP
    if (!isSuperAdmin) {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_familyGroupId: {
            userId: user.id,
            familyGroupId,
          },
        },
      })

      if (!membership) {
        return res.status(403).json({ error: 'Forbidden - You are not a member of this group' })
      }
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
            name: true,
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
      name: membership.user.name,
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
