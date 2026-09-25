export type Theme = 'dark' | 'light'

// Initial theme is applied by the inline script in components/BaseHead.astro

export function toggleTheme() {
  const next: Theme = document.documentElement.classList.contains('dark')
    ? 'light'
    : 'dark'
  try {
    localStorage.setItem('theme', next)
  } catch {
    // Storage unavailable (private mode) — theme still applies for this page
  }
  document.documentElement.classList.toggle('dark', next === 'dark')
}
