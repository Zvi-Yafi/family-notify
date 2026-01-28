import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'
import { withRequestContext } from '@/lib/api-wrapper'
import { getGroupStats } from '@/lib/services/stats.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
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

    const stats = await getGroupStats(familyGroupId)
    return res.status(200).json(stats)
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch stats' })
  }
}

export default withRequestContext(handler)
