import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'

const API_URL = process.env.API_URL ?? 'http://localhost:3001'

export const load: PageServerLoad = async ({ params, cookies }) => {
  const session = cookies.get('session') ?? ''
  const cookie = `session=${session}`

  const [postRes, tagsRes] = await Promise.all([
    fetch(`${API_URL}/admin/posts/${params.id}`, {
      headers: { Cookie: cookie },
    }),
    fetch(`${API_URL}/admin/tags`, { headers: { Cookie: cookie } }),
  ])

  if (!postRes.ok) error(404, 'Post not found')

  const [post, allTags] = await Promise.all([
    postRes.json(),
    tagsRes.ok ? tagsRes.json() : Promise.resolve([]),
  ])

  return { post, allTags }
}
