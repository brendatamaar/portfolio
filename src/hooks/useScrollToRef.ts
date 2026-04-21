import { useCallback } from 'react'
import { TIMEOUTS } from '../lib/constants.js'

interface UseScrollToRefOptions {
  contentRef: React.RefObject<HTMLElement | null>
  highlightClass: string
}

export function useScrollToRef(options: UseScrollToRefOptions) {
  const { contentRef, highlightClass } = options

  return useCallback(
    (selector: string) => {
      const content = contentRef.current
      if (!content) return

      const element = content.querySelector(selector) as HTMLElement | null
      if (!element) return

      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Add highlight animation
      element.classList.add(highlightClass)
      setTimeout(() => {
        element.classList.remove(highlightClass)
      }, TIMEOUTS.highlightDuration)
    },
    [contentRef, highlightClass],
  )
}
