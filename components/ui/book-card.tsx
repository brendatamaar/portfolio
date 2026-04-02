import { useState } from 'react'
import type { BookEntry } from '@/data/reading-data'
import { STATUS_LABEL } from '@/lib/constants'

export function BookCard({ book }: { book: BookEntry }) {
  const coverUrl = book.isbn
    ? `https://books.google.com/books/content?vid=ISBN${book.isbn}&printsec=frontcover&img=1&zoom=1`
    : ''
  const [imgError, setImgError] = useState(!book.isbn)

  return (
    <div className="flex gap-3 border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000] transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0px_#000] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_#fff] dark:hover:shadow-[6px_6px_0px_#fff]">
      {/* Cover */}
      <div className="w-14 shrink-0 overflow-hidden border-2 border-black bg-black/5 dark:border-white dark:bg-white/5">
        {imgError ? (
          <div className="flex h-full w-full items-center justify-center p-1">
            <p className="text-center font-mono text-[8px] font-bold text-black/30 uppercase dark:text-white/30">
              {book.title}
            </p>
          </div>
        ) : (
          <img
            src={coverUrl}
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
          className={`inline-flex items-center self-start border-2 border-black px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] ${
            book.status === 'reading'
              ? 'bg-blue-500 text-black'
              : book.status === 'finished'
                ? 'bg-orange-500 text-white'
                : 'bg-black/40 text-white dark:bg-white/40'
          }`}
        >
          {STATUS_LABEL[book.status]}
        </span>

        <p className="text-sm leading-snug font-black tracking-tight text-black uppercase dark:text-white">
          {book.title}
        </p>
        <p className="font-mono text-[10px] text-black/50 dark:text-white/50">
          {book.author}
        </p>
      </div>
    </div>
  )
}
