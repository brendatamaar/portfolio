import type { GlossaryEntry, BibliographyEntry } from '../types/api.js'

// ============================================================================
// Types
// ============================================================================

export interface ParseError {
  line: number
  content: string
  message: string
}

export interface ParseResult<T> {
  entries: T[]
  errors: ParseError[]
  isValid: boolean
}

// ============================================================================
// Constants
// ============================================================================

export const VALID_SOURCE_TYPES = [
  'web',
  'docs',
  'journal',
  'article',
  'book',
  'video',
  'podcast',
  'repo',
  'other',
] as const

export type SourceType = (typeof VALID_SOURCE_TYPES)[number]

const KEY_REGEX = /^[a-zA-Z0-9_-]+$/

// ============================================================================
// Glossary
// ============================================================================

/**
 * Convert glossary entries to markdown format
 * Format: key: term | definition
 * Supports multiline definitions with """ delimiters
 */
export function glossaryToMarkdown(entries: GlossaryEntry[]): string {
  if (entries.length === 0) return ''

  return entries
    .map((e) => {
      const needsQuotes = (s: string) => s.includes('|') || s.startsWith('"')
      const needsMultiline = (s: string) => s.includes('\n')

      const term = needsQuotes(e.term) ? `"${e.term}"` : e.term

      let definition: string
      if (needsMultiline(e.definition)) {
        definition = `"""\n${e.definition}\n"""`
      } else if (needsQuotes(e.definition)) {
        definition = `"${e.definition}"`
      } else {
        definition = e.definition
      }

      return `${e.key}: ${term} | ${definition}`
    })
    .join('\n')
}

/**
 * Parse glossary entries from markdown with error reporting
 */
export function glossaryFromMarkdown(
  markdown: string,
): ParseResult<GlossaryEntry> {
  const entries: GlossaryEntry[] = []
  const errors: ParseError[] = []
  const lines = markdown.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineNumber = i + 1

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue

    // Must contain : and |
    if (!line.includes(':') || !line.includes('|')) {
      errors.push({
        line: lineNumber,
        content: line.slice(0, 50),
        message: 'Missing colon (:) or pipe (|) separator',
      })
      continue
    }

    const colonIndex = line.indexOf(':')
    const key = line.slice(0, colonIndex).trim()

    // Validate key
    if (!key) {
      errors.push({
        line: lineNumber,
        content: line.slice(0, 50),
        message: 'Key is required',
      })
      continue
    }

    if (!KEY_REGEX.test(key)) {
      errors.push({
        line: lineNumber,
        content: key,
        message: 'Key must be alphanumeric with hyphens/underscores only',
      })
      continue
    }

    // Check for duplicate keys
    if (entries.some((e) => e.key.toLowerCase() === key.toLowerCase())) {
      errors.push({
        line: lineNumber,
        content: key,
        message: `Duplicate key "${key}"`,
      })
      continue
    }

    let rest = line.slice(colonIndex + 1).trim()
    let term = ''
    let definition = ''
    let parsedSuccessfully = false

    // Handle multiline definition with """
    if (rest.startsWith('"""')) {
      const termEnd = rest.indexOf('|')
      if (termEnd === -1) {
        errors.push({
          line: lineNumber,
          content: line.slice(0, 50),
          message: 'Missing pipe (|) separator after term',
        })
        continue
      }

      term = rest.slice(0, termEnd).trim()
      if (term.startsWith('"""')) {
        term = term.slice(3).trim()
      }

      // Collect multiline definition
      const firstDefLine = rest.slice(termEnd + 1).trim()
      const defLines: string[] = []

      if (firstDefLine.startsWith('"""')) {
        let content = firstDefLine.slice(3)
        if (content.endsWith('"""')) {
          definition = content.slice(0, -3).trim()
          parsedSuccessfully = true
        } else {
          defLines.push(content)
          i++
          while (i < lines.length) {
            const defLine = lines[i]
            if (defLine.trim().endsWith('"""')) {
              defLines.push(defLine.trim().slice(0, -3))
              break
            }
            defLines.push(defLine)
            i++
          }
          definition = defLines.join('\n').trim()
          parsedSuccessfully = true
        }
      } else {
        errors.push({
          line: lineNumber,
          content: line.slice(0, 50),
          message: 'Multiline definition must start with """',
        })
        continue
      }
    } else {
      // Single line format: term | definition
      const parts = rest.split('|')
      if (parts.length < 2) {
        errors.push({
          line: lineNumber,
          content: line.slice(0, 50),
          message: 'Missing pipe (|) separator',
        })
        continue
      }

      term = parts[0].trim()
      definition = parts.slice(1).join('|').trim()

      // Handle quoted values
      if (term.startsWith('"') && term.endsWith('"')) {
        term = term.slice(1, -1)
      }
      if (definition.startsWith('"') && definition.endsWith('"')) {
        definition = definition.slice(1, -1)
      }

      parsedSuccessfully = true
    }

    // Validate term and definition
    if (parsedSuccessfully) {
      if (!term) {
        errors.push({
          line: lineNumber,
          content: line.slice(0, 50),
          message: 'Term is required',
        })
        continue
      }

      if (!definition) {
        errors.push({
          line: lineNumber,
          content: line.slice(0, 50),
          message: 'Definition is required',
        })
        continue
      }

      entries.push({ key, term, definition })
    }
  }

  return {
    entries,
    errors,
    isValid: errors.length === 0,
  }
}

