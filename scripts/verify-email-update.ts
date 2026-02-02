import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyEmailUpdate() {
  const newEmail = 'tamar0527121761@gmail.com'

  try {
    console.log(`🔍 Verifying email update for: ${newEmail}\n`)

    const user = await prisma.user.findUnique({
      where: { email: newEmail },
      include: {
        memberships: {
          include: {
            familyGroup: true,
          },
        },
        preferences: true,
      },
    })

    if (!user) {
      console.error(`❌ User with email ${newEmail} not found!`)
      return
    }

    console.log(`✅ User found:`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name || 'N/A'}`)
    console.log(`   Phone: ${user.phone || 'N/A'}`)
    console.log(`   Created: ${user.createdAt.toISOString()}`)
    console.log(`   Updated: ${user.updatedAt.toISOString()}`)

    console.log(`\n📋 Groups (${user.memberships.length}):`)
    user.memberships.forEach((m) => {
      console.log(`   - ${m.familyGroup.name} (${m.role})`)
    })

    console.log(`\n📧 Preferences (${user.preferences.length}):`)
    user.preferences.forEach((p) => {
      const status = p.enabled ? '✅ Enabled' : '❌ Disabled'
      const verified = p.verifiedAt ? '✓ Verified' : '✗ Not verified'
      console.log(`   - ${p.channel}: ${status} | ${verified}`)
      if (p.destination) {
        console.log(`     Destination: ${p.destination}`)
      }
    })

    const oldEmail = 'tamar052712761@gmail.com'
    const oldUser = await prisma.user.findUnique({
      where: { email: oldEmail },
    })

    if (oldUser) {
      console.log(`\n⚠️  WARNING: Old email still exists in database!`)
      console.log(`   Old User ID: ${oldUser.id}`)
    } else {
      console.log(`\n✅ Old email (${oldEmail}) no longer exists in database`)
    }

    console.log(`\n🎉 Verification completed successfully!`)
  } catch (error) {
    console.error('❌ Error verifying email:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyEmailUpdate()
