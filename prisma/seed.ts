import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a default family group
  const familyGroup = await prisma.familyGroup.upsert({
    where: { slug: 'default-family-group' },
    update: {},
    create: {
      id: 'default-family-group',
      name: 'משפחת ברירת המחדל',
      slug: 'default-family-group',
    },
  })

  console.log('✅ Created family group:', familyGroup.name)

  // Create demo admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'demo-user-id',
      email: 'admin@example.com',
      phone: '+972501234567',
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create membership for admin
  const membership = await prisma.membership.upsert({
    where: {
      userId_familyGroupId: {
        userId: adminUser.id,
        familyGroupId: familyGroup.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      familyGroupId: familyGroup.id,
      role: 'ADMIN',
    },
  })

  console.log('✅ Created admin membership')

  // Create default preferences for admin
  await prisma.preference.upsert({
    where: {
      userId_channel: {
        userId: adminUser.id,
        channel: 'EMAIL',
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      channel: 'EMAIL',
      enabled: true,
      destination: adminUser.email,
      verifiedAt: new Date(),
    },
  })

  console.log('✅ Created email preference')

  // Create a demo announcement
  const announcement = await prisma.announcement.create({
    data: {
      familyGroupId: familyGroup.id,
      title: 'ברוכים הבאים ל-FamilyNotify!',
      body: 'זוהי הודעת בדיקה ראשונה. המערכת מוכנה לשימוש!',
      type: 'GENERAL',
      createdBy: adminUser.id,
      publishedAt: new Date(),
    },
  })

  console.log('✅ Created demo announcement:', announcement.title)

  // Create a demo event
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7) // 7 days from now

  const event = await prisma.event.create({
    data: {
      familyGroupId: familyGroup.id,
      title: 'אירוע משפחתי',
      description: 'אירוע משפחתי לדוגמה',
      startsAt: futureDate,
      location: 'תל אביב',
      createdBy: adminUser.id,
      scheduledReminderOffsets: [1440, 60], // 24 hours and 1 hour before
    },
  })

  console.log('✅ Created demo event:', event.title)

  console.log('🎉 Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })



