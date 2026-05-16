import type {
  AdminPost,
  AdminPostSummary,
  AdminImage,
  PostPayload,
  PostTag,
  BookItem,
  AlbumItem,
  BookSearchResult,
  AlbumSearchResult,
  ResumeProfile,
  ResumeWorkItem,
  ResumeEducationItem,
  ResumeSkillItem,
  ResumeProjectItem,
  Lang,
  WorkDraft,
  EduDraft,
  ProjectDraft,
} from './types'

const API_URL =
  (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    apiFetch<{ ok: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  // Posts
  getPosts: () =>
    apiFetch<{ data: AdminPostSummary[]; total: number }>('/admin/posts'),

  getPost: (id: number) => apiFetch<AdminPost>(`/admin/posts/${id}`),

  createPost: (payload: PostPayload) =>
    apiFetch<AdminPost>('/admin/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePost: (id: number, payload: Partial<PostPayload>) =>
    apiFetch<AdminPost>(`/admin/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deletePost: (id: number) =>
    apiFetch<{ ok: boolean }>(`/admin/posts/${id}`, { method: 'DELETE' }),

  // Tags
  getTags: () => apiFetch<PostTag[]>('/admin/tags'),

  createTag: (name: string) =>
    apiFetch<PostTag>('/admin/tags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  // Images
  getImages: () => apiFetch<{ data: AdminImage[] }>('/admin/images'),

  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${API_URL}/admin/upload`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    }).then((r) => {
      if (!r.ok) throw new Error(`Upload failed: ${r.status}`)
      return r.json() as Promise<AdminImage>
    })
  },

  deleteImage: (id: number) =>
    apiFetch<{ ok: boolean }>(`/admin/images/${id}`, { method: 'DELETE' }),

  // Books
  getBooks: () => apiFetch<BookItem[]>('/admin/books'),
  searchBooks: (q: string) =>
    apiFetch<BookSearchResult[]>(
      `/admin/books/search?q=${encodeURIComponent(q)}`,
    ),
  createBook: (d: {
    title: string
    author: string
    status: 'reading' | 'finished' | 'want'
    coverUrl?: string | null
    year?: number | null
  }) =>
    apiFetch<BookItem>('/admin/books', {
      method: 'POST',
      body: JSON.stringify(d),
    }),
  deleteBook: (id: number) =>
    apiFetch<{ ok: boolean }>(`/admin/books/${id}`, { method: 'DELETE' }),
  featureBook: (id: number) =>
    apiFetch<BookItem>(`/admin/books/${id}/feature`, { method: 'PATCH' }),

  // Albums
  getAlbums: () => apiFetch<AlbumItem[]>('/admin/albums'),
  searchAlbums: (q: string) =>
    apiFetch<AlbumSearchResult[]>(
      `/admin/albums/search?q=${encodeURIComponent(q)}`,
    ),
  createAlbum: (d: {
    title: string
    artist: string
    coverUrl?: string | null
    year?: number | null
  }) =>
    apiFetch<AlbumItem>('/admin/albums', {
      method: 'POST',
      body: JSON.stringify(d),
    }),
  deleteAlbum: (id: number) =>
    apiFetch<{ ok: boolean }>(`/admin/albums/${id}`, { method: 'DELETE' }),
  featureAlbum: (id: number) =>
    apiFetch<AlbumItem>(`/admin/albums/${id}/feature`, { method: 'PATCH' }),

  // Resume
  getResumeProfile: (locale: Lang) =>
    apiFetch<ResumeProfile>(`/admin/resume/profile?locale=${locale}`),
  updateResumeProfile: (locale: Lang, data: Partial<ResumeProfile>) =>
    apiFetch<ResumeProfile>(`/admin/resume/profile?locale=${locale}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  listResumeWork: (locale: Lang) =>
    apiFetch<ResumeWorkItem[]>(`/admin/resume/work?locale=${locale}`),
  createResumeWork: (data: Omit<WorkDraft, 'locale'> & { locale: Lang }) =>
    apiFetch<ResumeWorkItem>('/admin/resume/work', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateResumeWork: (id: number, data: Partial<WorkDraft>) =>
    apiFetch<ResumeWorkItem>(`/admin/resume/work/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteResumeWork: (id: number) =>
    apiFetch<{ ok: boolean }>(`/admin/resume/work/${id}`, { method: 'DELETE' }),
  copyResumeWork: (from: Lang, to: Lang) =>
    apiFetch<ResumeWorkItem[]>(
      `/admin/resume/work/copy?from=${from}&to=${to}`,
      { method: 'POST' },
    ),

  listResumeEducation: (locale: Lang) =>
    apiFetch<ResumeEducationItem[]>(`/admin/resume/education?locale=${locale}`),
  createResumeEducation: (data: Omit<EduDraft, 'locale'> & { locale: Lang }) =>
    apiFetch<ResumeEducationItem>('/admin/resume/education', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateResumeEducation: (id: number, data: Partial<EduDraft>) =>
    apiFetch<ResumeEducationItem>(`/admin/resume/education/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteResumeEducation: (id: number) =>
    apiFetch<{ ok: boolean }>(`/admin/resume/education/${id}`, {
      method: 'DELETE',
    }),
  copyResumeEducation: (from: Lang, to: Lang) =>
    apiFetch<ResumeEducationItem[]>(
      `/admin/resume/education/copy?from=${from}&to=${to}`,
      { method: 'POST' },
    ),

  listResumeSkills: () => apiFetch<ResumeSkillItem[]>('/admin/resume/skills'),
  createResumeSkill: (name: string, sortOrder: number) =>
    apiFetch<ResumeSkillItem>('/admin/resume/skills', {
      method: 'POST',
      body: JSON.stringify({ name, sortOrder }),
    }),
  deleteResumeSkill: (id: number) =>
    apiFetch<{ ok: boolean }>(`/admin/resume/skills/${id}`, {
      method: 'DELETE',
    }),

  listResumeProjects: (locale: Lang) =>
    apiFetch<ResumeProjectItem[]>(`/admin/resume/projects?locale=${locale}`),
  createResumeProject: (
    data: Omit<ProjectDraft, 'locale'> & { locale: Lang },
  ) =>
    apiFetch<ResumeProjectItem>('/admin/resume/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateResumeProject: (id: number, data: Partial<ProjectDraft>) =>
    apiFetch<ResumeProjectItem>(`/admin/resume/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteResumeProject: (id: number) =>
    apiFetch<{ ok: boolean }>(`/admin/resume/projects/${id}`, {
      method: 'DELETE',
    }),
  copyResumeProjects: (from: Lang, to: Lang) =>
    apiFetch<ResumeProjectItem[]>(
      `/admin/resume/projects/copy?from=${from}&to=${to}`,
      { method: 'POST' },
    ),
}
