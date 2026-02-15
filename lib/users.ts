import { prisma } from '@/lib/prisma'

interface SyncUserParams {
  userId: string
  email?: string | null
  name?: string | null
  phone?: string | null
}

export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1)
  }
  
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return cleaned
  }
  
  if (cleaned.startsWith('972') && cleaned.length === 12) {
    return cleaned
  }
  
  return cleaned
}

/**
 * Robustly syncs a user from Supabase to Prisma.
 * Handles email normalization and account linking (updating ID if email matches).
 */
export async function syncUser({ userId, email, name, phone }: SyncUserParams) {
  const normalizedEmail = email ? email.trim().toLowerCase() : null
  const normalizedPhone = phone ? normalizePhoneNumber(phone) : null

  const existingById = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (existingById) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail || existingById.email,
        name: name || existingById.name,
        phone: normalizedPhone || existingById.phone,
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
            phone: normalizedPhone || existingByEmail.phone,
            updatedAt: new Date(),
          },
        })
      } catch (e) {
        console.error('Failed to update user ID directly, falling back to manual migration', e)
        throw e
      }
    }
  }

  if (normalizedPhone) {
    const existingByPhone = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (existingByPhone) {
      console.log(
        `Linking existing user ${existingByPhone.id} to new ID ${userId} via phone ${normalizedPhone}`
      )

      try {
        return await prisma.user.update({
          where: { id: existingByPhone.id },
          data: {
            id: userId,
            email: normalizedEmail || existingByPhone.email,
            name: name || existingByPhone.name,
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
      phone: normalizedPhone,
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
