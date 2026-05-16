import { redirect, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { API_URL, SESSION_COOKIE, SESSION_MAX_AGE } from '$lib/server/config'

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(302, '/')
}

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData()
    const username = data.get('username') as string
    const password = data.get('password') as string

    let res: Response
    try {
      res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
    } catch {
      return fail(500, { error: 'Cannot reach API server.' })
    }

    if (!res.ok) {
      return fail(401, { error: 'Invalid username or password.' })
    }

    // Forward session cookie set by API to the browser
    const setCookies = res.headers.getSetCookie?.() ?? []
    for (const raw of setCookies) {
      const match = raw.match(/session=([^;]+)/)
      if (match) {
        cookies.set(SESSION_COOKIE, match[1].trim(), {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: SESSION_MAX_AGE,
        })
        break
      }
    }

    redirect(302, '/')
  },
}
