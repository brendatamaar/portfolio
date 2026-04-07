/**
 * Renderer — BlockToken[] → HTML string.
 */

import type {
  BlockToken,
  ListItemToken,
  AdmonitionType,
  TocItem,
  Sidenote,
  ParseResult,
  BibliographyEntry,
} from './types.js'
import { parseInline, type InlineContext } from './inline.js'
import { highlight } from './highlight.js'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Admonition config

const ADMONITION_CONFIG: Record<
  AdmonitionType,
  { icon: string; label: string; colorClass: string }
> = {
  note: { icon: 'ℹ', label: 'Note', colorClass: 'admonition-note' },
  warning: { icon: '⚠', label: 'Warning', colorClass: 'admonition-warning' },
  danger: { icon: '🔴', label: 'Danger', colorClass: 'admonition-danger' },
  tip: { icon: '💡', label: 'Tip', colorClass: 'admonition-tip' },
  info: { icon: '📘', label: 'Info', colorClass: 'admonition-info' },
  tldr: { icon: '⚡', label: 'TL;DR', colorClass: 'admonition-tldr' },
  update: { icon: '📅', label: 'Update', colorClass: 'admonition-update' },
  definition: {
    icon: '📖',
    label: 'Definition',
    colorClass: 'admonition-definition',
  },
  ai: { icon: '🤖', label: 'Ask AI', colorClass: 'admonition-ai' },
  'see-also': {
    icon: '→',
    label: 'See Also',
    colorClass: 'admonition-see-also',
  },
}

// List rendering

function renderListItem(
  item: ListItemToken,
  ordered: boolean,
  ctx: InlineContext,
): string {
  let html = `<li>${parseInline(item.text, ctx)}`
  if (item.children.length) {
    const tag = ordered ? 'ol' : 'ul'
    html += `<${tag}>${item.children.map((c) => renderListItem(c, ordered, ctx)).join('')}</${tag}>`
  }
  html += '</li>'
  return html
}

// Bibliography rendering

const SOURCE_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  web: { label: 'Web', icon: '🌐' },
  docs: { label: 'Docs', icon: '📖' },
  journal: { label: 'Journal', icon: '📄' },
  article: { label: 'Article', icon: '📰' },
  book: { label: 'Book', icon: '📚' },
  video: { label: 'Video', icon: '🎬' },
  podcast: { label: 'Podcast', icon: '🎙' },
  repo: { label: 'Repository', icon: '💾' },
  other: { label: 'Other', icon: '·' },
}

const SOURCE_TYPE_ORDER = [
  'web',
  'docs',
  'journal',
  'article',
  'book',
  'video',
  'podcast',
  'repo',
  'other',
]

function renderBibEntryText(text: string): string {
  const urlRegex = /https?:\/\/[^\s]+/g
  const parts: string[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = urlRegex.exec(text)) !== null) {
    parts.push(escapeHtml(text.slice(lastIndex, match.index)))
    const url = match[0]
    parts.push(
      `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="bib-link">${escapeHtml(url)}</a>`,
    )
    lastIndex = match.index + url.length
  }
  parts.push(escapeHtml(text.slice(lastIndex)))

  // Bold quoted titles e.g. "Title here" (quotes are HTML-escaped at this point)
  return parts.join('').replace(/&quot;(.*?)&quot;/g, '"<strong>$1</strong>"')
}

function renderBibliography(entries: BibliographyEntry[]): string {
  if (!entries.length) return ''

  // Group by source type
  const groups = new Map<string, BibliographyEntry[]>()
  for (const entry of entries) {
    const type = entry.sourceType || 'other'
    if (!groups.has(type)) groups.set(type, [])
    groups.get(type)!.push(entry)
  }

  // Sort by predefined order, unknown types go last
  const sortedTypes = SOURCE_TYPE_ORDER.filter((t) => groups.has(t))
  for (const t of groups.keys()) {
    if (!sortedTypes.includes(t)) sortedTypes.push(t)
  }

  let html = `<section class="bibliography" aria-label="Bibliography">\n`
  html += `<h2 class="bibliography-title">Bibliography</h2>\n`

  for (const type of sortedTypes) {
    const groupEntries = groups.get(type)!
    const cfg = SOURCE_TYPE_CONFIG[type] ?? { label: type, icon: '·' }
    html += `<div class="bib-group">\n`
    html += `<div class="bib-source-label"><span class="bib-source-icon">${cfg.icon}</span><span>${cfg.label}</span></div>\n`
    html += `<ol class="bib-entries">\n`
    for (const entry of groupEntries) {
      html += `<li id="ref-${escapeHtml(entry.key)}" class="bib-entry">`
      html += `<span class="bib-num">[${entry.num}]</span>`
      html += `<span class="bib-text">${renderBibEntryText(entry.text)}</span>`
      html += `</li>\n`
    }
    html += `</ol>\n</div>\n`
  }

  html += `</section>\n`
  return html
}

// Main renderer

