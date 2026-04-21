export const PROJECT_PREVIEW_COUNT = 4
export const BLOG_POSTS_PREVIEW = 3
export const COLLECTION_PREVIEW_COUNT = 3

export const READING_WPM = 200
export const HTML_TAG_REGEX = /<[^>]+>/g

// BookItem status — shared between book-shelf and featured-card
import type { BookItem } from './api'

export const BOOK_STATUS_LABEL: Record<BookItem['status'], string> = {
  reading: 'reading',
  finished: 'read',
  want: 'want',
}

export const BOOK_STATUS_BADGE: Record<BookItem['status'], string> = {
  reading: 'bg-blue-500 text-white',
  finished: 'bg-[#FFE600] text-black',
  want: 'bg-black/10 text-black dark:bg-white/10 dark:text-white',
}

// Glossary and Bibliography UI Constants
export const POPUP_DIMENSIONS = {
  glossary: {
    estimatedHeight: 120,
    estimatedWidth: 320,
    margin: 8,
  },
  bibliography: {
    estimatedHeight: 100,
    estimatedWidth: 320,
    margin: 8,
  },
} as const

export const TIMEOUTS = {
  hideDelay: 100,
  highlightDuration: 1500,
} as const

export const VALIDATION_LIMITS = {
  glossary: {
    termMaxLength: 100,
    definitionMaxLength: 1000,
    maxEntries: 100,
  },
  bibliography: {
    keyMaxLength: 50,
    textMaxLength: 2000,
    maxEntries: 100,
  },
} as const
