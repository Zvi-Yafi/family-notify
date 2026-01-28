import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { withRequestContext } from '@/lib/api-wrapper'
import { getSuperAdminStats } from '@/lib/services/super-admin-stats.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'

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

    if (user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const stats = await getSuperAdminStats()
    return res.status(200).json(stats)
  } catch (error: any) {
    console.error('Super Admin Stats Error:', error)
    return res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}

export default withRequestContext(handler)
