import type { Context, Next } from 'hono'
import type { RateLimitEntry } from '../types/rate-limit.js'

// Past this many tracked addresses, expired windows are swept on the next request
const MAX_TRACKED = 1000

export function createRateLimit(opts: { windowMs: number; max: number }) {
  const store = new Map<string, RateLimitEntry>()

  return async function rateLimitMiddleware(c: Context, next: Next) {
    // Behind Cloudflare Tunnel the origin is unreachable directly, so CF's header is trustworthy
    const ip =
      c.req.header('cf-connecting-ip') ??
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
      c.req.header('x-real-ip') ??
      'unknown'

    const now = Date.now()
    if (store.size > MAX_TRACKED) {
      for (const [key, e] of store) if (e.resetAt < now) store.delete(key)
    }
    const entry = store.get(ip)

    if (!entry || entry.resetAt < now) {
      store.set(ip, { count: 1, resetAt: now + opts.windowMs })
    } else {
      entry.count++
      if (entry.count > opts.max) {
        c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
        return c.json({ error: 'Too many requests' }, 429)
      }
    }

    return next()
  }
}
