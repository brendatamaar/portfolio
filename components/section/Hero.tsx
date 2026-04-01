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
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <h1 className="flex-1 text-4xl leading-[0.92] font-black tracking-tighter text-black uppercase sm:text-5xl lg:text-6xl dark:text-white">
          Brendatama Akbar Ramadan
        </h1>

        {/* info card */}
        <div className="shrink-0 self-start border-2 border-black shadow-[4px_4px_0px_#000] sm:w-44 dark:border-white dark:shadow-[4px_4px_0px_#fff]">
          <div className="border-b-2 border-black px-4 py-3 dark:border-white">
            <p className="mb-1 font-mono text-[9px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
              Role
            </p>
            <p className="text-xs font-black tracking-tight text-black uppercase dark:text-white">
              {data.currentJob}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="mb-1 font-mono text-[9px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
              Location
            </p>
            <p className="text-xs font-black tracking-tight text-black uppercase dark:text-white">
              {data.location}
            </p>
          </div>
        </div>
      </div>

      {/* description */}
      <div className="border-t-2 border-black pt-6 dark:border-white">
        <p className="text-base leading-relaxed text-black/60 dark:text-white/60">
          {data.description}
        </p>
      </div>
    </motion.section>
  )
}
