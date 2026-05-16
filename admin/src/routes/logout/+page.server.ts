import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { serverFetch, SESSION_COOKIE } from '$lib/server/config'

export const actions: Actions = {
  default: async ({ cookies }) => {
    await serverFetch('/auth/logout', cookies, { method: 'POST' }).catch(
      () => {},
    )
    cookies.delete(SESSION_COOKIE, { path: '/' })
    redirect(302, '/login')
  },
}
