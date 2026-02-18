const PREFIX = 'fliq_cache_'

interface CacheEntry<T> {
  value: T
  expires: number
}

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() > entry.expires) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return entry.value
  } catch {
    return null
  }
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ value, expires: Date.now() + ttlMs }))
  } catch {
    // localStorage full — silently skip caching
  }
}

export const TTL = {
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
}
