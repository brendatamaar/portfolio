import type { APIRoute } from 'astro'

// Uploaded images live on the API server (`/uploads/*` at its root). Proxy them so
// the relative `/uploads/...` URLs stored by the admin also resolve on this origin.
const API_ORIGIN = (
  process.env.API_INTERNAL_URL ??
  import.meta.env.PUBLIC_API_URL ??
  'http://localhost:3001/api'
).replace(/\/api\/?$/, '')

export const GET: APIRoute = async ({ params }) => {
  const path = params.path ?? ''
  if (!path || path.split('/').includes('..')) {
    return new Response(null, { status: 404 })
  }

  try {
    const res = await fetch(`${API_ORIGIN}/uploads/${path}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return new Response(null, { status: res.status })
    return new Response(res.body, {
      headers: {
        'content-type':
          res.headers.get('content-type') ?? 'application/octet-stream',
        'cache-control':
          res.headers.get('cache-control') ?? 'public, max-age=86400',
      },
    })
  } catch {
    return new Response(null, { status: 502 })
  }
}
