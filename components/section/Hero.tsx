'use client'
import { TextEffect } from '@/components/ui/text-effect'
import Link from 'next/link'

import { RESUME_DATA } from '@/data/resume-data'
import { XIcon, GlobeIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Hero() {
  const data = RESUME_DATA

  return (
    <header className="mb-8 flex items-center justify-between">
      <div className="grid grid-cols-[1fr_auto] items-start gap-x-6">
        <Avatar className="size-20 max-sm:mt-4 max-sm:hidden max-sm:h-20 max-sm:w-20">
          <AvatarImage
            alt={data.name}
            src={data.avatarUrl}
            rel="dns-prefetch"
          />
          <AvatarFallback>{data.initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <Link href="/" className="text-black dark:text-white">
            {data.name}
          </Link>
          <TextEffect
            as="p"
            preset="fade"
            per="char"
            className="text-zinc-600 dark:text-zinc-500"
            delay={0.5}
          >
            {data.currentJob}
          </TextEffect>
          <Link
            className="mt-2 inline-flex gap-x-1 text-xs leading-none text-black hover:underline dark:text-white"
            href={data.locationLink}
            aria-label="Location"
            target="_blank"
          >
            <GlobeIcon className="size-3" />
            {data.location}
          </Link>
        </div>
      </div>
    </header>
  )
}
