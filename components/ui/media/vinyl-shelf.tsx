import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { AlbumItem } from '@/src/lib/api'

const DISC_SIZE = 36
const DARK_SLEEVES = [
  '#1a1a1a',
  '#222',
  '#2d2d2d',
  '#111',
  '#303030',
  '#1c1c1c',
  '#252525',
]
const SLEEVE_HEIGHTS = [108, 92, 120, 100, 114, 88, 106, 96]

function VinylSpine({
  album,
  index,
  isSelected,
  onToggle,
}: {
  album: AlbumItem
  index: number
  isSelected: boolean
  onToggle: () => void
}) {
  const [imgError, setImgError] = useState(!album.coverUrl)
  const sleeveH = SLEEVE_HEIGHTS[index % SLEEVE_HEIGHTS.length]
  const sleeveBg = DARK_SLEEVES[index % DARK_SLEEVES.length]

  return (
    <button
      onClick={onToggle}
      title={album.title}
      className="relative shrink-0 focus-visible:outline-none"
      style={{ width: DISC_SIZE }}
    >
      <div
        className="transition-all duration-200 ease-out"
        style={{
          transform: isSelected ? 'translateY(-16px)' : 'translateY(0)',
        }}
      >
        {/* Vinyl disc peeking above sleeve */}
        <div
          className="relative rounded-full"
          style={{
            width: DISC_SIZE,
            height: DISC_SIZE,
            background:
              'repeating-radial-gradient(circle at center, #0b0b0b 0px, #0b0b0b 3px, #1e1e1e 3px, #1e1e1e 6px)',
            border: isSelected
              ? '2px solid #FFE600'
              : '2px solid rgba(255,255,255,0.12)',
            boxShadow: isSelected ? '0 0 0 1px #FFE600' : 'none',
          }}
        >
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex items-center justify-center rounded-full bg-[#FFE600]"
              style={{ width: '32%', height: '32%' }}
            >
              {/* Spindle hole */}
              <div
                className="rounded-full bg-black"
                style={{ width: '35%', height: '35%' }}
              />
            </div>
          </div>
        </div>

        {/* Sleeve body */}
        <div
          className="relative overflow-hidden"
          style={{
            width: DISC_SIZE,
            height: sleeveH,
            backgroundColor: sleeveBg,
            border: isSelected
              ? '2px solid #FFE600'
              : '2px solid rgba(255,255,255,0.08)',
            marginTop: 2,
            boxShadow: isSelected
              ? '2px 2px 0 #FFE600'
              : '1px 1px 0 rgba(0,0,0,0.4)',
          }}
        >
          {/* Cover art as sleeve fill */}
          {!imgError && album.coverUrl && (
            <img
              src={album.coverUrl}
              alt=""
              onError={() => setImgError(true)}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ opacity: 0.5 }}
            />
          )}
          {/* Album title — vertical */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-0.5">
            <span
              className="text-[7px] leading-none font-black tracking-wide uppercase"
              style={{
                color: '#fff',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
                maxHeight: sleeveH - 8,
                display: 'block',
                overflow: 'hidden',
                textShadow:
                  !imgError && album.coverUrl
                    ? '0 0 6px rgba(0,0,0,1)'
                    : 'none',
              }}
            >
              {album.title}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

export function VinylShelf({ albums }: { albums: AlbumItem[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detailImgError, setDetailImgError] = useState(false)

  const selected = albums.find((a) => a.id === selectedId) ?? null

  function handleToggle(id: number) {
    if (selectedId !== id) setDetailImgError(false)
    setSelectedId((prev) => (prev === id ? null : id))
  }

  return (
    <div>
      {/* Record row */}
      <div className="overflow-x-auto" style={{ paddingTop: 24 }}>
        <div
          className="flex items-end gap-1"
          style={{ minWidth: 'max-content' }}
        >
          {albums.map((album, i) => (
            <VinylSpine
              key={album.id}
              album={album}
              index={i}
              isSelected={album.id === selectedId}
              onToggle={() => handleToggle(album.id)}
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
          click a record to preview
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
            {/* Square cover */}
            <div className="h-16 w-16 shrink-0 overflow-hidden border-2 border-black bg-black dark:border-white">
              {!detailImgError && selected.coverUrl ? (
                <img
                  src={selected.coverUrl}
                  alt={selected.title}
                  className="h-full w-full object-cover"
                  onError={() => setDetailImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-1">
                  <p className="text-center font-mono text-[7px] font-bold text-white/30 uppercase">
                    {selected.title}
                  </p>
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex flex-col justify-center gap-1.5">
              <p className="text-sm leading-snug font-black tracking-tight text-black uppercase dark:text-white">
                {selected.title}
              </p>
              <p className="font-mono text-[10px] text-black/50 dark:text-white/50">
                {selected.artist}
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
