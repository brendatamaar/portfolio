import { formatDate } from '@/components/util/formatDate'
import Link from 'next/link'

interface Props {
  title: string
  link: string
  date: string
}

export function PostCard({ title, link, date }: Props) {
  return (
    <div>
      <Link href={link} target="_blank">
        <div className="border-opacity-50 focus:shadow-outline mb-4 grid grid-cols-12 gap-2 border-b py-2 transition duration-150 ease-in-out hover:text-black focus:outline-none dark:hover:text-white">
          <div className="col-span-3 mt-1 text-sm opacity-50">
            {formatDate(date)}
          </div>
          <div className="col-span-8">
            <h4 className="text-zinc-600 dark:text-zinc-400">{title}</h4>
          </div>
          <div className="col-span-1 flex justify-end">
            <span>→</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
