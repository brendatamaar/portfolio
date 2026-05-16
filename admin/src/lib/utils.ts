export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function fmtDate(date: string | null, label: string): string {
  if (!date) return ''
  return `${label} ${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
}