/**
 * Validate a glossary entry
 */
export function validateGlossaryEntry(
  entry: GlossaryEntry,
  existingEntries: GlossaryEntry[],
  editingIndex: number | null,
): string | null {
  const trimmedKey = entry.key?.trim()

  if (!trimmedKey) {
    return 'Key is required'
  }

  if (!KEY_REGEX.test(trimmedKey)) {
    return 'Key must be alphanumeric with hyphens/underscores only'
  }

  const existingIndex = existingEntries.findIndex(
    (e, i) =>
      e.key?.toLowerCase() === trimmedKey.toLowerCase() && i !== editingIndex,
  )

  if (existingIndex !== -1) {
    return `Key "${trimmedKey}" already exists`
  }

  if (!entry.term?.trim()) {
    return 'Term is required'
  }

  if (!entry.definition?.trim()) {
    return 'Definition is required'
  }

  return null
}

// ============================================================================
// Bibliography
// ============================================================================

/**
 * Convert bibliography entries to markdown format
 * Format: key: sourceType | citation text
 * Supports multiline citations with """ delimiters
 */
export function bibliographyToMarkdown(entries: BibliographyEntry[]): string {
  if (entries.length === 0) return ''

  return entries
    .map((e) => {
      const needsQuotes = (s: string) => s.includes('|') || s.startsWith('"')
      const needsMultiline = (s: string) => s.includes('\n')

      let text: string
      if (needsMultiline(e.text)) {
        text = `"""\n${e.text}\n"""`
      } else if (needsQuotes(e.text)) {
        text = `"${e.text}"`
      } else {
        text = e.text
      }

      return `${e.key}: ${e.sourceType} | ${text}`
    })
    .join('\n')
}

/**
 * Parse bibliography entries from markdown with error reporting
 */
