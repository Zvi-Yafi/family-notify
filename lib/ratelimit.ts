import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'
import type { NextRequest } from 'next/server'

type RateLimiterSet = {
  global: Ratelimit
  auth: Ratelimit
  dispatch: Ratelimit
  write: Ratelimit
  superAdmin: Ratelimit
}

let cachedRateLimiters: RateLimiterSet | null | undefined

function getRateLimiters(): RateLimiterSet | null {
  if (cachedRateLimiters !== undefined) return cachedRateLimiters

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    cachedRateLimiters = null
    return cachedRateLimiters
  }

  try {
    const redis = new Redis({ url, token })
    cachedRateLimiters = {
      global: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1 m'), prefix: 'rl:global' }),
      auth: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), prefix: 'rl:auth' }),
      dispatch: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'rl:dispatch' }),
      write: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'), prefix: 'rl:write' }),
      superAdmin: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        prefix: 'rl:super-admin',
      }),
    }
  } catch {
    cachedRateLimiters = null
  }

  return cachedRateLimiters
}

export function getLimiter(pathname: string): Ratelimit | null {
  const rateLimiters = getRateLimiters()
  if (!rateLimiters) return null
  if (pathname.startsWith('/api/auth')) return rateLimiters.auth
  if (pathname.startsWith('/api/dispatch')) return rateLimiters.dispatch
  if (pathname.startsWith('/api/super-admin')) return rateLimiters.superAdmin
  if (
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/groups') ||
    pathname.startsWith('/api/user') ||
    pathname.startsWith('/api/invitations') ||
    pathname.startsWith('/api/preferences')
  ) {
    return rateLimiters.write
  }
  return rateLimiters.global
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'anonymous'
}
