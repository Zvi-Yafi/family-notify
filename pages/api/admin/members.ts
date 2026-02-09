import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { CommunicationChannel } from '@prisma/client'
import { dispatchService } from '@/lib/dispatch/dispatch.service'
import { withRequestContext } from '@/lib/api-wrapper'
import { getGroupMembers, invalidateGroupCache } from '@/lib/services/cached-endpoints.service'

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.status(200).end()
    return
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (req.method === 'POST') {
    try {
      const { familyGroupId, email, name, phone, channel } = req.body

      if (!familyGroupId || !name) {
        return res.status(400).json({ error: 'familyGroupId and name are required' })
      }

      if (!email && !phone) {
        return res.status(400).json({ error: 'At least one of email or phone is required' })
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

        if (!adminMembership || adminMembership.role !== 'ADMIN') {
          return res
            .status(403)
            .json({ error: 'Forbidden - Only admins can add members' })
        }
      }

      // 3. Normalize email if provided
      const normalizedEmail = email ? email.trim().toLowerCase() : null

      // 4. Supabase Auth Management
      const adminClient = createAdminClient()
      let supabaseUserId: string | null = null

      if (normalizedEmail) {
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
          const {
            data: { user: newAuthUser },
            error: createError,
          } = await adminClient.auth.admin.createUser({
            email: normalizedEmail,
            password: req.body.password || Math.random().toString(36).slice(-8),
            email_confirm: true,
            user_metadata: { full_name: name },
          })

          if (createError) throw createError
          supabaseUserId = newAuthUser!.id
          console.log(
            `✨ Created new Supabase Auth user for ${normalizedEmail} with ID ${supabaseUserId}`
          )
        }
      }

      // 5. Create/Update user in Prisma
      const searchConditions = []
      if (normalizedEmail) searchConditions.push({ email: normalizedEmail })
      if (phone) searchConditions.push({ phone: phone })
      if (supabaseUserId) searchConditions.push({ id: supabaseUserId })

      let targetUser = await prisma.user.findFirst({
        where: searchConditions.length > 0 ? { OR: searchConditions } : undefined,
      })

      if (!targetUser) {
        targetUser = await prisma.user.create({
          data: {
            id: supabaseUserId || undefined,
            email: normalizedEmail,
            name: name,
            phone: phone || null,
          },
        })
      } else {
        targetUser = await prisma.user.update({
          where: { id: targetUser.id },
          data: {
            id: supabaseUserId || targetUser.id,
            email: normalizedEmail || targetUser.email,
            name: targetUser.name || name,
            phone: phone || targetUser.phone,
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
        dispatchService
          .dispatchWelcomeNotification(
            targetUser,
            familyGroup,
            channel as CommunicationChannel,
            req.body.password
          )
          .catch((err) => console.error('Failed to dispatch welcome notification:', err))
      }

      invalidateGroupCache(familyGroupId)

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

    const result = await getGroupMembers(familyGroupId)
    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching members:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch members' })
  }
}

export default withRequestContext(handler)
