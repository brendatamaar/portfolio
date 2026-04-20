import { useState, useCallback } from 'react'
import { api } from '../../lib/api'
import type { AlbumItem, AlbumSearchResult } from '../../lib/api'
import { CollectionTab } from './shared'

export function AlbumsTab() {
  const [artist, setArtist] = useState('')

  const createFn = useCallback(
    (
      title: string,
      coverUrl: string | null | undefined,
      year: number | null | undefined,
    ) => api.albums.create({ title, artist: artist.trim(), coverUrl, year }),
    [artist],
  )

  const onResultSelect = useCallback((r: AlbumSearchResult) => {
    setArtist(r.artist)
  }, [])

  const onAfterCreate = useCallback(() => {
    setArtist('')
  }, [])

  return (
    <CollectionTab<AlbumItem, AlbumSearchResult>
      searchFn={api.albums.search}
      listFn={api.albums.list}
      featureFn={api.albums.feature}
      deleteFn={api.albums.delete}
      createFn={createFn}
      onAfterCreate={onAfterCreate}
      canSubmit={artist.trim().length > 0}
      searchPlaceholder="Search album title..."
      emptyText="No albums yet."
      coverClass="h-10 w-10"
      onResultSelect={onResultSelect}
      renderDropdownMeta={(r) => <>{r.artist || '—'}</>}
      renderItemMeta={(item) => <>{item.artist}</>}
      extraFormFields={
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
            Artist
          </label>
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist name"
            className="border border-black/20 bg-transparent px-3 py-1.5 text-sm focus:border-black focus:outline-none dark:border-white/20 dark:focus:border-white"
          />
        </div>
      }
    />
  )
}
