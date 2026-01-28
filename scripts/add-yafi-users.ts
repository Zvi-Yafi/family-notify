import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface UserToAdd {
  name: string
  email?: string
  phone: string
  existingUser?: boolean
  notes?: string
}

const usersToAdd: UserToAdd[] = [
  {
    name: 'נתנאל שלום',
    phone: '+1 (718) 759-8976',
    existingUser: true,
    notes: 'Update phone and enable WhatsApp, disable Email',
  },
  {
    name: 'אריאל יפעי',
    phone: '+1 (917) 860-1297',
  },
  {
    name: 'יפעת שלום',
    phone: '+1 (917) 705-4142',
    existingUser: true,
    notes: 'Update phone and enable WhatsApp, disable Email',
  },
  {
    name: 'בנימין יפעי',
    phone: '+1 (347) 280-6498',
  },
  {
    name: 'עזרא יפעי',
    phone: '+1 (347) 401-2382',
  },
  {
    name: 'נעמי יפעי',
    phone: '+1 (718) 354-7710',
    existingUser: true,
    notes: 'Update phone and enable WhatsApp, disable Email',
  },
  {
    name: 'יצחק יפעי',
    phone: '+1 (347) 242-9898',
    existingUser: true,
    notes: 'Known as Tzachi, update phone and enable WhatsApp, disable Email',
  },
  {
    name: 'רותם יפעי',
    email: 'rotemyafi7@gmail.com',
    phone: '0547615555',
  },
]

async function main() {
  console.log('🚀 Starting to add/update Yafi family users...\n')

  const yafiGroup = await prisma.familyGroup.findUnique({
    where: { slug: 'yafi' },
  })

  if (!yafiGroup) {
    console.error('❌ Error: Could not find group with slug "yafi"')
    throw new Error('Group not found')
  }

  console.log(`✅ Found group: ${yafiGroup.name} (ID: ${yafiGroup.id})\n`)

  for (const userData of usersToAdd) {
    console.log(`📝 Processing: ${userData.name}`)
    if (userData.notes) {
      console.log(`   ℹ️  Note: ${userData.notes}`)
    }

    try {
      const normalizedEmail = userData.email?.toLowerCase()
      const normalizedPhone = userData.phone

      const searchConditions = []
      if (normalizedEmail) searchConditions.push({ email: normalizedEmail })
      if (normalizedPhone) searchConditions.push({ phone: normalizedPhone })
      if (userData.existingUser) searchConditions.push({ name: userData.name })

      let user = await prisma.user.findFirst({
        where: searchConditions.length > 0 ? { OR: searchConditions } : undefined,
      })

      if (user) {
        console.log(`   ✓ Found existing user ID: ${user.id}`)

        const multipleMatches = await prisma.user.count({
          where: searchConditions.length > 0 ? { OR: searchConditions } : undefined,
        })

        if (multipleMatches > 1) {
          console.log(
            `   ⚠️  Warning: Found ${multipleMatches} users matching criteria. Updating first match only.`
          )
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: normalizedEmail || user.email,
            phone: normalizedPhone || user.phone,
            name: userData.name || user.name,
          },
        })
        console.log(`   ✓ Updated user details`)
      } else {
        console.log(`   ℹ️  User not found, creating new user...`)
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            phone: normalizedPhone,
            name: userData.name,
          },
        })
        console.log(`   ✓ Created new user ID: ${user.id}`)
      }

      const membership = await prisma.membership.findUnique({
        where: {
          userId_familyGroupId: {
            userId: user.id,
            familyGroupId: yafiGroup.id,
          },
        },
      })

      if (!membership) {
        await prisma.membership.create({
          data: {
            userId: user.id,
            familyGroupId: yafiGroup.id,
            role: 'MEMBER',
          },
        })
        console.log(`   ✓ Added to Yafi group as MEMBER`)
      } else {
        console.log(`   ✓ Already a member of Yafi group`)
      }

      await prisma.preference.upsert({
        where: {
          userId_channel: {
            userId: user.id,
            channel: 'WHATSAPP',
          },
        },
        update: {
          enabled: true,
          destination: normalizedPhone,
          verifiedAt: new Date(),
        },
        create: {
          userId: user.id,
          channel: 'WHATSAPP',
          enabled: true,
          destination: normalizedPhone,
          verifiedAt: new Date(),
        },
      })
      console.log(`   ✓ Enabled WhatsApp notifications`)

      await prisma.preference.upsert({
        where: {
          userId_channel: {
            userId: user.id,
            channel: 'EMAIL',
          },
        },
        update: {
          enabled: false,
        },
        create: {
          userId: user.id,
          channel: 'EMAIL',
          enabled: false,
          destination: normalizedEmail || null,
          verifiedAt: null,
        },
      })
      console.log(`   ✓ Disabled Email notifications`)

      console.log(`   ✅ Completed for ${userData.name}\n`)
    } catch (error: any) {
      console.error(`   ❌ Error processing ${userData.name}:`, error.message)
      console.log(`   ⏭️  Skipping to next user...\n`)
    }
  }

  console.log('🎉 All updates completed successfully!')
}

main()
  .catch((error) => {
    console.error('❌ Fatal Error:', error)
    throw error
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
