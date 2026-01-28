import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface UserUpdate {
  name: string
  email: string
  phone: string
}

const usersToUpdate: UserUpdate[] = [
  {
    name: 'יחיאל יפעי',
    email: 'yamiyafi@gmail.com',
    phone: '0555506762',
  },
  {
    name: 'יהונתן יפעי',
    email: 'yehonatanyafi@gmail.com',
    phone: '0548744045',
  },
  {
    name: 'יפעת שלום',
    email: 'yifatshalom@gmail.com',
    phone: '+1 (917) 705‑4142',
  },
  {
    name: 'Tzachi',
    email: 'tzachi130@gmail.com',
    phone: '+1 (347) 242‑9898',
  },
]

async function main() {
  console.log('🚀 Starting user preference updates for yafi group...\n')

  // Find the yafi group
  const yafiGroup = await prisma.familyGroup.findUnique({
    where: { slug: 'yafi' },
  })

  if (!yafiGroup) {
    console.error('❌ Error: Could not find group with slug "yafi"')
    throw new Error('Group not found')
  }

  console.log(`✅ Found group: ${yafiGroup.name} (ID: ${yafiGroup.id})\n`)

  for (const userData of usersToUpdate) {
    console.log(`📝 Processing: ${userData.name} (${userData.email})`)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() },
    })

    if (!user) {
      console.log(`   ⚠️  User not found in database, skipping...`)
      continue
    }

    console.log(`   ✓ Found user ID: ${user.id}`)

    // Update phone number
    await prisma.user.update({
      where: { id: user.id },
      data: { phone: userData.phone },
    })
    console.log(`   ✓ Updated phone: ${userData.phone}`)

    // Enable WhatsApp preference
    await prisma.preference.upsert({
      where: {
        userId_channel: {
          userId: user.id,
          channel: 'WHATSAPP',
        },
      },
      update: {
        enabled: true,
        destination: userData.phone,
        verifiedAt: new Date(),
      },
      create: {
        userId: user.id,
        channel: 'WHATSAPP',
        enabled: true,
        destination: userData.phone,
        verifiedAt: new Date(),
      },
    })
    console.log(`   ✓ Enabled WhatsApp notifications`)

    // Disable Email preference
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
        destination: userData.email.toLowerCase(),
        verifiedAt: null,
      },
    })
    console.log(`   ✓ Disabled Email notifications`)

    console.log(`   ✅ Completed for ${userData.name}\n`)
  }

  console.log('🎉 All updates completed successfully!')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
