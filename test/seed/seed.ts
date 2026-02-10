import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_ADMIN_A_ID = 'test-admin-a-00000000-0000-0000-0000-000000000001'
const TEST_MEMBER_A_ID = 'test-member-a-0000-0000-0000-0000-000000000002'
const TEST_ADMIN_B_ID = 'test-admin-b-00000000-0000-0000-0000-000000000003'
const TEST_FAMILY_A_ID = 'test-family-a-0000-0000-0000-0000-000000000001'
const TEST_FAMILY_B_ID = 'test-family-b-0000-0000-0000-0000-000000000002'

async function seedTestData() {
  console.log('🧪 Seeding test data...')

  const familyA = await prisma.familyGroup.upsert({
    where: { slug: 'test-family-a' },
    update: {},
    create: {
      id: TEST_FAMILY_A_ID,
      name: 'Test Family A',
      slug: 'test-family-a',
    },
  })

  const familyB = await prisma.familyGroup.upsert({
    where: { slug: 'test-family-b' },
    update: {},
    create: {
      id: TEST_FAMILY_B_ID,
      name: 'Test Family B',
      slug: 'test-family-b',
    },
  })

  console.log(`✅ Families: ${familyA.name}, ${familyB.name}`)

  const adminA = await prisma.user.upsert({
    where: { email: 'test-admin-a@familynotify.test' },
    update: {},
    create: {
      id: TEST_ADMIN_A_ID,
      email: 'test-admin-a@familynotify.test',
      phone: '+972500000001',
      name: 'Admin A',
    },
  })

  const memberA = await prisma.user.upsert({
    where: { email: 'test-member-a@familynotify.test' },
    update: {},
    create: {
      id: TEST_MEMBER_A_ID,
      email: 'test-member-a@familynotify.test',
      phone: '+972500000002',
      name: 'Member A',
    },
  })

  const adminB = await prisma.user.upsert({
    where: { email: 'test-admin-b@familynotify.test' },
    update: {},
    create: {
      id: TEST_ADMIN_B_ID,
      email: 'test-admin-b@familynotify.test',
      phone: '+972500000003',
      name: 'Admin B',
    },
  })

  console.log(`✅ Users: ${adminA.name}, ${memberA.name}, ${adminB.name}`)

  await prisma.membership.upsert({
    where: {
      userId_familyGroupId: {
        userId: adminA.id,
        familyGroupId: familyA.id,
      },
    },
    update: {},
    create: {
      userId: adminA.id,
      familyGroupId: familyA.id,
      role: 'ADMIN',
    },
  })

  await prisma.membership.upsert({
    where: {
      userId_familyGroupId: {
        userId: memberA.id,
        familyGroupId: familyA.id,
      },
    },
    update: {},
    create: {
      userId: memberA.id,
      familyGroupId: familyA.id,
      role: 'MEMBER',
    },
  })

  await prisma.membership.upsert({
    where: {
      userId_familyGroupId: {
        userId: adminB.id,
        familyGroupId: familyB.id,
      },
    },
    update: {},
    create: {
      userId: adminB.id,
      familyGroupId: familyB.id,
      role: 'ADMIN',
    },
  })

  console.log('✅ Memberships created')

  const channels = ['EMAIL', 'PUSH', 'WHATSAPP', 'SMS'] as const
  const userPrefs = [
    { user: adminA, destinations: { EMAIL: adminA.email, PUSH: null, WHATSAPP: adminA.phone, SMS: adminA.phone } },
    { user: memberA, destinations: { EMAIL: memberA.email, PUSH: null, WHATSAPP: memberA.phone, SMS: memberA.phone } },
    { user: adminB, destinations: { EMAIL: adminB.email, PUSH: null, WHATSAPP: adminB.phone, SMS: adminB.phone } },
  ]

  for (const { user, destinations } of userPrefs) {
    for (const channel of channels) {
      await prisma.preference.upsert({
        where: {
          userId_channel: {
            userId: user.id,
            channel,
          },
        },
        update: {},
        create: {
          userId: user.id,
          channel,
          enabled: channel === 'EMAIL',
          destination: destinations[channel],
          verifiedAt: channel === 'EMAIL' ? new Date() : null,
        },
      })
    }
  }

  console.log('✅ Preferences created for all users')

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7)

  const existingEvent = await prisma.event.findFirst({
    where: {
      familyGroupId: familyA.id,
      title: 'Test Event - Family A',
    },
  })

  if (!existingEvent) {
    await prisma.event.create({
      data: {
        familyGroupId: familyA.id,
        title: 'Test Event - Family A',
        description: 'Seeded test event for E2E tests',
        startsAt: futureDate,
        location: 'Tel Aviv',
        createdBy: adminA.id,
      },
    })
    console.log('✅ Test event created in Family A')
  }

  const existingAnnouncement = await prisma.announcement.findFirst({
    where: {
      familyGroupId: familyA.id,
      title: 'Test Announcement - Family A',
    },
  })

  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        familyGroupId: familyA.id,
        title: 'Test Announcement - Family A',
        body: 'Seeded test announcement for E2E tests',
        type: 'GENERAL',
        createdBy: adminA.id,
        publishedAt: new Date(),
      },
    })
    console.log('✅ Test announcement created in Family A')
  }

  console.log('🎉 Test seed completed!')
}

seedTestData()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Test seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

export {
  TEST_ADMIN_A_ID,
  TEST_MEMBER_A_ID,
  TEST_ADMIN_B_ID,
  TEST_FAMILY_A_ID,
  TEST_FAMILY_B_ID,
}