export function bibliographyFromMarkdown(
  markdown: string,
): ParseResult<BibliographyEntry> {
  const entries: BibliographyEntry[] = []
  const errors: ParseError[] = []
  const lines = markdown.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineNumber = i + 1

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue

    // Must contain : and |
    if (!line.includes(':') || !line.includes('|')) {
      errors.push({
        line: lineNumber,
        content: line.slice(0, 50),
        message: 'Missing colon (:) or pipe (|) separator',
      })
      continue
    }

    const colonIndex = line.indexOf(':')
    const key = line.slice(0, colonIndex).trim()

    // Validate key
    if (!key) {
      errors.push({
        line: lineNumber,
        content: line.slice(0, 50),
        message: 'Key is required',
      })
      continue
    }

    if (!KEY_REGEX.test(key)) {
      errors.push({
        line: lineNumber,
        content: key,
        message: 'Key must be alphanumeric with hyphens/underscores only',
      })
      continue
    }

    // Check for duplicate keys
    if (entries.some((e) => e.key.toLowerCase() === key.toLowerCase())) {
      errors.push({
        line: lineNumber,
        content: key,
        message: `Duplicate key "${key}"`,
      })
      continue
    }

    let rest = line.slice(colonIndex + 1).trim()
    let sourceType: SourceType = 'other'
    let text = ''
    let parsedSuccessfully = false

    // Handle multiline citation with """
    if (rest.startsWith('"""')) {
      const typeEnd = rest.indexOf('|')
      if (typeEnd === -1) {
        errors.push({
          line: lineNumber,
          content: line.slice(0, 50),
          message: 'Missing pipe (|) separator after source type',
        })
        continue
      }

      const rawSourceType = rest.slice(0, typeEnd).trim()
      if (VALID_SOURCE_TYPES.includes(rawSourceType as SourceType)) {
        sourceType = rawSourceType as SourceType
      } else {
        errors.push({
          line: lineNumber,
          content: rawSourceType,
          message: `Invalid source type "${rawSourceType}". Valid types: ${VALID_SOURCE_TYPES.join(', ')}`,
        })
        continue
      }

      const firstTextLine = rest.slice(typeEnd + 1).trim()

      if (firstTextLine.startsWith('"""')) {
        let content = firstTextLine.slice(3)
        if (content.endsWith('"""')) {
          text = content.slice(0, -3).trim()
          parsedSuccessfully = true
        } else {
          const textLines: string[] = [content]
          i++
          while (i < lines.length) {
            const textLine = lines[i]
            if (textLine.trim().endsWith('"""')) {
              textLines.push(textLine.trim().slice(0, -3))
              break
            }
            textLines.push(textLine)
            i++
          }
          text = textLines.join('\n').trim()
          parsedSuccessfully = true
        }
      } else {
        errors.push({
          line: lineNumber,
          content: line.slice(0, 50),
          message: 'Multiline citation must start with """',
        })
        continue
      }
    } else {
      // Single line format: sourceType | citation
      const parts = rest.split('|')
      if (parts.length < 2) {
        errors.push({
          line: lineNumber,
          content: line.slice(0, 50),
          message: 'Missing pipe (|) separator',
        })
        continue
      }

      const rawSourceType = parts[0].trim()
      if (VALID_SOURCE_TYPES.includes(rawSourceType as SourceType)) {
        sourceType = rawSourceType as SourceType
      } else {
        sourceType = 'other'
      }

      text = parts.slice(1).join('|').trim()

      // Handle quoted values
      if (text.startsWith('"') && text.endsWith('"')) {
        text = text.slice(1, -1)
      }

      parsedSuccessfully = true
    }

    // Validate text
    if (parsedSuccessfully) {
      if (!text) {
        errors.push({
          line: lineNumber,
          content: line.slice(0, 50),
          message: 'Citation text is required',
        })
        continue
      }

      entries.push({ key, sourceType, text })
    }
  }

  return {
    entries,
    errors,
    isValid: errors.length === 0,
  }
}

/**
 * Validate a bibliography entry
 */
export function validateBibliographyEntry(
  entry: BibliographyEntry,
  existingEntries: BibliographyEntry[],
  editingIndex: number | null,
): string | null {
  const trimmedKey = entry.key?.trim()

  if (!trimmedKey) {
    return 'Key is required'
  }

  if (!KEY_REGEX.test(trimmedKey)) {
    return 'Key must be alphanumeric with hyphens/underscores only'
  }

  const existingIndex = existingEntries.findIndex(
    (e, i) => e.key === trimmedKey && i !== editingIndex,
  )

  if (existingIndex !== -1) {
    return `Key "${trimmedKey}" already exists`
  }

  if (!entry.text?.trim()) {
    return 'Citation text is required'
  }

  if (!VALID_SOURCE_TYPES.includes(entry.sourceType)) {
    return `Invalid source type. Valid types: ${VALID_SOURCE_TYPES.join(', ')}`
  }

  return null
}

