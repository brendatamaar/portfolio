import type { PageServerLoad } from './$types'
import { serverFetch } from '$lib/server/config'
import type { AdminImage } from '$lib/types'

export const load: PageServerLoad = async ({ cookies }) => {
  try {
    const res = await serverFetch<{ data: AdminImage[] }>(
      '/admin/images',
      cookies,
    )
    return { images: res.data ?? [] }
  } catch {
    return { images: [] }
  }
}
