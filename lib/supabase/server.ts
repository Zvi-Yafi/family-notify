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
          res.setHeader(
            'Set-Cookie',
            `${name}=${value}; Path=/; ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''} SameSite=Lax`
          )
        },
        remove(name: string, options: any) {
          res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0`)
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
