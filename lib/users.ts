import { prisma } from '@/lib/prisma'

interface SyncUserParams {
  userId: string
  email?: string | null
  name?: string | null
  phone?: string | null
}

/**
 * Robustly syncs a user from Supabase to Prisma.
 * Handles email normalization and account linking (updating ID if email matches).
 */
export async function syncUser({ userId, email, name, phone }: SyncUserParams) {
  const normalizedEmail = email ? email.trim().toLowerCase() : null

  const existingById = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (existingById) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail || existingById.email,
        name: name || existingById.name,
        phone: phone || existingById.phone,
        updatedAt: new Date(),
      },
    })
  }

  if (normalizedEmail) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingByEmail) {
      console.log(
        `Linking existing user ${existingByEmail.id} to new ID ${userId} via email ${normalizedEmail}`
      )

      try {
        return await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            id: userId,
            name: name || existingByEmail.name,
            phone: phone || existingByEmail.phone,
            updatedAt: new Date(),
          },
        })
      } catch (e) {
        console.error('Failed to update user ID directly, falling back to manual migration', e)
        throw e
      }
    }
  }

  const newUser = await prisma.user.create({
    data: {
      id: userId,
      email: normalizedEmail,
      name: name || null,
      phone: phone || null,
    },
  })

  if (normalizedEmail) {
    try {
      await prisma.preference.upsert({
        where: {
          userId_channel: {
            userId: newUser.id,
            channel: 'EMAIL',
          },
        },
        update: {},
        create: {
          userId: newUser.id,
          channel: 'EMAIL',
          enabled: true,
          destination: newUser.email,
          verifiedAt: new Date(),
        },
      })
    } catch (prefError) {
      console.error('Failed to create default email preference:', prefError)
    }
  }

  return newUser
}
