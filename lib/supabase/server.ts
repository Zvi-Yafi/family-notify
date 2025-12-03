import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { NextApiRequest, NextApiResponse } from 'next'
import { Database } from './database.types'

// For Pages Router API routes
export function createServerClient(req: NextApiRequest, res: NextApiResponse) {
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name]
        },
        set(name: string, value: string, options: any) {
          // Build cookie string with proper attributes
          const cookieOptions = [
            `${name}=${value}`,
            'Path=/',
            options.maxAge ? `Max-Age=${options.maxAge}` : '',
            options.httpOnly ? 'HttpOnly' : '',
            options.secure ? 'Secure' : '',
            options.sameSite ? `SameSite=${options.sameSite}` : 'SameSite=Lax',
          ]
            .filter(Boolean)
            .join('; ')

          // Get existing Set-Cookie headers
          const existingCookies = res.getHeader('Set-Cookie') || []
          const cookiesArray = Array.isArray(existingCookies)
            ? existingCookies
            : [existingCookies as string]

          // Add new cookie
          res.setHeader('Set-Cookie', [...cookiesArray, cookieOptions])
        },
        remove(name: string, options: any) {
          const cookieString = `${name}=; Path=/; Max-Age=0; ${options.httpOnly ? 'HttpOnly;' : ''}`

          const existingCookies = res.getHeader('Set-Cookie') || []
          const cookiesArray = Array.isArray(existingCookies)
            ? existingCookies
            : [existingCookies as string]

          res.setHeader('Set-Cookie', [...cookiesArray, cookieString])
        },
      },
    }
  )
}

// For middleware and getServerSideProps
export function createServerClientFromCookies(cookies: { [key: string]: string }) {
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies[name]
        },
        set() {
          // Can't set cookies in this context
        },
        remove() {
          // Can't remove cookies in this context
        },
      },
    }
  )
}
