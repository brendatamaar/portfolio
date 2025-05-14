'use client'
import { TextLoop } from '@/components/ui/text-loop'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-zinc-100 px-0 py-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <a href="https://github.com/ibelick/nim" target="_blank">
          <TextLoop className="text-xs text-zinc-500">
            <span>© {new Date().getFullYear()}</span>
            <span>Built with Next.js.</span>
          </TextLoop>
        </a>
      </div>
    </footer>
  )
}
