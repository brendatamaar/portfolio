import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { serverFetch } from '$lib/server/config'
import type { AdminPost } from '$lib/types'

export const load: PageServerLoad = async ({ params, cookies }) => {
  const post = await serverFetch<AdminPost>(
    `/admin/posts/${params.id}`,
    cookies,
  ).catch(() => null)
  if (!post) error(404, 'Post not found')
  return { post }
}
