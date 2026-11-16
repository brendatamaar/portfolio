import type { PageServerLoad } from './$types'
import { serverFetch } from '$lib/server/config'
import type { AdminImage } from '$lib/types'

export const load: PageServerLoad = async ({ cookies }) => {
  try {
    const res = await serverFetch<AdminImage[] | { data: AdminImage[] }>(
      '/admin/images',
      cookies,
    )
    return { images: Array.isArray(res) ? res : (res?.data ?? []) }
  } catch {
    return { images: [] }
  }
}
