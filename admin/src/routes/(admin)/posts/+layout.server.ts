import type { LayoutServerLoad } from './$types'
import { serverFetch } from '$lib/server/config'
import type { PostTag } from '$lib/types'

export const load: LayoutServerLoad = async ({ cookies }) => {
  const allTags = await serverFetch<PostTag[]>('/admin/tags', cookies).catch(
    () => [] as PostTag[],
  )
  return { allTags }
}
