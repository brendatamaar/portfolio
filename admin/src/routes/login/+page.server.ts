import { redirect, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const API_URL =
  (process.env.API_INTERNAL_URL ?? 'http://localhost:3001') + '/api'

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

    // Forward Set-Cookie from API to browser
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) {
      const match = setCookie.match(/session=([^;]+)/)
      if (match) {
        cookies.set('session', match[1], {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        })
      }
    }

    redirect(302, '/')
  },
}
