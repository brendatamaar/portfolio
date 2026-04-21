/**
 * Format bibliography text by making quoted titles bold
 */
export function formatBibliographyText(text: string): string {
  return text.replace(/"(.*?)"/g, '"<strong>$1</strong>"')
}
