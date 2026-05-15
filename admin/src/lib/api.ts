import type {
  AdminPost,
  AdminPostSummary,
  AdminImage,
  PostPayload,
  PostTag,
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
}
