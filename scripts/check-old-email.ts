import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkOldEmail() {
  const oldEmail = 'taniyyy303@gmail.com'
  const newEmail = 'tamiyyy303@gmail.com'

  console.log(`🔍 Checking for old email: ${oldEmail}\n`)

  try {
    const userWithOldEmail = await prisma.user.findUnique({
      where: { email: oldEmail },
      include: {
        preferences: true,
        memberships: {
          include: {
            familyGroup: true,
          },
        },
      },
    })

    if (userWithOldEmail) {
      console.log(`❌ Found user with OLD email in users table:`)
      console.log(`   User ID: ${userWithOldEmail.id}`)
      console.log(`   Email: ${userWithOldEmail.email}`)
      console.log(`   Name: ${userWithOldEmail.name}`)
      console.log(`   Preferences:`)
      userWithOldEmail.preferences.forEach((p) => {
        console.log(`     - ${p.channel}: ${p.destination} (${p.enabled ? 'Enabled' : 'Disabled'})`)
      })
    } else {
      console.log(`✅ No user found with old email in users table`)
    }

    const userWithNewEmail = await prisma.user.findUnique({
      where: { email: newEmail },
      include: {
        preferences: true,
        memberships: {
          include: {
            familyGroup: true,
          },
        },
      },
    })

    if (userWithNewEmail) {
      console.log(`\n✅ Found user with NEW email:`)
      console.log(`   User ID: ${userWithNewEmail.id}`)
      console.log(`   Email: ${userWithNewEmail.email}`)
      console.log(`   Name: ${userWithNewEmail.name}`)
      console.log(`   Preferences:`)
      userWithNewEmail.preferences.forEach((p) => {
        console.log(`     - ${p.channel}: ${p.destination} (${p.enabled ? 'Enabled' : 'Disabled'})`)
      })
    }

    console.log(`\n🔍 Checking preferences with old email destination...`)
    const prefsWithOldEmail = await prisma.preference.findMany({
      where: {
        destination: oldEmail,
      },
      include: {
        user: true,
      },
    })

    if (prefsWithOldEmail.length > 0) {
      console.log(`❌ Found ${prefsWithOldEmail.length} preferences with old email:`)
      prefsWithOldEmail.forEach((p) => {
        console.log(`   - User: ${p.user.name} (${p.user.id})`)
        console.log(`     Channel: ${p.channel}`)
        console.log(`     Destination: ${p.destination}`)
        console.log(`     Enabled: ${p.enabled}`)
      })
    } else {
      console.log(`✅ No preferences found with old email destination`)
    }

    console.log(`\n🔍 Checking group invitations with old email...`)
    const invitationsWithOldEmail = await prisma.groupInvitation.findMany({
      where: {
        email: oldEmail,
      },
      include: {
        familyGroup: true,
      },
    })

    if (invitationsWithOldEmail.length > 0) {
      console.log(`❌ Found ${invitationsWithOldEmail.length} invitations with old email:`)
      invitationsWithOldEmail.forEach((inv) => {
        console.log(`   - Group: ${inv.familyGroup.name}`)
        console.log(`     Status: ${inv.status}`)
        console.log(`     Created: ${inv.createdAt}`)
      })
    } else {
      console.log(`✅ No invitations found with old email`)
    }

    console.log(`\n🔍 Checking all users in Yafi group...`)
    const yafiMembers = await prisma.membership.findMany({
      where: {
        familyGroup: {
          slug: 'yafi',
        },
      },
      include: {
        user: {
          include: {
            preferences: true,
          },
        },
        familyGroup: true,
      },
    })

    console.log(`\n📋 All Yafi members (${yafiMembers.length}):`)
    yafiMembers.forEach((m) => {
      const emailPref = m.user.preferences.find((p) => p.channel === 'EMAIL')
      console.log(`   - ${m.user.name || 'N/A'}`)
      console.log(`     User email: ${m.user.email || 'N/A'}`)
      if (emailPref) {
        console.log(`     Email pref: ${emailPref.destination || 'N/A'} (${emailPref.enabled ? 'Enabled' : 'Disabled'})`)
      }
      console.log('')
    })
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOldEmail()
