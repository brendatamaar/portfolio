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
// `?poster=1` extracts frame 0 as a static webp (used for fast LCP on animated GIFs).
const WIDTHS = new Set([480, 640, 760, 960, 1280])
const CACHE_MAX = 80
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'
const resized = new Map<string, Buffer>()
const inFlight = new Map<string, Promise<Buffer>>()

function cached(key: string, work: () => Promise<Buffer>): Promise<Buffer> {
  const hit = resized.get(key)
  if (hit) return Promise.resolve(hit)
  const pending = inFlight.get(key)
  if (pending) return pending
  const promise = work()
    .then((out) => {
      if (resized.size >= CACHE_MAX) {
        resized.delete(resized.keys().next().value!)
      }
      resized.set(key, out)
      return out
    })
    .finally(() => {
      inFlight.delete(key)
    })
  inFlight.set(key, promise)
  return promise
}

function resizeStatic(key: string, source: Response, width: number) {
  return cached(key, async () => {
    const pipeline = sharp(Buffer.from(await source.arrayBuffer()), {
      pages: 1,
    })
    if (width) pipeline.resize({ width, withoutEnlargement: true })
    return pipeline.webp({ quality: 78 }).toBuffer()
  })
}

function animatedWebp(key: string, source: Response, width: number) {
  return cached(key, async () => {
    const original = Buffer.from(await source.arrayBuffer())
    const pipeline = sharp(original, {
      animated: true,
      limitInputPixels: false,
    })
    if (width) pipeline.resize({ width, withoutEnlargement: true })
    return pipeline.webp({ quality: 72, effort: 3, loop: 0 }).toBuffer()
  })
}

export const GET: APIRoute = async ({ params, url }) => {
  const path = params.path ?? ''
  if (!path || path.split('/').includes('..')) {
    return new Response(null, { status: 404 })
  }
  const w = Number(url.searchParams.get('w'))
  const width = WIDTHS.has(w) ? w : 0
  const poster = url.searchParams.get('poster') === '1'
  const loop = url.searchParams.get('loop') === '1'

  try {
    const res = await fetch(`${API_ORIGIN}/uploads/${path}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return new Response(null, { status: res.status })
    const type = res.headers.get('content-type') ?? 'application/octet-stream'
    const isGif = /^image\/gif(?:;|$)/i.test(type)
    const isRaster = /^image\/(png|jpe?g|webp)(?:;|$)/i.test(type)

    if (poster && (isGif || isRaster)) {
      try {
        const body = await resizeStatic(`${path}@poster@${width}`, res, width)
        return new Response(new Uint8Array(body), {
          headers: {
            'content-type': 'image/webp',
            'cache-control': IMMUTABLE_CACHE,
          },
        })
      } catch {
        return new Response(null, { status: 502 })
      }
    }

    if (isGif && (loop || width)) {
      try {
        const body = await animatedWebp(`${path}@anim@${width}`, res, width)
        return new Response(new Uint8Array(body), {
          headers: {
            'content-type': 'image/webp',
            'cache-control': IMMUTABLE_CACHE,
          },
        })
      } catch {
        return new Response(null, { status: 502 })
      }
    }

    if (width && isRaster) {
      try {
        const body = await resizeStatic(`${path}@${width}`, res, width)
        return new Response(new Uint8Array(body), {
          headers: {
            'content-type': 'image/webp',
            'cache-control': IMMUTABLE_CACHE,
          },
        })
      } catch {
        return new Response(null, { status: 502 })
      }
    }

    return new Response(res.body, {
      headers: {
        'content-type': type,
        'cache-control': res.headers.get('cache-control') ?? IMMUTABLE_CACHE,
      },
    })
  } catch {
    return new Response(null, { status: 502 })
  }
}
