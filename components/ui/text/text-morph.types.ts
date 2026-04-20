import type React from 'react'
import type { Transition, Variants } from 'motion/react'

export type TextMorphProps = {
  children: string
  as?: React.ElementType
  className?: string
  style?: React.CSSProperties
  variants?: Variants
  transition?: Transition
}
