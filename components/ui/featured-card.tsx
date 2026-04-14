import { useState } from 'react'
import type { BookItem, AlbumItem } from '@/src/lib/api'
import { BOOK_STATUS_LABEL, BOOK_STATUS_BADGE } from '@/src/lib/constants'

type FeaturedCardProps =
  | { type: 'book'; item: BookItem }
  | { type: 'album'; item: AlbumItem }

const STATUS_STYLE = BOOK_STATUS_BADGE
const STATUS_LABEL = BOOK_STATUS_LABEL

export function FeaturedCard(props: FeaturedCardProps) {
  const { type, item } = props
  const [imgError, setImgError] = useState(!item.coverUrl)
  const isBook = type === 'book'

  const title = item.title
  const subtitle = isBook
    ? (item as BookItem).author
    : (item as AlbumItem).artist
  const year = item.year

  return (
    <div className="flex flex-col items-center">
      {/* Cover */}
      <div
        className={`overflow-hidden border-2 border-black bg-black shadow-[4px_4px_0px_#000] transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0px_#000] dark:border-white dark:shadow-[4px_4px_0px_#fff] dark:hover:shadow-[6px_6px_0px_#fff] ${
          isBook ? 'h-56 w-40 sm:h-64 sm:w-44' : 'h-48 w-48 sm:h-56 sm:w-56'
        }`}
      >
        {imgError || !item.coverUrl ? (
          <div className="flex h-full w-full items-center justify-center p-3">
            <p className="text-center font-mono text-[9px] font-bold text-white/40 uppercase">
              {title}
            </p>
          </div>
        ) : (
          <img
            src={item.coverUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Text */}
      <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
        {isBook && (
          <span
            className={`inline-flex border-2 border-black px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] ${STATUS_STYLE[(item as BookItem).status]}`}
          >
            {STATUS_LABEL[(item as BookItem).status]}
          </span>
        )}
        <p className="text-lg leading-tight font-black tracking-tight text-black uppercase dark:text-white">
          {title}
        </p>
        <p className="font-mono text-xs text-black/50 dark:text-white/50">
          {subtitle}
          {year && (
            <span className="ml-2 text-black/30 dark:text-white/30">
              {year}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
