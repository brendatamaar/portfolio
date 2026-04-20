import type { BookItem, AlbumItem } from '@portfolio/shared/types/content.js'
import type { Lang } from '@portfolio/shared/types/common.js'
import type {
  Tag,
  Post,
  Image,
  BookSearchResult,
  AlbumSearchResult,
  ResumeProfile,
  ResumeWorkItem,
  ResumeEducationItem,
  ResumeSkillItem,
  ResumeProjectItem,
} from '../types/api.js'
export type {
  BookItem,
  AlbumItem,
  Lang,
  Tag,
  Post,
  Image,
  BookSearchResult,
  AlbumSearchResult,
  ResumeProfile,
  ResumeWorkItem,
  ResumeEducationItem,
  ResumeSkillItem,
  ResumeProjectItem,
}
export type ResumeLocale = Lang

const BASE = import.meta.env.VITE_API_URL
const REQUEST_TIMEOUT = 10_000

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  // Merge caller signal with timeout signal
  signal?.addEventListener('abort', () => controller.abort())

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(
        0,
        signal?.aborted ? 'Request aborted' : 'Request timed out',
      )
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  if (res.status === 401) {
    window.location.href = '/login'
    throw new ApiError(401, 'Unauthorized')
  }
  if (!res.ok) throw new ApiError(res.status, `API error ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  login: (username: string, password: string) =>
    req<{ ok: boolean }>('POST', '/auth/login', { username, password }),

  logout: () => req<{ ok: boolean }>('POST', '/auth/logout'),

  me: () => req<{ ok: boolean }>('GET', '/admin/me'),

  posts: {
    list: () => req<Post[]>('GET', '/admin/posts'),
    get: (id: number, signal?: AbortSignal) =>
      req<Post>('GET', `/admin/posts/${id}`, undefined, signal),
    create: (data: Partial<Post>) => req<Post>('POST', '/admin/posts', data),
    update: (id: number, data: Partial<Post>) =>
      req<Post>('PUT', `/admin/posts/${id}`, data),
    delete: (id: number) =>
      req<{ ok: boolean }>('DELETE', `/admin/posts/${id}`),
  },

  tags: {
    list: () => req<Tag[]>('GET', '/admin/tags'),
    create: (name: string) => req<Tag>('POST', '/admin/tags', { name }),
    delete: (id: number) => req<{ ok: boolean }>('DELETE', `/admin/tags/${id}`),
  },

  books: {
    list: () => req<BookItem[]>('GET', '/admin/books'),
    search: (q: string) =>
      req<BookSearchResult[]>(
        'GET',
        `/admin/books/search?q=${encodeURIComponent(q)}`,
      ),
    create: (d: {
      title: string
      author: string
      status: 'reading' | 'finished' | 'want'
      coverUrl?: string | null
      year?: number | null
    }) => req<BookItem>('POST', '/admin/books', d),
    delete: (id: number) =>
      req<{ ok: boolean }>('DELETE', `/admin/books/${id}`),
    feature: (id: number) =>
      req<BookItem>('PATCH', `/admin/books/${id}/feature`),
  },

  albums: {
    list: () => req<AlbumItem[]>('GET', '/admin/albums'),
    search: (q: string) =>
      req<AlbumSearchResult[]>(
        'GET',
        `/admin/albums/search?q=${encodeURIComponent(q)}`,
      ),
    create: (d: {
      title: string
      artist: string
      coverUrl?: string | null
      year?: number | null
    }) => req<AlbumItem>('POST', '/admin/albums', d),
    delete: (id: number) =>
      req<{ ok: boolean }>('DELETE', `/admin/albums/${id}`),
    feature: (id: number) =>
      req<AlbumItem>('PATCH', `/admin/albums/${id}/feature`),
  },

  resume: {
    getProfile: (locale: ResumeLocale) =>
      req<ResumeProfile>('GET', `/admin/resume/profile?locale=${locale}`),
    updateProfile: (locale: ResumeLocale, data: Partial<ResumeProfile>) =>
      req<ResumeProfile>(
        'PATCH',
        `/admin/resume/profile?locale=${locale}`,
        data,
      ),

    listWork: (locale: ResumeLocale) =>
      req<ResumeWorkItem[]>('GET', `/admin/resume/work?locale=${locale}`),
    createWork: (data: Omit<ResumeWorkItem, 'id'>) =>
      req<ResumeWorkItem>('POST', '/admin/resume/work', data),
    updateWork: (id: number, data: Partial<ResumeWorkItem>) =>
      req<ResumeWorkItem>('PATCH', `/admin/resume/work/${id}`, data),
    deleteWork: (id: number) =>
      req<{ ok: boolean }>('DELETE', `/admin/resume/work/${id}`),
    copyWork: (from: ResumeLocale, to: ResumeLocale) =>
      req<ResumeWorkItem[]>(
        'POST',
        `/admin/resume/work/copy?from=${from}&to=${to}`,
      ),

    listEducation: (locale: ResumeLocale) =>
      req<ResumeEducationItem[]>(
        'GET',
        `/admin/resume/education?locale=${locale}`,
      ),
    createEducation: (data: Omit<ResumeEducationItem, 'id'>) =>
      req<ResumeEducationItem>('POST', '/admin/resume/education', data),
    updateEducation: (id: number, data: Partial<ResumeEducationItem>) =>
      req<ResumeEducationItem>('PATCH', `/admin/resume/education/${id}`, data),
    deleteEducation: (id: number) =>
      req<{ ok: boolean }>('DELETE', `/admin/resume/education/${id}`),

    listSkills: () => req<ResumeSkillItem[]>('GET', '/admin/resume/skills'),
    createSkill: (name: string, sortOrder: number) =>
      req<ResumeSkillItem>('POST', '/admin/resume/skills', { name, sortOrder }),
    deleteSkill: (id: number) =>
      req<{ ok: boolean }>('DELETE', `/admin/resume/skills/${id}`),

    listProjects: (locale: ResumeLocale) =>
      req<ResumeProjectItem[]>(
        'GET',
        `/admin/resume/projects?locale=${locale}`,
      ),
    createProject: (data: Omit<ResumeProjectItem, 'id'>) =>
      req<ResumeProjectItem>('POST', '/admin/resume/projects', data),
    updateProject: (id: number, data: Partial<ResumeProjectItem>) =>
      req<ResumeProjectItem>('PATCH', `/admin/resume/projects/${id}`, data),
    deleteProject: (id: number) =>
      req<{ ok: boolean }>('DELETE', `/admin/resume/projects/${id}`),
    copyProjects: (from: ResumeLocale, to: ResumeLocale) =>
      req<ResumeProjectItem[]>(
        'POST',
        `/admin/resume/projects/copy?from=${from}&to=${to}`,
      ),
  },

  translate: (texts: string[], source: 'en' | 'id', target: 'en' | 'id') =>
    req<{ translatedTexts: string[] }>('POST', '/admin/translate', {
      texts,
      source,
      target,
    }),

  images: {
    list: () => req<Image[]>('GET', '/admin/images'),
    upload: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30_000) // longer for uploads
      let res: Response
      try {
        res = await fetch(`${BASE}/admin/upload`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
          signal: controller.signal,
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError')
          throw new ApiError(0, 'Upload timed out')
        throw err
      } finally {
        clearTimeout(timeout)
      }
      if (res.status === 401) {
        window.location.href = '/login'
        throw new ApiError(401, 'Unauthorized')
      }
      if (!res.ok) throw new ApiError(res.status, `Upload failed ${res.status}`)
      return res.json() as Promise<{
        id: number
        url: string
        filename: string
      }>
    },
    delete: (id: number) =>
      req<{ ok: boolean }>('DELETE', `/admin/images/${id}`),
  },
}
