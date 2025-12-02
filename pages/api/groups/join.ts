import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { slug } = req.body

    if (!slug) {
      return res.status(400).json({ error: 'Group slug is required' })
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

    // Find the family group
    const familyGroup = await prisma.familyGroup.findUnique({
      where: { slug },
    })

    if (!familyGroup) {
      return res.status(404).json({ error: 'קבוצה לא נמצאה. בדוק את קוד הקבוצה.' })
    }

    // Check if user is already a member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_familyGroupId: {
          userId: user.id,
          familyGroupId: familyGroup.id,
        },
      },
    })

    if (existingMembership) {
      return res.status(400).json({ error: 'כבר חבר בקבוצה זו' })
    }

    // Add the user as a MEMBER
    await prisma.membership.create({
      data: {
        userId: user.id,
        familyGroupId: familyGroup.id,
        role: 'MEMBER',
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
    console.error('Error joining group:', error)
    return res.status(500).json({ error: error.message || 'Failed to join group' })
  }
}
