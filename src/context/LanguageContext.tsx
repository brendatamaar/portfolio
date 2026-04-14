import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { translations, resolveKey, type Lang } from '../lib/i18n'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Resolve a dot-notated translation key, with optional {n} interpolation */
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function detectLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('lang')
  if (stored === 'en' || stored === 'id') return stored
  const browser = navigator.language.toLowerCase()
  return browser.startsWith('id') ? 'id' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const detected = detectLang()
    if (detected !== 'en') setLangState(detected)
  }, [])

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem('lang', next)
    setLangState(next)
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = translations[lang]
      let str = resolveKey(dict, key)
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v))
        }
      }
      return str
    },
    [lang],
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
