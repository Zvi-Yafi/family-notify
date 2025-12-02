import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code } = req.query
  const origin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`

  if (code && typeof code === 'string') {
    const supabase = createServerClient(req, res)

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return res.redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    // Sync/Create user in Prisma database
    if (data.user) {
      try {
        // First try to create/sync the user
        const createResponse = await fetch(`${origin}/api/auth/create-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            email: data.user.email,
            phone: data.user.phone || null,
          }),
        })

        if (!createResponse.ok) {
          console.error('Failed to create user in database')
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
          console.error('Failed to sync user to database')
        }
      } catch (syncError) {
        console.error('Error syncing user:', syncError)
        // Don't fail the auth flow if sync fails
      }
    }
  }

  // Redirect to feed page after successful authentication
  return res.redirect('/feed')
}
