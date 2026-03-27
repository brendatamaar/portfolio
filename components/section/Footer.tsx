'use client'
import { TextLoop } from '@/components/ui/text-loop'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-zinc-100 px-2 py-6 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <TextLoop className="text-xs font-medium text-zinc-400 dark:text-zinc-500 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300 cursor-default">
          <span>© {new Date().getFullYear()}</span>
          <span>Redesigned with Next.js</span>
        </TextLoop>
      </div>
    </footer>
  )
}
