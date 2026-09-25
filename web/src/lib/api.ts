import type { PostsResponse, PostDetail, ResumeData } from './types'
export type {
  PostSummary,
  PostTag,
  PostDetail,
  ResumeData,
  ResumeProfile,
  ResumeWorkItem,
  ResumeProjectItem,
} from './types'

// SSR must not hang on a stalled API — pages fall back to empty/redirect states
const TIMEOUT_MS = 5000

function baseUrl(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.API_INTERNAL_URL ??
      import.meta.env.PUBLIC_API_URL ??
      'http://localhost:3001'
    )
  }
  return import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3001'
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

const langQuery = (lang: string) => (lang !== 'en' ? `?lang=${lang}` : '')

export const api = {
  getPosts: (lang = 'en', limit?: number) => {
    const params = new URLSearchParams()
    if (lang !== 'en') params.set('lang', lang)
    if (limit) params.set('limit', String(limit))
    const qs = params.toString()
    return apiFetch<PostsResponse>(`/posts${qs ? `?${qs}` : ''}`)
  },
  getPost: (slug: string, lang = 'en') =>
    apiFetch<PostDetail>(
      `/posts/${encodeURIComponent(slug)}${langQuery(lang)}`,
    ),
  getResumeData: (locale: 'en' | 'id') =>
    apiFetch<ResumeData>(`/resume?locale=${locale}`),
}
