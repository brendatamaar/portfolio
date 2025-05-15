'use client'
import { motion } from 'motion/react'
import { TextEffect } from '@/components/ui/text-effect'
import Link from 'next/link'

import { RESUME_DATA } from '@/data/resume-data'
import { XIcon, GlobeIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Hero() {
  const data = RESUME_DATA

  return (
    <header className="mb-9 flex items-center justify-between">
      <div className="grid grid-cols-[1fr_auto] items-stretch gap-x-6">
        <Avatar className="size-20 max-sm:mt-5 max-sm:hidden max-sm:h-20 max-sm:w-20">
          <AvatarImage
            alt={data.name}
            src={data.avatarUrl}
            rel="dns-prefetch"
          />
          <AvatarFallback>{data.initials}</AvatarFallback>
        </Avatar>
        <div className="flex h-full flex-col justify-between self-start">
          <div>
            <Link
              href="/"
              className="text-lg leading-none text-black dark:text-white"
            >
              {data.name}
            </Link>
            <TextEffect
              as="p"
              preset="fade"
              per="char"
              className="text-sm text-zinc-600 dark:text-zinc-500"
              delay={0.5}
            >
              {data.currentJob}
            </TextEffect>
          </div>
          <motion.a
            className="mb-1 inline-flex gap-x-1 text-xs leading-none text-black hover:underline dark:text-white"
            href={data.locationLink}
            aria-label="Location"
            target="_blank"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8, ease: 'easeOut' }}
          >
            <GlobeIcon className="size-3" />
            {data.location}
          </motion.a>
        </div>
      </div>
    </header>
  )
}
