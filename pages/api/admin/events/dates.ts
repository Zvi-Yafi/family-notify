import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'
import { withRequestContext } from '@/lib/api-wrapper'
import { getGroupEventDatesForMonth } from '@/lib/services/cached-endpoints.service'

const MONTH_REGEX = /^\d{4}-\d{2}$/

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { familyGroupId, month } = req.query

    if (!familyGroupId || typeof familyGroupId !== 'string') {
      return res.status(400).json({ error: 'familyGroupId required' })
    }

    if (!month || typeof month !== 'string' || !MONTH_REGEX.test(month)) {
      return res.status(400).json({ error: 'month required in YYYY-MM format' })
    }

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

    const result = await getGroupEventDatesForMonth(familyGroupId, month)
    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching event dates:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch event dates' })
  }
}

export default withRequestContext(handler)
