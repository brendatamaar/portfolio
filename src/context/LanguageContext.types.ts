import type { ReactNode } from 'react'
import type { Lang } from '../lib/i18n'
import type { TranslationKey } from '../types/i18n'

export interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Resolve a dot-notated translation key, with optional {n} interpolation */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

export interface LanguageProviderProps {
  children: ReactNode
}
