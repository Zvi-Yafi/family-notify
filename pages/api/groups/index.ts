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
      console.error('❌ Groups API: Not authenticated', { authError: authError?.message })
      return res.status(401).json({ error: 'Unauthorized' })
    }

    console.log('✅ Groups API: Authenticated user found', { userId: user.id, email: user.email })

    // Check if user exists in Prisma
    let userInDb = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!userInDb) {
      console.warn('⚠️ Groups API: User not found in Prisma database, creating now', {
        userId: user.id,
      })
      // Auto-sync user if they don't exist (fallback for username/password login)
      try {
        userInDb = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email!,
            phone: user.phone || null,
          },
        })
        console.log('✅ Groups API: User auto-created in Prisma', { userId: userInDb.id })

        // Create default EMAIL preference
        try {
          await prisma.preference.create({
            data: {
              userId: userInDb.id,
              channel: 'EMAIL',
              enabled: true,
              destination: userInDb.email,
              verifiedAt: new Date(),
            },
          })
        } catch (prefError) {
          console.error('Failed to create default email preference:', prefError)
        }
      } catch (createError: any) {
        console.error('❌ Groups API: Failed to auto-create user:', createError)
        // If creation fails (e.g., race condition), try to fetch again
        userInDb = await prisma.user.findUnique({
          where: { id: user.id },
        })
        if (!userInDb) {
          // Still not found, return empty groups
          return res.status(200).json({ groups: [] })
        }
      }
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
