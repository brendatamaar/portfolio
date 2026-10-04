/**
 * Bibliography entry text → HTML.
 * Escapes the text, bolds "quoted titles", and turns bare URLs into a short
 * external link labelled with the host (e.g. `github.com ↗`).
 */

const URL_RE = /\bhttps?:\/\/[^\s<]+[^<.,:;"')\]\s]/g

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function formatCitation(text: string): string {
  return escapeHtml(text)
    .replace(/&quot;(.*?)&quot;/g, '&quot;<strong>$1</strong>&quot;')
    .replace(
      URL_RE,
      (url) =>
        `<a class="bib-link" href="${url}" target="_blank" rel="noopener noreferrer" title="${url}">${hostOf(url.replace(/&amp;/g, '&'))}<span aria-hidden="true">↗</span></a>`,
    )
}
