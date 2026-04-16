import { useState } from 'react'
import type { AlbumItem } from '@/src/lib/api'

export function AlbumCard({ album }: { album: AlbumItem }) {
  const [imgError, setImgError] = useState(!album.coverUrl)

  return (
    <div className="flex gap-3 border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000] transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0px_#000] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_#fff] dark:hover:shadow-[6px_6px_0px_#fff]">
      {/* Cover */}
      <div className="h-14 w-14 shrink-0 overflow-hidden border-2 border-black bg-black dark:border-white">
        {imgError || !album.coverUrl ? (
          <div className="flex h-full w-full items-center justify-center p-1">
            <p className="text-center font-mono text-[7px] font-bold text-white/40 uppercase">
              {album.title}
            </p>
          </div>
        ) : (
          <img
            src={album.coverUrl}
            alt={album.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Text */}
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <p className="text-sm leading-snug font-black tracking-tight text-black uppercase dark:text-white">
          {album.title}
        </p>
        <p className="font-mono text-[10px] text-black/50 dark:text-white/50">
          {album.artist}
          {album.year && (
            <span className="ml-2 text-black/30 dark:text-white/30">
              {album.year}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
