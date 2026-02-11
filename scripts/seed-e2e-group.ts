import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL
const MEMBER_EMAIL = process.env.E2E_MEMBER_EMAIL
const GROUP_NAME = 'testForGit'
const GROUP_SLUG = 'testforgit'

async function seedE2EGroup() {
  if (!ADMIN_EMAIL || !MEMBER_EMAIL) {
    console.error('E2E_ADMIN_EMAIL and E2E_MEMBER_EMAIL must be set')
    process.exit(1)
  }

  console.log(`Admin email: ${ADMIN_EMAIL}`)
  console.log(`Member email: ${MEMBER_EMAIL}`)

  let adminUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: { email: ADMIN_EMAIL, name: 'E2E Admin' },
    })
    console.log(`Created admin user: ${adminUser.id}`)
  } else {
    console.log(`Found admin user: ${adminUser.id}`)
  }

  let memberUser = await prisma.user.findUnique({ where: { email: MEMBER_EMAIL } })
  if (!memberUser) {
    memberUser = await prisma.user.create({
      data: { email: MEMBER_EMAIL, name: 'E2E Member' },
    })
    console.log(`Created member user: ${memberUser.id}`)
  } else {
    console.log(`Found member user: ${memberUser.id}`)
  }

  const group = await prisma.familyGroup.upsert({
    where: { slug: GROUP_SLUG },
    update: {},
    create: { name: GROUP_NAME, slug: GROUP_SLUG },
  })
  console.log(`Group: ${group.name} (${group.id})`)

  await prisma.membership.upsert({
    where: {
      userId_familyGroupId: {
        userId: adminUser.id,
        familyGroupId: group.id,
      },
    },
    update: { role: 'ADMIN' },
    create: {
      userId: adminUser.id,
      familyGroupId: group.id,
      role: 'ADMIN',
    },
  })
  console.log(`Admin membership created`)

  await prisma.membership.upsert({
    where: {
      userId_familyGroupId: {
        userId: memberUser.id,
        familyGroupId: group.id,
      },
    },
    update: { role: 'MEMBER' },
    create: {
      userId: memberUser.id,
      familyGroupId: group.id,
      role: 'MEMBER',
    },
  })
  console.log(`Member membership created`)

  console.log(`\nDone! Group "${GROUP_NAME}" has admin (${ADMIN_EMAIL}) and member (${MEMBER_EMAIL})`)
}

seedE2EGroup()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
