import type { PageServerLoad } from './$types'

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:3001/api'

export const load: PageServerLoad = async ({ cookies }) => {
  const session = cookies.get('session') ?? ''
  const res = await fetch(`${API_URL}/admin/images`, {
    headers: { Cookie: `session=${session}` },
  })
  const images = res.ok ? await res.json() : []
  return { images }
}
