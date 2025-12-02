import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, slug } = req.body

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' })
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

    // Check if slug already exists
    const existingGroup = await prisma.familyGroup.findUnique({
      where: { slug },
    })

    if (existingGroup) {
      return res.status(400).json({ error: 'קוד הקבוצה כבר קיים, בחר שם אחר' })
    }

    // Create the family group
    const familyGroup = await prisma.familyGroup.create({
      data: {
        name,
        slug,
      },
    })

    // Add the user as an ADMIN member
    await prisma.membership.create({
      data: {
        userId: user.id,
        familyGroupId: familyGroup.id,
        role: 'ADMIN',
      },
    })

    return res.status(200).json({
      success: true,
      group: {
        id: familyGroup.id,
        name: familyGroup.name,
        slug: familyGroup.slug,
      },
    })
  } catch (error: any) {
    console.error('Error creating group:', error)
    return res.status(500).json({ error: error.message || 'Failed to create group' })
  }
}
