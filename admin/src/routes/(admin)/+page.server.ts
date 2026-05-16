import type { PageServerLoad, Actions } from './$types'
import { fail } from '@sveltejs/kit'
import { serverFetch } from '$lib/server/config'

export const load: PageServerLoad = async ({ cookies }) => {
  try {
    const posts = await serverFetch<import('$lib/types').AdminPostSummary[]>(
      '/admin/posts',
      cookies,
    )
    return { posts: posts ?? [] }
  } catch {
    return { posts: [] }
  }
}

export const actions: Actions = {
  delete: async ({ request, cookies }) => {
    const data = await request.formData()
    const id = Number(data.get('id'))
    if (!Number.isInteger(id) || id <= 0)
      return fail(400, { error: 'Missing id' })
    try {
      await serverFetch(`/admin/posts/${id}`, cookies, { method: 'DELETE' })
    } catch {
      return fail(500, { error: 'Delete failed' })
    }
  },
}
