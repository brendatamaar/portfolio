import { createContext, useContext, useState, useCallback } from 'react'
import {
  translations,
  resolveKey,
  type Lang,
  type TranslationKey,
} from '../lib/i18n'
import type {
  LanguageContextValue,
  LanguageProviderProps,
} from './LanguageContext.types'

const LanguageContext = createContext<LanguageContextValue | null>(null)

function detectLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('lang')
  if (stored === 'en' || stored === 'id') return stored
  const browser = navigator.language.toLowerCase()
  return browser.startsWith('id') ? 'id' : 'en'
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Lazy initializer runs synchronously on the client during hydration,
  // eliminating the post-paint flash caused by a useEffect swap.
  // The server always renders 'en'; the hydration mismatch (if any) is
  // recovered before the browser paints.
  const [lang, setLangState] = useState<Lang>(() => detectLang())

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem('lang', next)
    setLangState(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
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