export function renderBlocks(
  tokens: BlockToken[],
  ctx?: InlineContext,
): ParseResult {
  const toc: TocItem[] = []
  const sidenotes: Sidenote[] = []
  const bibliography: BibliographyEntry[] = []
  let html = ''

  // First pass: collect footnote definitions + bibliography entries
  const sidenoteMap = new Map<string, string>()
  const allBibEntries: Array<{
    key: string
    text: string
    sourceType: string
  }> = []

  for (const token of tokens) {
    if (token.type === 'footnote_def') {
      sidenoteMap.set(token.id, parseInline(token.text))
    }
    if (token.type === 'bibliography') {
      allBibEntries.push(...token.entries)
    }
  }

  // Build cite map: sort alphabetically by text, assign numbers
  const sorted = [...allBibEntries].sort((a, b) => a.text.localeCompare(b.text))
  const citeMap = new Map<string, number>()
  sorted.forEach((e, idx) => {
    citeMap.set(e.key, idx + 1)
    bibliography.push({
      key: e.key,
      text: e.text,
      num: idx + 1,
      sourceType: e.sourceType,
    })
  })

  const resolvedCtx: InlineContext = { ...ctx, citeMap }

  // Second pass: render
  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        toc.push({ id: token.id, text: token.text, level: token.level })
        html += `<h${token.level} id="${token.id}">${parseInline(token.text, resolvedCtx)}<a class="heading-anchor" href="#${token.id}" aria-label="Link to this section">§</a></h${token.level}>\n`
        break
      }

      case 'paragraph': {
        // Solo image on its own line → <figure> with optional caption
        const imgOnly = token.text.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
        if (imgOnly) {
          const [, alt, src] = imgOnly
          const caption = alt
            ? `<figcaption>${escapeHtml(alt)}</figcaption>`
            : ''
          html += `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy">${caption}</figure>\n`
          break
        }
        // Split on hard line breaks (two spaces at end or \n in source)
        const lines = token.text.split('\n')
        const inner = lines
          .map((l) => parseInline(l.trimEnd(), resolvedCtx))
          .join('<br>')
        html += `<p>${inner}</p>\n`
        break
      }

      case 'code': {
        const highlighted = highlight(token.text, token.lang)
        const langLabel = token.lang
          ? `<span class="code-lang">${token.lang}</span>`
          : ''
        html += `<div class="code-block">${langLabel}<pre><code class="language-${token.lang}">${highlighted}</code></pre></div>\n`
        break
      }

      case 'blockquote': {
        const inner = renderBlocks(token.children, resolvedCtx)
        toc.push(...inner.toc)
        sidenotes.push(...inner.sidenotes)
        html += `<blockquote>${inner.html}</blockquote>\n`
        break
      }

      case 'list': {
        const tag = token.ordered ? 'ol' : 'ul'
        const items = token.items
          .map((item) => renderListItem(item, token.ordered, resolvedCtx))
          .join('')
        html += `<${tag}>${items}</${tag}>\n`
        break
      }

      case 'hr': {
        html += `<hr>\n`
        break
      }

      case 'table': {
        const thead = token.headers
          .map((h, idx) => {
            const align = token.align[idx]
            const style = align ? ` style="text-align:${align}"` : ''
            return `<th${style}>${parseInline(h, resolvedCtx)}</th>`
          })
          .join('')
        const tbody = token.rows
          .map((row) => {
            const cells = row
              .map((cell, idx) => {
                const align = token.align[idx]
                const style = align ? ` style="text-align:${align}"` : ''
                return `<td${style}>${parseInline(cell, resolvedCtx)}</td>`
              })
              .join('')
            return `<tr>${cells}</tr>`
          })
          .join('')
        html += `<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>\n`
        break
      }

      case 'admonition': {
        const cfg = ADMONITION_CONFIG[token.kind] ?? ADMONITION_CONFIG.note

        if (token.kind === 'ai') {
          const rawText = token.children
            .map((c) => (c.type === 'paragraph' ? c.text : ''))
            .join('\n')
            .trim()
          const inner = renderBlocks(token.children, resolvedCtx)
          toc.push(...inner.toc)
          sidenotes.push(...inner.sidenotes)
          html += `<div class="admonition ${cfg.colorClass}" data-ai-prompt="${rawText.replace(/"/g, '&quot;')}">
  <div class="admonition-header">
    <span class="admonition-icon">${cfg.icon}</span>
    <span class="admonition-label">${cfg.label}</span>
    <button class="admonition-copy-btn" onclick="(function(btn){const text=btn.closest('.admonition').dataset.aiPrompt;navigator.clipboard.writeText(text).then(()=>{btn.textContent='Copied!';setTimeout(()=>{btn.textContent='Copy prompt'},2000)})})(this)">Copy prompt</button>
  </div>
  <div class="admonition-body admonition-body-mono">${inner.html}</div>
</div>\n`
        } else {
          const inner = renderBlocks(token.children, resolvedCtx)
          toc.push(...inner.toc)
          sidenotes.push(...inner.sidenotes)
          html += `<div class="admonition ${cfg.colorClass}">
  <div class="admonition-header">
    <span class="admonition-icon">${cfg.icon}</span>
    <span class="admonition-label">${cfg.label}</span>
  </div>
  <div class="admonition-body">${inner.html}</div>
</div>\n`
        }
        break
      }

      case 'footnote_def': {
        const noteHtml = parseInline(token.text, resolvedCtx)
        sidenotes.push({ id: token.id, html: noteHtml })
        html += `<div class="footnote-def" id="fn-${token.id}">
  <sup>[${token.id}]</sup> ${noteHtml}
</div>\n`
        break
      }

      case 'definition_list': {
        const items = token.items
          .map(({ term, defs }) => {
            const dd = defs
              .map((d) => `<dd>${parseInline(d, resolvedCtx)}</dd>`)
              .join('')
            return `<dt>${escapeHtml(term)}</dt>${dd}`
          })
          .join('')
        html += `<dl>${items}</dl>\n`
        break
      }

      case 'bibliography': {
        html += renderBibliography(bibliography)
        break
      }
    }
  }

  return { html, toc, sidenotes, bibliography }
}
