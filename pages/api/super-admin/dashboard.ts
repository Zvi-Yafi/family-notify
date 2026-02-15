import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { withRequestContext } from '@/lib/api-wrapper'
import { getSuperAdminDashboard } from '@/lib/services/super-admin-dashboard.service'

const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
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

    const dashboard = await getSuperAdminDashboard()
    return res.status(200).json(dashboard)
  } catch (error: any) {
    console.error('Super Admin Dashboard Error:', error)
    return res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}

export default withRequestContext(handler)
