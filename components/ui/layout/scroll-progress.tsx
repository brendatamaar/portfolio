'use client'

import { motion, SpringOptions, useScroll, useSpring } from 'motion/react'
import { cn } from '@/lib/utils'
import { RefObject } from 'react'
import { SCROLL_PROGRESS_SPRING_OPTIONS } from '@/lib/constants'

export type ScrollProgressProps = {
  className?: string
  springOptions?: SpringOptions
  containerRef?: RefObject<HTMLDivElement>
}

export function ScrollProgress({
  className,
  springOptions,
  containerRef,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll({
    container: containerRef,
    layoutEffect: Boolean(containerRef?.current),
  })

  const scaleX = useSpring(scrollYProgress, {
    ...SCROLL_PROGRESS_SPRING_OPTIONS,
    ...(springOptions ?? {}),
  })

  return (
    <motion.div
      className={cn('inset-x-0 top-0 h-1 origin-left', className)}
      style={{
        scaleX,
      }}
    />
  )
}
