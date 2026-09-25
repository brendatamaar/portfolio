const DATE_LOCALE = { en: 'en-US', id: 'id-ID' } as const

export function formatDate(
  date: Date | string,
  lang: 'en' | 'id' = 'en',
): string {
  return new Date(date).toLocaleDateString(DATE_LOCALE[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const BIBLIOGRAPHY_RE = /<section class="bibliography"[\s\S]*?<\/section>/g
const HTML_TAG_RE = /<[^>]+>/g
const WORD_RE = /\S+/g
const READING_WPM = 200

export function readingTime(html: string): number {
  const text = html.replace(BIBLIOGRAPHY_RE, '').replace(HTML_TAG_RE, ' ')
  const words = text.match(WORD_RE)?.length ?? 0
  return Math.max(1, Math.round(words / READING_WPM))
}
