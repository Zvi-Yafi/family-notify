import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, redirectTo } = req.query
  const protocol =
    req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https')
  const origin = `${protocol}://${req.headers.host}`

  console.log('🔐 OAuth Callback:', { code: code ? 'present' : 'missing', origin })

  if (!code || typeof code !== 'string') {
    console.error('❌ No code in callback')
    return res.redirect('/login?error=No authorization code received')
  }

  const supabase = createServerClient(req, res)

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('❌ Error exchanging code for session:', error)
    return res.redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  console.log('✅ Session created for user:', data.user?.email)
  console.log('🍪 Session expires at:', data.session?.expires_at)

  // Log cookies being set
  const setCookieHeader = res.getHeader('Set-Cookie')
  console.log(
    '🍪 Setting cookies:',
    Array.isArray(setCookieHeader) ? setCookieHeader.length : 'single'
  )

  // Sync/Create user in Prisma database
  if (data.user) {
    try {
      console.log('📝 Creating/syncing user in database:', data.user.email)

      // First try to create/sync the user
      const createResponse = await fetch(`${origin}/api/auth/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
          phone: data.user.phone || null,
        }),
      })

      if (createResponse.ok) {
        const result = await createResponse.json()
        console.log('✅ User in database:', result.action)
      } else {
        console.error('❌ Failed to create user in database:', await createResponse.text())
      }

      // Then sync any additional data
      const syncResponse = await fetch(`${origin}/api/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: req.headers.cookie || '',
        },
      })

      if (!syncResponse.ok) {
        console.error('⚠️ Failed to sync user metadata')
      }
    } catch (syncError) {
      console.error('❌ Error syncing user:', syncError)
      // Don't fail the auth flow if sync fails
    }
  }

  // Determine destination
  let destination = (redirectTo as string) || '/feed'

  // If we just exchanged a code for recovery (password reset), Supabase might not explicitly tell us in the result
  // but if the redirectTo from forgot-password.tsx was /reset-password, we should honor it.

  console.log('🔄 Redirecting to:', destination)
  return res.redirect(destination)
}
