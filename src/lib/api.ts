import type { TocItem, Sidenote } from '../../shared/markdown/types.js'
import { logger } from './logger.js'
import type { Lang } from './i18n.js'

// Falls back to localhost in development; set VITE_API_URL in production.
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface PostTag {
  name: string
  slug: string
}

export interface PostSummary {
  id: number
  title: string
  slug: string
  description: string
  coverImageUrl: string | null
  /** Unix timestamp (seconds). Null if the post was never explicitly published. */
  publishedAt: number | null
  /** Unix timestamp (seconds) of row creation. */
  createdAt: number
  tags: PostTag[]
}

export interface PostDetail {
  post: PostSummary
  /** Server-rendered HTML from the markdown parser. */
  html: string
  toc: TocItem[]
  sidenotes: Sidenote[]
}

async function apiFetch<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`
  const start = performance.now()
  logger.debug('→', path)
  try {
    const res = await fetch(url)
    const ms = Math.round(performance.now() - start)
    if (!res.ok) {
      logger.error(`${res.status} ${path} (${ms}ms)`)
      throw new Error(`API error ${res.status}: ${path}`)
    }
    logger.debug(`← ${res.status} ${path} (${ms}ms)`)
    return res.json() as Promise<T>
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('API error')) throw err
    logger.error(`Network error: ${path}`, err)
    throw err
  }
}

export const api = {
  getPosts: (lang?: Lang) =>
    apiFetch<PostSummary[]>(
      lang && lang !== 'en' ? `/posts?lang=${lang}` : '/posts',
    ),
  getPost: (slug: string, lang?: Lang) =>
    apiFetch<PostDetail>(
      lang && lang !== 'en'
        ? `/posts/${slug}?lang=${lang}`
        : `/posts/${slug}`,
    ),
}
