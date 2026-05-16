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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, init)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export const api = {
  getPosts: (lang = 'en') =>
    apiFetch<PostsResponse>(`/posts${lang !== 'en' ? `?lang=${lang}` : ''}`),
  getPost: (slug: string, lang = 'en') =>
    apiFetch<PostDetail>(
      `/posts/${slug}${lang !== 'en' ? `?lang=${lang}` : ''}`,
    ),
  getPostPreview: (id: string | number, lang = 'en') =>
    apiFetch<PostDetail>(
      `/admin/posts/${id}/preview${lang !== 'en' ? `?lang=${lang}` : ''}`,
      { credentials: 'include' },
    ),
  getResumeData: (locale: 'en' | 'id') =>
    apiFetch<ResumeData>(`/resume?locale=${locale}`),
}
