import { motion } from 'motion/react'
import { RESUME_DATA } from '@/data/resume-data'

export default function Hero() {
  const data = RESUME_DATA

  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <h1 className="mb-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {data.name}
      </h1>
      <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {data.about}
      </p>
    </motion.section>
  )
}
