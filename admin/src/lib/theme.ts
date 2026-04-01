import { useState, useCallback } from 'react'

export function getStoredTheme(): 'dark' | 'light' {
  return (localStorage.getItem('admin_theme') as 'dark' | 'light') ?? 'dark'
}

export function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('admin_theme', theme)
}

export function useTheme() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  const toggle = useCallback(() => {
    const next = !isDark
    setIsDark(next)
    applyTheme(next ? 'dark' : 'light')
  }, [isDark])

  return { isDark, toggle }
}
