import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getLimiter, getClientIp } from './lib/ratelimit'

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => response.headers.set(key, value))
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api')
  const isCronRoute = pathname.startsWith('/api/cron')

  if (isApiRoute && !isCronRoute) {
    const limiter = getLimiter(pathname)
    if (limiter) {
      try {
        const ip = getClientIp(request)
        const { success, limit, reset, remaining } = await limiter.limit(ip)
        if (!success) {
          return NextResponse.json(
            { error: 'Too Many Requests' },
            {
              status: 429,
              headers: {
                ...SECURITY_HEADERS,
                'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
                'X-RateLimit-Limit': String(limit),
                'X-RateLimit-Remaining': String(remaining),
                'X-RateLimit-Reset': String(reset),
              },
            }
          )
        }
      } catch {
        // fail open — allow request if Redis is temporarily unavailable
      }
    }
    return applySecurityHeaders(NextResponse.next({ request: { headers: request.headers } }))
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  applySecurityHeaders(response)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          applySecurityHeaders(response)
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          applySecurityHeaders(response)
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedRoutes: string[] = ['/feed', '/events', '/admin', '/groups', '/preferences']
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
