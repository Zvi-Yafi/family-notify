import { PrismaClient } from '@prisma/client'
import { createAdminClient } from '../lib/supabase/server'

const prisma = new PrismaClient()

async function updateUserEmail() {
  const oldEmail = 'taniyyy303@gmail.com'
  const newEmail = 'tamiyyy303@gmail.com'

  console.log(`🔄 Starting email update process...`)
  console.log(`   Old email: ${oldEmail}`)
  console.log(`   New email: ${newEmail}`)

  try {
    const user = await prisma.user.findUnique({
      where: { email: oldEmail },
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
      console.error(`❌ User with email ${oldEmail} not found in database`)
      return
    }

    console.log(`✅ Found user in database:`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Name: ${user.name || 'N/A'}`)
    console.log(`   Phone: ${user.phone || 'N/A'}`)
    console.log(`   Groups: ${user.memberships.length}`)

    const supabase = createAdminClient()

    console.log(`\n🔍 Looking for user in Supabase Auth...`)
    const { data: supabaseUsers, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing Supabase users:', listError)
      return
    }

    const supabaseUser = supabaseUsers.users.find(
      (u) => u.email === oldEmail || u.id === user.id
    )

    if (supabaseUser) {
      console.log(`✅ Found user in Supabase Auth:`)
      console.log(`   Auth ID: ${supabaseUser.id}`)
      console.log(`   Email: ${supabaseUser.email}`)

      console.log(`\n🔄 Updating email in Supabase Auth...`)
      const { data: updatedSupabaseUser, error: updateAuthError } =
        await supabase.auth.admin.updateUserById(supabaseUser.id, {
          email: newEmail,
          email_confirm: true,
        })

      if (updateAuthError) {
        console.error('❌ Error updating Supabase Auth:', updateAuthError)
        return
      }

      console.log(`✅ Email updated in Supabase Auth`)
    } else {
      console.log(`⚠️  User not found in Supabase Auth (might be phone-only user)`)
    }

    console.log(`\n🔄 Updating email in database...`)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail },
    })

    console.log(`✅ Email updated in database`)

    const emailPreference = user.preferences.find((p) => p.channel === 'EMAIL')
    if (emailPreference && emailPreference.destination === oldEmail) {
      console.log(`\n🔄 Updating email preference...`)
      await prisma.preference.update({
        where: { id: emailPreference.id },
        data: { destination: newEmail },
      })
      console.log(`✅ Email preference updated`)
    }

    console.log(`\n🎉 Email update completed successfully!`)
    console.log(`   User ID: ${updatedUser.id}`)
    console.log(`   Old email: ${oldEmail}`)
    console.log(`   New email: ${newEmail}`)

    if (user.memberships.length > 0) {
      console.log(`\n📋 User's groups:`)
      user.memberships.forEach((m) => {
        console.log(`   - ${m.familyGroup.name} (${m.role})`)
      })
    }
  } catch (error: any) {
    console.error('❌ Error updating email:', error)
    if (error.code === 'P2002') {
      console.error('   The new email already exists in the database!')
    }
  } finally {
    await prisma.$disconnect()
  }
}

updateUserEmail()