// ============================================================================
// Preview Rendering
// ============================================================================

/**
 * Render glossary entries as HTML for preview
 */
export function renderGlossaryPreview(entries: GlossaryEntry[]): string {
  if (entries.length === 0) {
    return '<p class="text-black/30 dark:text-white/30 italic">No glossary entries yet</p>'
  }

  return `<dl class="space-y-4">
    ${entries
      .map(
        (e) => `
      <div class="glossary-entry" data-key="${escapeHtml(e.key)}">
        <dt class="flex items-center gap-2">
          <code class="rounded bg-black/5 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">${escapeHtml(e.key)}</code>
          <span class="font-mono text-sm font-bold dark:text-white">${escapeHtml(e.term)}</span>
        </dt>
        <dd class="mt-1 pl-4 font-mono text-xs leading-relaxed text-black/60 dark:text-white/60">${escapeHtml(e.definition).replace(/\n/g, '<br>')}</dd>
      </div>
    `,
      )
      .join('')}
  </dl>`
}

/**
 * Render bibliography entries as HTML for preview
 */
export function renderBibliographyPreview(
  entries: BibliographyEntry[],
): string {
  if (entries.length === 0) {
    return '<p class="text-black/30 dark:text-white/30 italic">No bibliography entries yet</p>'
  }

  const sourceTypeIcons: Record<SourceType, string> = {
    web: '🌐',
    docs: '📖',
    journal: '📄',
    article: '📰',
    book: '📚',
    video: '🎬',
    podcast: '🎙',
    repo: '💾',
    other: '·',
  }

  return `<ol class="space-y-3">
    ${entries
      .map(
        (e, i) => `
      <li class="bibliography-entry flex items-start gap-2" data-key="${escapeHtml(e.key)}">
        <span class="shrink-0 font-mono text-xs text-black/40 dark:text-white/40">[${i + 1}]</span>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <code class="rounded bg-black/5 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">${escapeHtml(e.key)}</code>
            <span class="text-xs opacity-60" title="${e.sourceType}">${sourceTypeIcons[e.sourceType]}</span>
          </div>
          <p class="mt-1 pl-6 font-mono text-xs leading-relaxed text-black/60 dark:text-white/60">${escapeHtml(e.text).replace(/\n/g, '<br>')}</p>
        </div>
      </li>
    `,
      )
      .join('')}
  </ol>`
}

/**
 * Render parse errors as HTML
 */
export function renderParseErrors(errors: ParseError[]): string {
  if (errors.length === 0) return ''

  return `<div class="rounded border border-red-500/30 bg-red-500/10 p-3">
    <h4 class="mb-2 font-mono text-[10px] font-bold tracking-widest text-red-600 uppercase dark:text-red-400">
      Parse Errors (${errors.length})
    </h4>
    <ul class="space-y-2">
      ${errors
        .map(
          (e) => `
        <li class="font-mono text-[10px] text-red-600 dark:text-red-400">
          <span class="font-bold">Line ${e.line}:</span> ${escapeHtml(e.message)}
          <div class="mt-0.5 truncate text-red-500/70 dark:text-red-400/70">
            ${escapeHtml(e.content)}
          </div>
        </li>
      `,
        )
        .join('')}
    </ul>
  </div>`
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ============================================================================
// Storage Helpers
// ============================================================================

const STORAGE_KEY_PREFIX = 'editor-mode-'

export function getStoredEditorMode(
  tab: 'glossary' | 'bibliography',
  defaultMode: 'form' | 'markdown' = 'form',
): 'form' | 'markdown' {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tab}`)
    if (stored === 'form' || stored === 'markdown') {
      return stored
    }
  } catch {
    // localStorage not available
  }
  return defaultMode
}

export function setStoredEditorMode(
  tab: 'glossary' | 'bibliography',
  mode: 'form' | 'markdown',
): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${tab}`, mode)
  } catch {
    // localStorage not available
  }
}
