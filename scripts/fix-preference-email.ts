import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPreferenceEmail() {
  const oldEmail = 'taniyyy303@gmail.com'
  const newEmail = 'tamiyyy303@gmail.com'

  console.log(`🔄 Fixing email preference...`)
  console.log(`   Old: ${oldEmail}`)
  console.log(`   New: ${newEmail}\n`)

  try {
    const prefsWithOldEmail = await prisma.preference.findMany({
      where: {
        destination: oldEmail,
      },
      include: {
        user: true,
      },
    })

    if (prefsWithOldEmail.length === 0) {
      console.log(`✅ No preferences found with old email - already fixed!`)
      return
    }

    console.log(`Found ${prefsWithOldEmail.length} preference(s) to update:\n`)

    for (const pref of prefsWithOldEmail) {
      console.log(`📧 Updating preference for: ${pref.user.name}`)
      console.log(`   User ID: ${pref.user.id}`)
      console.log(`   Channel: ${pref.channel}`)
      console.log(`   Old destination: ${pref.destination}`)

      const updated = await prisma.preference.update({
        where: { id: pref.id },
        data: { destination: newEmail },
      })

      console.log(`   New destination: ${updated.destination}`)
      console.log(`   ✅ Updated successfully!\n`)
    }

    console.log(`🎉 All preferences updated!`)

    const verification = await prisma.user.findUnique({
      where: { email: newEmail },
      include: {
        preferences: true,
      },
    })

    if (verification) {
      console.log(`\n✅ Verification - User ${verification.name}:`)
      console.log(`   Email: ${verification.email}`)
      console.log(`   Preferences:`)
      verification.preferences.forEach((p) => {
        console.log(`     - ${p.channel}: ${p.destination} (${p.enabled ? 'Enabled' : 'Disabled'})`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPreferenceEmail()
