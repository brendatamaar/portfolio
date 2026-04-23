import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { createRouter } from './router'
import type { RouteWithHead } from './types/router'

const SITE_NAME = 'Brendatama Akbar - Web Software Developer'
const SITE_URL = 'https://www.brendatama.dev'
const DEFAULT_IMAGE = `${SITE_URL}/images/meta_img.webp`
const TWITTER_HANDLE = '@berkelomang'

const DEFAULT_META_TAGS: Array<Record<string, string>> = [
  { title: SITE_NAME },
  { name: 'description', content: 'Brendatama Akbar - Web Software Developer' },
  { property: 'og:type', content: 'website' },
  { property: 'og:title', content: SITE_NAME },
  {
    property: 'og:description',
    content: 'Brendatama Akbar - Web Software Developer',
  },
  { property: 'og:image', content: DEFAULT_IMAGE },
  { property: 'og:url', content: SITE_URL },
  { property: 'og:site_name', content: SITE_NAME },
  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:title', content: SITE_NAME },
  {
    name: 'twitter:description',
    content: 'Brendatama Akbar - Web Software Developer',
  },
  { name: 'twitter:image', content: DEFAULT_IMAGE },
  { name: 'twitter:creator', content: TWITTER_HANDLE },
  { name: 'twitter:site', content: TWITTER_HANDLE },
]

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildMetaTags(metas: Array<Record<string, string>>): string {
  const tags = metas.map((tag) => {
    if ('title' in tag) return `<title>${escapeHtml(tag.title)}</title>`
    const attrs = Object.entries(tag)
      .map(([k, v]) => `${escapeHtml(k)}="${escapeHtml(v)}"`)
      .join(' ')
    return `<meta ${attrs} />`
  })

  // Ensure og:image and twitter:card always present as fallback
  const hasOgImage = metas.some((m) => m.property === 'og:image')
  const hasTwitterCard = metas.some((m) => m.name === 'twitter:card')
  if (!hasOgImage)
    tags.push(`<meta property="og:image" content="${DEFAULT_IMAGE}" />`)
  if (!hasTwitterCard)
    tags.push(`<meta name="twitter:card" content="summary_large_image" />`)

  return tags.join('\n    ')
}

export async function render(url: string, template: string): Promise<string> {
  const router = createRouter()
  const memoryHistory = createMemoryHistory({ initialEntries: [url] })
  router.update({ history: memoryHistory })

  await router.load()

  const appHtml = renderToString(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )

  // Dehydrate router state so the client can restore loader data without
  // re-fetching. Without this the client starts with an empty router and
  // renders a loading/empty tree that mismatches the SSR HTML → error #418.
  // hydrate() on the client reads window.$_TSR.router to rehydrate matches.
  const dehydratedMatches = router.state.matches.map((match) => ({
    i: match.id,
    s: match.status,
    l: match.loaderData ?? {},
  }))
  const tsrState = JSON.stringify({
    router: {
      matches: dehydratedMatches,
      lastMatchId: router.state.matches.at(-1)?.id ?? '',
    },
  })
    // Escape sequences that would break out of the <script> tag or cause issues
    // in HTML parsers even before the JS engine sees them.
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
  const ssrScript = `<script>window.$_TSR=${tsrState}</script>`

  // Extract head data from matched routes by calling each route's head() function
  const routesById = router.routesById as unknown as Record<
    string,
    RouteWithHead
  >
  const metas = router.state.matches.flatMap((match) => {
    const route = routesById[match.routeId]
    if (!route?.options?.head) return []
    const result = route.options.head({
      loaderData: match.loaderData,
      params: match.params as Record<string, string>,
      context: match.context ?? {},
    })
    return result?.meta ?? []
  })

  const metaHtml = buildMetaTags(metas.length ? metas : DEFAULT_META_TAGS)

  return template
    .replace('<!--meta-placeholder-->', metaHtml)
    .replace('<!--app-->', appHtml)
    .replace('</body>', `${ssrScript}</body>`)
    .replace(
      '<html lang="en">',
      '<html lang="en" suppressHydrationWarning="true">',
    )
}
