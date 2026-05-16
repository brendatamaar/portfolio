import type { PageServerLoad } from './$types'
import { serverFetch } from '$lib/server/config'
import type { BookItem, AlbumItem } from '$lib/types'

export const load: PageServerLoad = async ({ cookies }) => {
  const [books, albums] = await Promise.allSettled([
    serverFetch<BookItem[]>('/admin/books', cookies),
    serverFetch<AlbumItem[]>('/admin/albums', cookies),
  ])
  return {
    books: books.status === 'fulfilled' ? books.value : [],
    albums: albums.status === 'fulfilled' ? albums.value : [],
  }
}
