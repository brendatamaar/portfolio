import type { RefObject } from 'react'
import type { SpringOptions } from 'motion/react'

export type ScrollProgressProps = {
  className?: string
  springOptions?: SpringOptions
  containerRef?: RefObject<HTMLDivElement>
}
