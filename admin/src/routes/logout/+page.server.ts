import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:3001'

export const actions: Actions = {
  default: async ({ cookies }) => {
    const session = cookies.get('session')
    if (session) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Cookie: `session=${session}` },
      }).catch(() => {})
    }
    cookies.delete('session', { path: '/' })
    redirect(302, '/login')
  },
}
