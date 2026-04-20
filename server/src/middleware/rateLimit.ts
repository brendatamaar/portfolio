import type { Context, Next } from 'hono'
import type { RateLimitEntry } from '../types/rate-limit.js'

export function createRateLimit(opts: { windowMs: number; max: number }) {
  const store = new Map<string, RateLimitEntry>()

  return async function rateLimitMiddleware(c: Context, next: Next) {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
      c.req.header('x-real-ip') ??
      'unknown'

    const now = Date.now()
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
