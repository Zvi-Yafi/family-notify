interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL: number

  constructor(defaultTTLSeconds: number = 30) {
    this.defaultTTL = defaultTTLSeconds * 1000

    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60000)
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTTL)
    this.cache.set(key, { value, expiresAt })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  invalidatePattern(pattern: string): number {
    let count = 0
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        count++
      }
    }
    return count
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

const cacheTTL = parseInt(process.env.STATS_CACHE_TTL_SECONDS || '30', 10)
export const cache = new SimpleCache(cacheTTL)

export function getCacheKey(...parts: (string | number | boolean | undefined)[]): string {
  return parts.filter((p) => p !== undefined).join(':')
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached !== null) {
    console.log(`[Cache HIT] ${key}`)
    return cached
  }

  console.log(`[Cache MISS] ${key}`)
  const value = await fetcher()
  cache.set(key, value, ttlMs)
  return value
}
