'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  type SpringOptions,
} from 'motion/react'
import { MAGNETIC_SPRING_CONFIG } from '@/lib/constants'

export type MagneticProps = {
  children: React.ReactNode
  intensity?: number
  range?: number
  actionArea?: 'self' | 'parent' | 'global'
  springOptions?: SpringOptions
}

export function Magnetic({
  children,
  intensity = 0.6,
  range = 100,
  actionArea = 'self',
  springOptions = MAGNETIC_SPRING_CONFIG,
}: MagneticProps) {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, springOptions)
  const springY = useSpring(y, springOptions)

  const calculateDistance = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const distanceX = e.clientX - centerX
      const distanceY = e.clientY - centerY
      const absoluteDistance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

      if (absoluteDistance <= range) {
        const scale = 1 - absoluteDistance / range
        x.set(distanceX * intensity * scale)
        y.set(distanceY * intensity * scale)
      } else {
        x.set(0)
        y.set(0)
      }
    },
    [intensity, range, x, y],
  )

  // Only attach mousemove listener when hovered
  useEffect(() => {
    if (!isHovered) return

    document.addEventListener('mousemove', calculateDistance)
    return () => {
      document.removeEventListener('mousemove', calculateDistance)
      x.set(0)
      y.set(0)
    }
  }, [isHovered, calculateDistance, x, y])

  useEffect(() => {
    if (actionArea === 'parent' && ref.current?.parentElement) {
      const parent = ref.current.parentElement

      const handleParentEnter = () => setIsHovered(true)
      const handleParentLeave = () => setIsHovered(false)

      parent.addEventListener('mouseenter', handleParentEnter)
      parent.addEventListener('mouseleave', handleParentLeave)

      return () => {
        parent.removeEventListener('mouseenter', handleParentEnter)
        parent.removeEventListener('mouseleave', handleParentLeave)
      }
    } else if (actionArea === 'global') {
      setIsHovered(true)
    }
  }, [actionArea])

  const handleMouseEnter = () => {
    if (actionArea === 'self') {
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    if (actionArea === 'self') {
      setIsHovered(false)
      x.set(0)
      y.set(0)
    }
  }

  return (
    <motion.div
      ref={ref}
      onMouseEnter={actionArea === 'self' ? handleMouseEnter : undefined}
      onMouseLeave={actionArea === 'self' ? handleMouseLeave : undefined}
      style={{
        x: springX,
        y: springY,
      }}
    >
      {children}
    </motion.div>
  )
}
