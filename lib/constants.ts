import type { SpringOptions } from 'motion/react'
import type { BookEntry } from '@/data/reading-data'

export const WEBSITE_URL = 'https://nim-fawn.vercel.app'

// back-to-top
export const SCROLL_THRESHOLD = 400

// project-card
export const MAX_TECH_TAGS = 3

// book-card
export const STATUS_LABEL: Record<BookEntry['status'], string> = {
  reading: 'reading',
  finished: 'finished',
  read: 'read',
  'want-to-read': 'want to read',
}

// tag-button
export const TAG_BUTTON_BASE =
  'inline-flex items-center border-2 border-black px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors dark:border-white dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
export const TAG_BUTTON_ACTIVE =
  'border-black bg-[#FFE600] text-black dark:border-black'
export const TAG_BUTTON_INACTIVE =
  'bg-white text-black hover:bg-[#FFE600] hover:text-black dark:bg-black dark:text-white dark:hover:border-black dark:hover:bg-[#FFE600] dark:hover:text-black'

// magnetic
export const MAGNETIC_SPRING_CONFIG = {
  stiffness: 26.7,
  damping: 4.1,
  mass: 0.2,
}

// scroll-progress
export const SCROLL_PROGRESS_SPRING_OPTIONS: SpringOptions = {
  stiffness: 200,
  damping: 50,
  restDelta: 0.001,
}
