import { logger } from './logger.js'
import type { Lang } from './i18n.js'
import type { BookItem, AlbumItem } from '@portfolio/shared/types/content.js'
import type {
  PostTag,
  PostSummary,
  PostsResponse,
  PostDetail,
  ResumeProfile,
  ResumeWorkItem,
  ResumeEducationItem,
  ResumeProjectItem,
  ResumeData,
} from '../types/api.js'
export type {
  BookItem,
  AlbumItem,
  PostTag,
  PostSummary,
  PostsResponse,
  PostDetail,
  ResumeProfile,
  ResumeWorkItem,
  ResumeEducationItem,
  ResumeProjectItem,
  ResumeData,
}

// Server-side SSR uses VITE_API_INTERNAL_URL (e.g. http://localhost:3001) to avoid
// going through the public domain. Client-side uses VITE_API_URL (public URL).
function resolveBase(): string {
  if (typeof window === 'undefined') {
    const url = import.meta.env.VITE_API_INTERNAL_URL
    if (!url && import.meta.env.PROD)
      throw new Error('VITE_API_INTERNAL_URL is required in production')
    return url ?? 'http://localhost:3001'
  }
  const url = import.meta.env.VITE_API_URL
  if (!url && import.meta.env.PROD)
    throw new Error('VITE_API_URL is required in production')
  return url ?? 'http://localhost:3001'
}

const BASE = resolveBase()

function path(base: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v && v !== 'en') as [
      string,
      string,
    ][],
  )
  const qs = search.toString()
  return qs ? `${base}?${qs}` : base
}

async function apiFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${BASE}${path}`
  const start = performance.now()
  logger.debug('→', path)
  try {
    const res = await fetch(url, { signal })
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
  getPosts: (lang?: Lang, signal?: AbortSignal) =>
    apiFetch<PostsResponse>(path('/posts', { lang }), signal),
  getPost: (slug: string, lang?: Lang, signal?: AbortSignal) =>
    apiFetch<PostDetail>(path(`/posts/${slug}`, { lang }), signal),
  getBooks: () => apiFetch<BookItem[]>('/books'),
  getAlbums: () => apiFetch<AlbumItem[]>('/albums'),
  getFeaturedBook: () =>
    apiFetch<BookItem[]>('/books?featured=true').then((a) => a[0] ?? null),
  getFeaturedAlbum: () =>
    apiFetch<AlbumItem[]>('/albums?featured=true').then((a) => a[0] ?? null),
  getResumeData: (locale: 'en' | 'id') =>
    apiFetch<ResumeData>(`/resume?locale=${locale}`),
}
