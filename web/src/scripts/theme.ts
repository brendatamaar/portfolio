export type Theme = 'dark' | 'light'

function getStored(): Theme | null {
  const v = localStorage.getItem('theme')
  return v === 'dark' || v === 'light' ? v : null
}

function getPreferred(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function initTheme() {
  apply(getStored() ?? getPreferred())

  // Follow system preference when user hasn't made an explicit choice
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (!getStored()) apply(e.matches ? 'dark' : 'light')
    })
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark')
  const next: Theme = isDark ? 'light' : 'dark'
  localStorage.setItem('theme', next)
  apply(next)
}
