import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function searchUser() {
  const searchTerm = 'tani'

  try {
    console.log(`🔍 Searching for users with email containing: ${searchTerm}\n`)

    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      include: {
        memberships: {
          include: {
            familyGroup: true,
          },
        },
      },
    })

    if (users.length === 0) {
      console.log(`❌ No users found with email containing "${searchTerm}"`)
      
      console.log(`\n🔍 Searching in all users with similar patterns...`)
      const allUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: 'tami', mode: 'insensitive' } },
            { email: { contains: 'tany', mode: 'insensitive' } },
            { email: { contains: '303', mode: 'insensitive' } },
          ],
        },
        include: {
          memberships: {
            include: {
              familyGroup: true,
            },
          },
        },
      })
      
      if (allUsers.length > 0) {
        console.log(`\n✅ Found ${allUsers.length} similar users:`)
        allUsers.forEach((user) => {
          console.log(`\n   Email: ${user.email}`)
          console.log(`   Name: ${user.name || 'N/A'}`)
          console.log(`   User ID: ${user.id}`)
          console.log(`   Groups: ${user.memberships.map((m) => m.familyGroup.name).join(', ')}`)
        })
      } else {
        console.log(`❌ No similar users found`)
      }
      
      return
    }

    console.log(`✅ Found ${users.length} user(s):\n`)

    users.forEach((user) => {
      console.log(`📧 Email: ${user.email}`)
      console.log(`   Name: ${user.name || 'N/A'}`)
      console.log(`   User ID: ${user.id}`)
      console.log(`   Groups: ${user.memberships.map((m) => m.familyGroup.name).join(', ')}`)
      console.log('')
    })
  } catch (error) {
    console.error('❌ Error searching user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

searchUser()
