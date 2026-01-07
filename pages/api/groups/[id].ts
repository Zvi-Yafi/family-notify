import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Group ID is required' })
  }

  if (req.method === 'GET') {
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

      const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'
      const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

      // Verify membership
      if (!isSuperAdmin) {
        const membership = await prisma.membership.findUnique({
          where: {
            userId_familyGroupId: {
              userId: user.id,
              familyGroupId: id,
            },
          },
        })

        if (!membership) {
          return res.status(403).json({ error: 'Forbidden: Member access required' })
        }
      }

      const group = await prisma.familyGroup.findUnique({
        where: { id },
      })

      if (!group) {
        return res.status(404).json({ error: 'Group not found' })
      }

      return res.status(200).json({ group })
    } catch (error: any) {
      console.error('Error fetching group:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch group' })
    }
  }

  if (req.method !== 'PUT') {
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

    const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'
    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

    // Verify membership and ADMIN role
    if (!isSuperAdmin) {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_familyGroupId: {
            userId: user.id,
            familyGroupId: id,
          },
        },
      })

      if (!membership || membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' })
      }
    }

    const { name, slug } = req.body

    if (!name && !slug) {
      return res.status(400).json({ error: 'At least one field (name or slug) must be provided' })
    }

    // Prepare update data
    const updateData: any = {}
    if (name) updateData.name = name

    if (slug) {
      // Check if slug is already taken by another group
      const existingGroup = await prisma.familyGroup.findUnique({
        where: { slug },
      })

      if (existingGroup && existingGroup.id !== id) {
        return res.status(400).json({ error: 'קוד הקבוצה כבר קיים, בחר שם אחר' })
      }
      updateData.slug = slug
    }

    // Update the group
    const updatedGroup = await prisma.familyGroup.update({
      where: { id },
      data: updateData,
    })

    return res.status(200).json({
      success: true,
      group: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        slug: updatedGroup.slug,
      },
    })
  } catch (error: any) {
    console.error('Error updating group:', error)
    return res.status(500).json({ error: error.message || 'Failed to update group' })
  }
}
