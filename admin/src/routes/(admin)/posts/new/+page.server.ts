import type { PageServerLoad } from './$types'

const API_URL =
  (process.env.API_INTERNAL_URL ?? 'http://localhost:3001') + '/api'

export const load: PageServerLoad = async ({ cookies }) => {
  const session = cookies.get('session') ?? ''
  const res = await fetch(`${API_URL}/admin/tags`, {
    headers: { Cookie: `session=${session}` },
  })
  const tags = res.ok ? await res.json() : []
  return { post: null, allTags: tags }
}
