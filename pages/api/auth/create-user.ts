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
    const { userId, email, phone } = req.body

    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' })
    }

    // Check if user already exists by ID
    let existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (existingUser) {
      return res.status(200).json({
        success: true,
        user: existingUser,
        action: 'exists',
      })
    }

    // Check if user already exists by email (for pre-created users)
    existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // If found by email but with different ID, migrate to Supabase Auth ID
    if (existingUser && existingUser.id !== userId) {
      console.log(
        '🔄 Create-user: Found user by email, migrating ID from',
        existingUser.id,
        'to',
        userId
      )

      // Save values to local variables for TypeScript null-safety in transaction
      const oldUserId = existingUser.id
      const oldUserEmail = existingUser.email
      const oldUserPhone = existingUser.phone

      try {
        // Use a transaction to ensure all updates succeed or fail together
        const updatedUser = await prisma.$transaction(async (tx) => {
          // Step 1: Temporarily change the old user's email to avoid unique constraint
          const tempEmail = `temp_${Date.now()}_${oldUserEmail}`
          await tx.user.update({
            where: { id: oldUserId },
            data: { email: tempEmail },
          })

          // Step 2: Create new user with Supabase Auth ID
          const newUser = await tx.user.create({
            data: {
              id: userId,
              email: email.toLowerCase(),
              phone: phone || oldUserPhone || null,
            },
          })

          // Step 3: Update all related records to point to new user
          await tx.membership.updateMany({
            where: { userId: oldUserId },
            data: { userId: userId },
          })

          await tx.preference.updateMany({
            where: { userId: oldUserId },
            data: { userId: userId },
          })

          await tx.announcement.updateMany({
            where: { createdBy: oldUserId },
            data: { createdBy: userId },
          })

          await tx.event.updateMany({
            where: { createdBy: oldUserId },
            data: { createdBy: userId },
          })

          await tx.deliveryAttempt.updateMany({
            where: { userId: oldUserId },
            data: { userId: userId },
          })

          await tx.consent.updateMany({
            where: { userId: oldUserId },
            data: { userId: userId },
          })

          // Step 4: Delete the old user record
          await tx.user.delete({
            where: { id: oldUserId },
          })

          return newUser
        })

        console.log('✅ Create-user: User ID migrated successfully')
        return res.status(200).json({
          success: true,
          user: updatedUser,
          action: 'migrated',
        })
      } catch (txError: any) {
        console.error('❌ Create-user: Failed to migrate user ID:', txError)
        throw new Error('Failed to migrate user from pre-created account')
      }
    }

    // If user exists by email with same ID, just return it
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
        email: email.toLowerCase(),
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
