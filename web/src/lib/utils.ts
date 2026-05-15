export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const HTML_TAG_RE = /<[^>]+>/g
const READING_WPM = 200

export function readingTime(html: string): number {
  const cleaned = html.replace(
    /<section class="bibliography"[\s\S]*?<\/section>/g,
    '',
  )
  const words = cleaned.replace(HTML_TAG_RE, '').trim().split(/\s+/).length
  return Math.max(1, Math.round(words / READING_WPM))
}
