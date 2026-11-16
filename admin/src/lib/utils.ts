import type { GlossaryEntry, BibliographyEntry } from './types'

const needsQuotes = (s: string) => s.includes('|') || s.startsWith('"')

export function glossaryToMarkdown(entries: GlossaryEntry[]): string {
  return entries
    .map((e) => {
      const term = needsQuotes(e.term) ? `"${e.term}"` : e.term
      const definition = e.definition.includes('\n')
        ? `"""\n${e.definition}\n"""`
        : needsQuotes(e.definition)
          ? `"${e.definition}"`
          : e.definition
      return `${e.key}: ${term} | ${definition}`
    })
    .join('\n')
}

export function bibliographyToMarkdown(entries: BibliographyEntry[]): string {
  return entries
    .map((e) => {
      const text = e.text.includes('\n')
        ? `"""\n${e.text}\n"""`
        : needsQuotes(e.text)
          ? `"${e.text}"`
          : e.text
      return `${e.key}: ${e.sourceType} | ${text}`
    })
    .join('\n')
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function fmtDate(date: string | null, label: string): string {
  if (!date) return ''
  const d = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return label ? `${label} ${d}` : d
}
