import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Sync user from Supabase Auth to Prisma database
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createServerClient(req, res)

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Sync-user: Not authenticated', { authError: authError?.message })
      return res.status(401).json({ error: 'Not authenticated' })
    }

    console.log('✅ Sync-user: Authenticated user found', { userId: user.id, email: user.email })

    // Check if user already exists in Prisma by ID
    let existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    // If not found by ID, check by email (for pre-created users)
    if (!existingUser && user.email) {
      existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      })

      // If found by email but with different ID, migrate to Supabase Auth ID
      if (existingUser && existingUser.id !== user.id) {
        console.log(
          '🔄 Sync-user: Found user by email, migrating ID from',
          existingUser.id,
          'to',
          user.id
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
                id: user.id,
                email: user.email!,
                phone: user.phone || oldUserPhone || null,
              },
            })

            // Step 3: Update all related records to point to new user
            await tx.membership.updateMany({
              where: { userId: oldUserId },
              data: { userId: user.id },
            })

            await tx.preference.updateMany({
              where: { userId: oldUserId },
              data: { userId: user.id },
            })

            await tx.announcement.updateMany({
              where: { createdBy: oldUserId },
              data: { createdBy: user.id },
            })

            await tx.event.updateMany({
              where: { createdBy: oldUserId },
              data: { createdBy: user.id },
            })

            await tx.deliveryAttempt.updateMany({
              where: { userId: oldUserId },
              data: { userId: user.id },
            })

            await tx.consent.updateMany({
              where: { userId: oldUserId },
              data: { userId: user.id },
            })

            // Step 4: Delete the old user record
            await tx.user.delete({
              where: { id: oldUserId },
            })

            return newUser
          })

          console.log('✅ Sync-user: User ID migrated successfully')
          return res.status(200).json({
            success: true,
            user: updatedUser,
            action: 'migrated',
          })
        } catch (txError: any) {
          console.error('❌ Sync-user: Failed to migrate user ID:', txError)
          throw new Error('Failed to migrate user from pre-created account')
        }
      }
    }

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email!,
          phone: user.phone || null,
          updatedAt: new Date(),
        },
      })

      console.log('✅ Sync-user: User updated in database', { userId: updatedUser.id })
      return res.status(200).json({
        success: true,
        user: updatedUser,
        action: 'updated',
      })
    }

    // Create new user in Prisma
    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        phone: user.phone || null,
      },
    })

    console.log('✅ Sync-user: New user created in database', { userId: newUser.id })

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
    console.error('Error syncing user:', error)
    return res.status(500).json({ error: error.message || 'Failed to sync user' })
  }
}
