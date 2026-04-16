import { useState } from 'react'
import type { BookItem } from '@/src/lib/api'

const STATUS_STYLE: Record<BookItem['status'], string> = {
  reading: 'bg-blue-500 text-white',
  finished: 'bg-[#FFE600] text-black',
  want: 'bg-black/10 text-black dark:bg-white/10 dark:text-white',
}

const STATUS_LABEL: Record<BookItem['status'], string> = {
  reading: 'reading',
  finished: 'read',
  want: 'want',
}

export function BookCollectionCard({ book }: { book: BookItem }) {
  const [imgError, setImgError] = useState(!book.coverUrl)

  return (
    <div className="flex gap-3 border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000] transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0px_#000] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_#fff] dark:hover:shadow-[6px_6px_0px_#fff]">
      {/* Cover */}
      <div className="w-14 shrink-0 overflow-hidden border-2 border-black bg-black dark:border-white">
        {imgError || !book.coverUrl ? (
          <div className="flex h-full min-h-[72px] w-full items-center justify-center p-1">
            <p className="text-center font-mono text-[7px] font-bold text-white/40 uppercase">
              {book.title}
            </p>
          </div>
        ) : (
          <img
            src={book.coverUrl}
            alt={book.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Text */}
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <span
          className={`inline-flex self-start border-2 border-black px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] ${STATUS_STYLE[book.status]}`}
        >
          {STATUS_LABEL[book.status]}
        </span>
        <p className="text-sm leading-snug font-black tracking-tight text-black uppercase dark:text-white">
          {book.title}
        </p>
        <p className="font-mono text-[10px] text-black/50 dark:text-white/50">
          {book.author}
          {book.year && (
            <span className="ml-2 text-black/30 dark:text-white/30">
              {book.year}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
