import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (existingUser) {
      return res.status(200).json({
        success: true,
        user: existingUser,
        action: 'exists',
      })
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: email,
        name: name || null,
        phone: phone || null,
      },
    })

    // Create default EMAIL preference
    try {
      await prisma.preference.create({
        data: {
          userId: newUser.id,
          channel: 'EMAIL',
          enabled: true,
          destination: newUser.email,
          verifiedAt: new Date(), // Auto-verify email since they signed up with it
        },
      })
    } catch (prefError) {
      console.error('Failed to create default email preference:', prefError)
      // Don't fail user creation if preference creation fails
    }

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
