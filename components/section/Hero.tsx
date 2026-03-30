import { motion } from 'motion/react'
import { RESUME_DATA } from '@/data/resume-data'

export default function Hero() {
  const data = RESUME_DATA

  return (
    <motion.section
      className="mb-20"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* name + info card */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8">
        <h1 className="flex-1 font-black text-4xl sm:text-5xl lg:text-6xl leading-[0.92] tracking-tighter uppercase text-black dark:text-white">
          Brendatama Akbar Ramadan
        </h1>

        {/* info card */}
        <div className="sm:w-44 shrink-0 border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] self-start">
          <div className="px-4 py-3 border-b-2 border-black dark:border-white">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-1">
              Role
            </p>
            <p className="font-black text-xs uppercase tracking-tight text-black dark:text-white">
              {data.currentJob}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-1">
              Location
            </p>
            <p className="font-black text-xs uppercase tracking-tight text-black dark:text-white">
              {data.location}
            </p>
          </div>
        </div>
      </div>

      {/* description */}
      <div className="border-t-2 border-black dark:border-white pt-6">
        <p className="text-base leading-relaxed text-black/60 dark:text-white/60">
          {data.description}
        </p>
      </div>
    </motion.section>
  )
}
