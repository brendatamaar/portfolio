const BASE = import.meta.env.VITE_API_URL

function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (res.status === 401) {
    localStorage.removeItem('admin_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<T>
}

export interface Tag {
  id: number
  name: string
  slug: string
}
export interface Post {
  id: number
  title: string
  slug: string
  description: string
  content: string
  titleId: string
  descriptionId: string
  contentId: string
  status: 'draft' | 'published'
  coverImageUrl: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  tags: Tag[]
}
export interface Image {
  id: number
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  url: string
  createdAt: string
}

export const api = {
  login: (username: string, password: string) =>
    req<{ token: string }>('POST', '/auth/login', { username, password }),

  posts: {
    list: () => req<Post[]>('GET', '/admin/posts'),
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
      const res = await fetch(`${BASE}/admin/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      })
      if (!res.ok) throw new Error(`Upload failed ${res.status}`)
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
