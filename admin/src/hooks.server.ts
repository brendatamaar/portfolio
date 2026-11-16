import type { Handle } from '@sveltejs/kit'
import { API_URL } from '$lib/server/config'

const PUBLIC = ['/login']
// Static assets never need a session round-trip to the API.
const STATIC_PREFIXES = ['/_app/', '/images/', '/favicon.ico']
// Short-lived positive-auth cache: avoids one API fetch per request/asset.
// Only successful checks are cached; failures always re-check immediately.
const AUTH_TTL_MS = 30_000
const authCache = new Map<string, number>()

async function isAuthenticated(session: string): Promise<boolean> {
  const cachedUntil = authCache.get(session)
  if (cachedUntil && cachedUntil > Date.now()) return true
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Cookie: `session=${session}` },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return false
    authCache.set(session, Date.now() + AUTH_TTL_MS)
    // Bound growth: drop expired entries opportunistically.
    if (authCache.size > 50) {
      const now = Date.now()
      for (const [k, v] of authCache) if (v <= now) authCache.delete(k)
    }
    return true
  } catch {
    return false
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname
  if (STATIC_PREFIXES.some((p) => path.startsWith(p))) return resolve(event)

  const session = event.cookies.get('session')
  event.locals.user =
    session && (await isAuthenticated(session)) ? { username: 'admin' } : null

  if (!event.locals.user && !PUBLIC.some((p) => path.startsWith(p))) {
    return new Response(null, { status: 302, headers: { Location: '/login' } })
  }
  return resolve(event)
}
