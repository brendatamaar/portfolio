'use client'
import { motion } from 'motion/react'
import { TextEffect } from '@/components/ui/text-effect'
import Link from 'next/link'

import { RESUME_DATA } from '@/data/resume-data'
import { GlobeIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Magnetic } from '@/components/ui/magnetic'

export default function Hero() {
  const data = RESUME_DATA

  return (
    <header className="mb-12 flex items-center justify-between">
      <div className="grid grid-cols-[1fr_auto] items-stretch gap-x-8">
        <Magnetic springOptions={{ bounce: 0.1 }} intensity={0.15}>
          <Avatar className="size-24 max-sm:mt-5 max-sm:hidden max-sm:h-24 max-sm:w-24 ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 transition-transform duration-300">
            <AvatarImage
              alt={data.name}
              src={data.avatarUrl}
              rel="dns-prefetch"
              className="object-cover"
            />
            <AvatarFallback>{data.initials}</AvatarFallback>
          </Avatar>
        </Magnetic>
        <div className="flex h-full flex-col justify-center space-y-4">
          <div className="space-y-1.5">
            <Link
              href="/"
              className="text-2xl font-semibold tracking-tight text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
            >
              {data.name}
            </Link>
            <TextEffect
              as="p"
              preset="fade"
              per="word"
              className="max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium"
              delay={0.2}
            >
              {data.currentJob}
            </TextEffect>
          </div>
          <Magnetic springOptions={{ bounce: 0 }} intensity={0.2}>
            <motion.a
              className="inline-flex w-fit items-center gap-x-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              href={data.locationLink}
              aria-label="Location"
              target="_blank"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
            >
              <GlobeIcon className="size-3.5" />
              {data.location}
            </motion.a>
          </Magnetic>
        </div>
      </div>
    </header>
  )
}
