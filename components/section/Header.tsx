import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { useTheme } from 'next-themes'
import { Link } from '@tanstack/react-router'
import { useLang } from '@/src/context/LanguageContext'
import { LanguageSwitcher } from '@/src/components/ui/LanguageSwitcher'

export default function Header() {
  const { theme, setTheme } = useTheme()
  const { t } = useLang()

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
    <header className="mb-16 flex items-center justify-between border-b-2 border-black pb-5 dark:border-white">
      <Link
        to="/"
        className="font-mono text-xs font-bold tracking-widest text-black uppercase dark:text-white"
      >
        {t('nav.home')}
      </Link>

      <div className="flex items-center gap-5">
        <Link
          to="/blog"
          className="font-mono text-xs tracking-widest text-black uppercase hover:underline dark:text-white"
        >
          {t('nav.writing')}
        </Link>
        {/* <Link
          to="/collection"
          className="font-mono text-xs tracking-widest text-black uppercase hover:underline dark:text-white"
        >
          {t('nav.collection')}
        </Link> */}
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="border-2 border-black p-1.5 text-black transition-colors hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          aria-label="Toggle theme"
        >
          <SunIcon className="block h-3 w-3 dark:hidden" />
          <MoonIcon className="hidden h-3 w-3 dark:block" />
        </button>
      </div>
    </header>
  )
}
