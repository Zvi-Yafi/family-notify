import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { id: groupId } = req.query

    if (!groupId || typeof groupId !== 'string') {
      return res.status(400).json({ error: 'Group ID required' })
    }

    // Check membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_familyGroupId: {
          userId: user.id,
          familyGroupId: groupId,
        },
      },
    })

    if (!membership) {
      return res.status(404).json({ error: 'You are not a member of this group' })
    }

    // If user is ADMIN, check if they are the last admin
    if (membership.role === 'ADMIN') {
      const adminCount = await prisma.membership.count({
        where: {
          familyGroupId: groupId,
          role: 'ADMIN',
        },
      })

      const totalMembers = await prisma.membership.count({
        where: {
          familyGroupId: groupId,
        },
      })

      if (adminCount === 1 && totalMembers > 1) {
        return res.status(400).json({
          error: 'אתה המנהל היחיד בקבוצה. עליך למנות מנהל אחר לפני העזיבה.',
        })
      }
    }

    // Delete membership
    await prisma.membership.delete({
      where: {
        id: membership.id,
      },
    })

    return res.status(200).json({ success: true, message: 'עזבת את הקבוצה בהצלחה' })
  } catch (error: any) {
    console.error('Error leaving group:', error)
    return res.status(500).json({ error: error.message || 'Failed to leave group' })
  }
}
