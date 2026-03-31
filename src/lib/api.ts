import type { TocItem, Sidenote } from '../../shared/markdown/types.js'

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
  publishedAt: number | null
  createdAt: number
  tags: PostTag[]
}

export interface PostDetail {
  post: PostSummary
  html: string
  toc: TocItem[]
  sidenotes: Sidenote[]
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export const api = {
  getPosts: () => apiFetch<PostSummary[]>('/api/posts'),
  getPost: (slug: string) => apiFetch<PostDetail>(`/api/posts/${slug}`),
}
