import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const { id } = req.query

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Event ID required' })
      }

      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              email: true,
            },
          },
        },
      })

      if (!event) {
        return res.status(404).json({ error: 'Event not found' })
      }

      return res.status(200).json({ event })
    } catch (error: any) {
      console.error('Error fetching event:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch event' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
