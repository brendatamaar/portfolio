import type { Handle } from '@sveltejs/kit'

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:3001/api'
const PUBLIC = ['/login']

export const handle: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get('session')

  if (session) {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Cookie: `session=${session}` },
      })
      event.locals.user = res.ok ? { username: 'admin' } : null
    } catch (e) {
      console.error('Session check error:', e)
      event.locals.user = null
    }
  } else {
    event.locals.user = null
  }

  const path = event.url.pathname
  if (!event.locals.user && !PUBLIC.some((p) => path.startsWith(p))) {
    return new Response(null, { status: 302, headers: { Location: '/login' } })
  }

  return resolve(event)
}
