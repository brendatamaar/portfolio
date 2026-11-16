import type { RequestHandler } from './$types'
import { API_URL } from '$lib/server/config'

// Uploaded images live on the API server (`/uploads/*` at its root). Proxy them so
// relative `/uploads/...` URLs resolve properly within the admin origin as well.
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '')

export const GET: RequestHandler = async ({ params }) => {
  const path = params.path
  if (!path || path.split('/').includes('..')) {
    return new Response(null, { status: 404 })
  }

  try {
    const res = await fetch(`${API_ORIGIN}/uploads/${path}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return new Response(null, { status: res.status })

    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type':
          res.headers.get('content-type') ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
      },
    })
  } catch {
    return new Response(null, { status: 502 })
  }
}
