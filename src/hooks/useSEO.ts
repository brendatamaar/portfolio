import { useEffect } from 'react'

const SITE_NAME = 'Brenda Tama'
const DEFAULT_DESCRIPTION = 'Brendatama - Web Software Developer'
const DEFAULT_IMAGE = 'https://www.brendatama.xyz/images/meta_img.webp'
const SITE_URL = 'https://www.brendatama.xyz'
const TWITTER_HANDLE = '@berkelomang'

interface SEOOptions {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
}

function setMeta(property: string, content: string, useProperty = false) {
  const attr = useProperty ? 'property' : 'name'
  let el = document.querySelector<HTMLMetaElement>(
    `meta[${attr}="${property}"]`,
  )
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
}: SEOOptions = {}) {
  useEffect(() => {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    const pageUrl = url ? `${SITE_URL}${url}` : SITE_URL

    document.title = pageTitle

    // Standard
    setMeta('description', description)

    // Open Graph
    setMeta('og:type', type, true)
    setMeta('og:title', pageTitle, true)
    setMeta('og:description', description, true)
    setMeta('og:image', image, true)
    setMeta('og:url', pageUrl, true)
    setMeta('og:site_name', SITE_NAME, true)

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', pageTitle)
    setMeta('twitter:description', description)
    setMeta('twitter:image', image)
    setMeta('twitter:creator', TWITTER_HANDLE)
    setMeta('twitter:site', TWITTER_HANDLE)
  }, [title, description, image, url, type])
}
