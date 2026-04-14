import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { SCROLL_THRESHOLD } from '@/lib/constants'

/** Floating button that appears after scrolling down. */
export function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    let rafId: number
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() =>
        setShow(window.scrollY > SCROLL_THRESHOLD),
      )
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed right-6 bottom-6 z-50 border-2 border-black bg-white px-4 py-2 font-mono text-xs tracking-widest text-black uppercase shadow-[4px_4px_0px_#000] transition-colors hover:border-black hover:bg-[#FFE600] dark:border-white dark:bg-black dark:text-white dark:shadow-[4px_4px_0px_#fff] dark:hover:border-[#FFE600] dark:hover:bg-[#FFE600] dark:hover:text-black"
        >
          ↑ top
        </motion.button>
      )}
    </AnimatePresence>
  )
}
