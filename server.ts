import { join, resolve, sep } from 'path'

const PORT = Number(process.env.PORT ?? 3000)
const clientDir = resolve(import.meta.dir, 'dist/client')
const templatePath = join(clientDir, 'index.html')

// Async reads — no event loop blocking
const template = await Bun.file(templatePath).text()
const { render } = await import('./dist/server/entry-server.js')

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    // Resolve and validate the file path to prevent path traversal
    const filePath = resolve(clientDir, '.' + url.pathname)
    if (!filePath.startsWith(clientDir + sep) && filePath !== clientDir) {
      return new Response('Forbidden', { status: 403 })
    }

    // Try to serve as a static asset
    const file = Bun.file(filePath)
    if (await file.exists()) {
      const isImmutableAsset = url.pathname.startsWith('/assets/')
      return new Response(file, {
        headers: {
          'Cache-Control': isImmutableAsset
            ? 'public, max-age=31536000, immutable'
            : 'no-cache',
        },
      })
    }

    // SSR for all app routes
    try {
      const html = await render(url.pathname + url.search, template)
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    } catch (err) {
      console.error('SSR error:', err)
      return new Response('Internal Server Error', { status: 500 })
    }
  },
})

console.log(`Portfolio server running at http://localhost:${PORT}`)
