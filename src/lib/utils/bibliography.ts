/**
 * Format bibliography text by making quoted titles bold and URLs clickable.
 */
export function formatBibliographyText(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  return escaped
    .replace(/&quot;(.*?)&quot;/g, '&quot;<strong>$1</strong>&quot;')
    .replace(
      /\bhttps?:\/\/[^\s<]+[^<.,:;"')\]\s]/g,
      (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
    )
}
