import type { translations } from '../lib/i18n.js'
import type { Lang } from '@portfolio/shared/types/common.js'

type Translations = typeof translations
export type LangDict = Translations[Lang]

type DotKeys<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends string
    ? `${Prefix}${K & string}`
    : DotKeys<T[K], `${Prefix}${K & string}.`>
}[keyof T]

export type TranslationKey = DotKeys<Translations['en']>
