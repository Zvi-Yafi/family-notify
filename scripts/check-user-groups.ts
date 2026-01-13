import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'tzviyehuday@balink.net'
  console.log(`Checking data for user: ${email}`)

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          familyGroup: true,
        },
      },
    },
  })

  if (!user) {
    console.log('User not found in database.')
    return
  }

  console.log(`User found: ${user.id}`)
  console.log(`Memberships count: ${user.memberships.length}`)

  user.memberships.forEach((m) => {
    console.log(
      `- Group: ${m.familyGroup.name} (ID: ${m.familyGroup.id}, Slug: ${m.familyGroup.slug}, Role: ${m.role})`
    )
  })

  // Also check if there are any "global" or "public" announcements or if the API has a bug
  // Let's check the announcements in the database generally if they are linked to groups
  const groupIds = user.memberships.map((m) => m.familyGroupId)
  console.log(`User's Group IDs: ${groupIds.join(', ')}`)
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
