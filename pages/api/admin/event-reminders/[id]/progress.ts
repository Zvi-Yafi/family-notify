import type { NextApiRequest, NextApiResponse } from 'next'
import { ItemType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'
import { getDeliveryProgress } from '@/lib/services/delivery-progress.service'

const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Event reminder id is required' })
    }

    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const reminder = await prisma.eventReminder.findUnique({
      where: { id },
      select: { id: true, familyGroupId: true },
    })

    if (!reminder) {
      return res.status(404).json({ error: 'Event reminder not found' })
    }

    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL
    if (!isSuperAdmin) {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_familyGroupId: {
            userId: user.id,
            familyGroupId: reminder.familyGroupId,
          },
        },
      })

      if (!membership) {
        return res.status(403).json({ error: 'Forbidden - You are not a member of this group' })
      }
    }

    const progress = await getDeliveryProgress(ItemType.EVENT_REMINDER, reminder.id)
    return res.status(200).json(progress)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch event reminder progress' })
  }
}
