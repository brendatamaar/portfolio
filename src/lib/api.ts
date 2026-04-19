import type {
  TocItem,
  Sidenote,
  BibliographyEntry,
} from '../../shared/markdown/types.js'
import { logger } from './logger.js'
import type { Lang } from './i18n.js'

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
  /** ISO date string. Null if the post was never explicitly published. */
  publishedAt: string | null
  /** ISO date string of row creation. */
  createdAt: string
  tags: PostTag[]
}

export interface PostsResponse {
  data: PostSummary[]
  total: number
  page: number
  limit: number
}

export interface PostDetail {
  post: PostSummary
  /** Server-rendered HTML from the markdown parser. */
  html: string
  toc: TocItem[]
  sidenotes: Sidenote[]
  bibliography: BibliographyEntry[]
}

export interface BookItem {
  id: number
  title: string
  author: string
  status: 'reading' | 'finished' | 'want'
  year: number | null
  coverUrl: string | null
  featured: boolean
  createdAt: string
}

export interface AlbumItem {
  id: number
  title: string
  artist: string
  year: number | null
  coverUrl: string | null
  featured: boolean
  createdAt: string
}

export interface ResumeProfile {
  name: string
  initials: string
  location: string
  locationLink: string
  currentJob: string
  description: string
  about: string
  summary: string
  avatarUrl: string
  personalWebsiteUrl: string
  email: string
  tel: string
  social: { name: string; url: string }[]
}

export interface ResumeWorkItem {
  id: number
  company: string
  link: string
  badge: string
  title: string
  start: string
  end: string
  description: string
}

export interface ResumeEducationItem {
  id: number
  school: string
  degree: string
  start: string
  end: string
  desc: string
}

export interface ResumeProjectItem {
  id: number
  title: string
  type: 'side_project' | 'work'
  company?: string
  techStack: string[]
  description: string
  link?: { label: string; href: string }
  img: string
  isFeatured: boolean
}

export interface ResumeData {
  profile: ResumeProfile | null
  work: ResumeWorkItem[]
  education: ResumeEducationItem[]
  skills: string[]
  projects: ResumeProjectItem[]
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
    apiFetch<PostsResponse>(
      lang && lang !== 'en' ? `/posts?lang=${lang}` : '/posts',
      signal,
    ),
  getPost: (slug: string, lang?: Lang, signal?: AbortSignal) =>
    apiFetch<PostDetail>(
      lang && lang !== 'en' ? `/posts/${slug}?lang=${lang}` : `/posts/${slug}`,
      signal,
    ),
  getBooks: () => apiFetch<BookItem[]>('/books'),
  getAlbums: () => apiFetch<AlbumItem[]>('/albums'),
  getFeaturedBook: () =>
    apiFetch<BookItem[]>('/books?featured=true').then((a) => a[0] ?? null),
  getFeaturedAlbum: () =>
    apiFetch<AlbumItem[]>('/albums?featured=true').then((a) => a[0] ?? null),
  getResumeData: (locale: 'en' | 'id') =>
    apiFetch<ResumeData>(`/resume?locale=${locale}`),
}
