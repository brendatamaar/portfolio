import type React from 'react'
import type { Transition, Variants, AnimatePresenceProps } from 'motion/react'

export type TextLoopProps = {
  children: React.ReactNode[]
  className?: string
  interval?: number
  transition?: Transition
  variants?: Variants
  onIndexChange?: (index: number) => void
  trigger?: boolean
  mode?: AnimatePresenceProps['mode']
}
