import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { useTheme } from 'next-themes'
import { Link } from 'react-router-dom'

export default function Header() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setTheme(theme === 'light' ? 'dark' : 'light')
      })
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }

  return (
    <header className="mb-16 flex items-center justify-between">
      <Link
        to="/"
        className="link-underline font-[family-name:var(--font-geist-mono)] text-xs text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
      >
        brendatama.xyz
      </Link>

      <div className="flex items-center gap-5">
        <Link
          to="/blog"
          className="link-underline text-sm text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          writing
        </Link>
        <button
          onClick={toggleTheme}
          className="text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
          aria-label="Toggle theme"
        >
          <SunIcon className="h-3.5 w-3.5 scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90 absolute" />
          <MoonIcon className="h-3.5 w-3.5 scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0 absolute" />
          <span className="h-3.5 w-3.5 block" />
        </button>
      </div>
    </header>
  )
}
