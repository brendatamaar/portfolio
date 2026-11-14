import { api } from '../../lib/api'
import type { PostSummary } from '../../lib/types'
import type { Lang } from './content'

export interface Post {
  title: string
  slug: string
  /** ISO date */
  date: string
}

/** Newest first (the API already sorts by publish date). Empty when the API is down. */
export async function loadPosts(lang: Lang, limit = 8): Promise<Post[]> {
  try {
    const { data } = await api.getPosts(lang, limit)
    return data.map((p: PostSummary) => ({
      title: p.title,
      slug: p.slug,
      date: p.publishedAt ?? p.createdAt,
    }))
  } catch {
    return []
  }
}

/** "Oct 2026" / "Okt 2026". UTC so the month doesn't depend on the server's zone. */
export function monthYear(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso))
}

/** "Nov 14, 2026" / "14 Nov 2026" for a post header. */
export function fullDate(iso: string, lang: Lang = 'en'): string {
  return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso))
}
