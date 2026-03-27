import { formatDate } from '@/components/util/formatDate'
import Link from 'next/link'

interface Props {
  title: string
  link: string
  date: string
}

export function PostCard({ title, link, date }: Props) {
  return (
    <Link href={link} target="_blank" className="group rounded-xl p-3 -mx-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 block">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-6 gap-y-1">
          <time className="text-sm font-medium text-zinc-400 dark:text-zinc-500 w-24 tabular-nums shrink-0">
            {formatDate(date)}
          </time>
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
            {title}
          </h4>
        </div>
        <div className="opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden sm:block">
          <span className="text-zinc-400">→</span>
        </div>
      </div>
    </Link>
  )
}
