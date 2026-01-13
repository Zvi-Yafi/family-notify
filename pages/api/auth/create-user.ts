import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { syncUser } from '@/lib/users'

/**
 * Create user in Prisma database (for signup before email confirmation)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, email, name, phone } = req.body

    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' })
    }

    // Create/Sync user using shared utility
    const newUser = await syncUser({
      userId: userId,
      email: email,
      name: name,
      phone: phone,
    })

    return res.status(200).json({
      success: true,
      user: newUser,
      action: 'synced',
    })

    return res.status(200).json({
      success: true,
      user: newUser,
      action: 'created',
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return res.status(500).json({ error: error.message || 'Failed to create user' })
  }
}
