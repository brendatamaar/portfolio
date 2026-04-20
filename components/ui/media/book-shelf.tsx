import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { BookItem } from '@/src/lib/api'
import { BOOK_STATUS_LABEL, BOOK_STATUS_BADGE } from '@/src/lib/constants'

const STATUS_LABEL = BOOK_STATUS_LABEL
const STATUS_BADGE = BOOK_STATUS_BADGE

const DARK_SPINES = [
  '#1a1a1a',
  '#222',
  '#2d2d2d',
  '#111',
  '#333',
  '#1c1c1c',
  '#242424',
]
const HEIGHTS = [148, 132, 160, 140, 156, 128, 144, 136, 152]

function spineColor(book: BookItem, index: number) {
  if (book.status === 'reading') return { bg: '#FFE600', text: '#000' }
  if (book.status === 'want') return { bg: '#4a4a4a', text: '#bbb' }
  return { bg: DARK_SPINES[index % DARK_SPINES.length], text: '#fff' }
}

function BookSpine({
  book,
  index,
  isSelected,
  onToggle,
}: {
  book: BookItem
  index: number
  isSelected: boolean
  onToggle: () => void
}) {
  const [imgError, setImgError] = useState(!book.coverUrl)
  const h = HEIGHTS[index % HEIGHTS.length]
  const colors = spineColor(book, index)

  return (
    <button
      onClick={onToggle}
      title={book.title}
      className="relative shrink-0 focus-visible:outline-none"
      style={{ width: 38, height: h }}
    >
      <div
        className="absolute inset-0 overflow-hidden transition-all duration-200 ease-out"
        style={{
          backgroundColor: colors.bg,
          border: isSelected ? '2px solid #FFE600' : '2px solid currentColor',
          transform: isSelected ? 'translateY(-16px)' : 'translateY(0)',
          boxShadow: isSelected
            ? '0 8px 16px rgba(0,0,0,0.35), 3px 0 0 #FFE600'
            : '1px 1px 0 rgba(0,0,0,0.25)',
        }}
      >
        {/* Cover as blurred background */}
        {!imgError && book.coverUrl && (
          <img
            src={book.coverUrl}
            alt=""
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: book.status === 'reading' ? 0.25 : 0.45 }}
          />
        )}
        {/* Title — vertical */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-0.5">
          <span
            className="text-[8px] leading-none font-black tracking-wide uppercase"
            style={{
              color: colors.text,
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              maxHeight: h - 10,
              display: 'block',
              overflow: 'hidden',
              textShadow:
                !imgError && book.coverUrl ? '0 0 6px rgba(0,0,0,1)' : 'none',
            }}
          >
            {book.title}
          </span>
        </div>
      </div>
    </button>
  )
}

import type { BookShelfProps } from './book-shelf.types'

export function BookShelf({ books }: BookShelfProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detailImgError, setDetailImgError] = useState(false)

  const selected = books.find((b) => b.id === selectedId) ?? null

  function handleToggle(id: number) {
    if (selectedId !== id) setDetailImgError(false)
    setSelectedId((prev) => (prev === id ? null : id))
  }

  return (
    <div>
      {/* Spine row — overflow-x scrollable, padding-top for lift room */}
      <div className="overflow-x-auto" style={{ paddingTop: 24 }}>
        <div
          className="flex items-end gap-1"
          style={{ minWidth: 'max-content' }}
        >
          {books.map((book, i) => (
            <BookSpine
              key={book.id}
              book={book}
              index={i}
              isSelected={book.id === selectedId}
              onToggle={() => handleToggle(book.id)}
            />
          ))}
        </div>
      </div>

      {/* Shelf plank */}
      <div
        className="border-2 border-t-0 border-black dark:border-white"
        style={{ height: 8, background: 'rgba(0,0,0,0.06)' }}
      />
      <div style={{ height: 3, background: 'rgba(0,0,0,0.12)' }} />

      {/* Hint */}
      {!selected && (
        <p className="mt-3 font-mono text-[9px] tracking-widest text-black/25 uppercase dark:text-white/25">
          click a spine to preview
        </p>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="mt-4 flex gap-4 border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_#fff]"
          >
            {/* Cover */}
            <div className="w-14 shrink-0 overflow-hidden border-2 border-black bg-black dark:border-white">
              {!detailImgError && selected.coverUrl ? (
                <img
                  src={selected.coverUrl}
                  alt={selected.title}
                  className="h-full w-full object-cover"
                  onError={() => setDetailImgError(true)}
                />
              ) : (
                <div className="flex h-full min-h-[72px] w-full items-center justify-center p-1">
                  <p className="text-center font-mono text-[7px] font-bold text-white/30 uppercase">
                    {selected.title}
                  </p>
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex flex-col justify-center gap-1.5">
              <span
                className={`inline-flex self-start border-2 border-black px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] ${STATUS_BADGE[selected.status]}`}
              >
                {STATUS_LABEL[selected.status]}
              </span>
              <p className="text-sm leading-snug font-black tracking-tight text-black uppercase dark:text-white">
                {selected.title}
              </p>
              <p className="font-mono text-[10px] text-black/50 dark:text-white/50">
                {selected.author}
                {selected.year && (
                  <span className="ml-2 text-black/30 dark:text-white/30">
                    {selected.year}
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
