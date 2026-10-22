import type { APIRoute } from 'astro'
import sharp from 'sharp'

// Uploaded images live on the API server (`/uploads/*` at its root). Proxy them so
// the relative `/uploads/...` URLs stored by the admin also resolve on this origin.
const API_ORIGIN = (
  process.env.API_INTERNAL_URL ??
  import.meta.env.PUBLIC_API_URL ??
  'http://localhost:3001/api'
).replace(/\/api\/?$/, '')

// `?w=` serves a resized webp (screenshots are 16:9 and uploaded at full size).
const WIDTHS = new Set([480, 640, 960, 1280])
const CACHE_MAX = 60
const resized = new Map<string, Buffer>()

async function resize(key: string, source: Response, width: number) {
  let out = resized.get(key)
  if (!out) {
    out = await sharp(Buffer.from(await source.arrayBuffer()))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer()
    if (resized.size >= CACHE_MAX) resized.delete(resized.keys().next().value!)
    resized.set(key, out)
  }
  return out
}

export const GET: APIRoute = async ({ params, url }) => {
  const path = params.path ?? ''
  if (!path || path.split('/').includes('..')) {
    return new Response(null, { status: 404 })
  }
  const w = Number(url.searchParams.get('w'))
  const width = WIDTHS.has(w) ? w : 0

  try {
    const res = await fetch(`${API_ORIGIN}/uploads/${path}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return new Response(null, { status: res.status })
    const type = res.headers.get('content-type') ?? 'application/octet-stream'
    if (width && /^image\/(png|jpe?g|webp)$/.test(type)) {
      try {
        const body = await resize(`${path}@${width}`, res, width)
        return new Response(new Uint8Array(body), {
          headers: {
            'content-type': 'image/webp',
            'cache-control':
              'public, max-age=604800, stale-while-revalidate=86400',
          },
        })
      } catch {
        return new Response(null, { status: 502 })
      }
    }
    return new Response(res.body, {
      headers: {
        'content-type': type,
        'cache-control':
          res.headers.get('cache-control') ?? 'public, max-age=86400',
      },
    })
  } catch {
    return new Response(null, { status: 502 })
  }
}
