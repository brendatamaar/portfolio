import type { Cookies } from '@sveltejs/kit'

export const API_URL =
  process.env.API_INTERNAL_URL ?? 'http://localhost:3001/api'
export const SESSION_COOKIE = 'session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function serverFetch<T>(
  path: string,
  cookies: Cookies,
  init?: RequestInit,
): Promise<T> {
  const session = cookies.get(SESSION_COOKIE) ?? ''
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Cookie: `${SESSION_COOKIE}=${session}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}
