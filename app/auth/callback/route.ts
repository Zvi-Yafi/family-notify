import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
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
            'Cookie': request.headers.get('cookie') || '',
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
  return NextResponse.redirect(`${origin}/feed`)
}

