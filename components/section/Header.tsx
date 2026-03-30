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
    <header className="mb-16 border-b-2 border-black dark:border-white pb-5 flex items-center justify-between">
      <Link
        to="/"
        className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-widest text-black dark:text-white"
      >
        home
      </Link>

      <div className="flex items-center gap-5">
        <Link
          to="/blog"
          className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-black dark:text-white hover:underline"
        >
          writing
        </Link>
        <button
          onClick={toggleTheme}
          className="border-2 border-black dark:border-white p-1.5 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          aria-label="Toggle theme"
        >
          <SunIcon className="h-3 w-3 block dark:hidden" />
          <MoonIcon className="h-3 w-3 hidden dark:block" />
        </button>
      </div>
    </header>
  )
}
