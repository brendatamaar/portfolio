export function formatDate(dateString: string): string {
  const d = new Date(dateString)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm} ${dd}, ${d.getFullYear()}`
}
