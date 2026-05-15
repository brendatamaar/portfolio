import type { PageServerLoad, Actions } from './$types'
import { fail } from '@sveltejs/kit'

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:3001/api'

async function serverFetch<T>(
  path: string,
  cookie: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<T>
}

export const load: PageServerLoad = async ({ cookies }) => {
  const session = cookies.get('session') ?? ''
  const cookie = `session=${session}`

  try {
    const [postsData, tags] = await Promise.all([
      serverFetch<{ data: import('$lib/types').AdminPostSummary[] }>(
        '/admin/posts',
        cookie,
      ),
      serverFetch<import('$lib/types').PostTag[]>('/admin/tags', cookie),
    ])
    return { posts: postsData.data ?? [], tags: tags ?? [] }
  } catch {
    return { posts: [], tags: [] }
  }
}

export const actions: Actions = {
  delete: async ({ request, cookies }) => {
    const session = cookies.get('session') ?? ''
    const data = await request.formData()
    const id = Number(data.get('id'))
    if (!id) return fail(400, { error: 'Missing id' })
    try {
      await serverFetch(`/admin/posts/${id}`, `session=${session}`, {
        method: 'DELETE',
      })
    } catch {
      return fail(500, { error: 'Delete failed' })
    }
  },
}
