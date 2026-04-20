import type { ReactNode } from 'react'
import type { SpringOptions } from 'motion/react'

export type MagneticProps = {
  children: ReactNode
  intensity?: number
  range?: number
  actionArea?: 'self' | 'parent' | 'global'
  springOptions?: SpringOptions
}
