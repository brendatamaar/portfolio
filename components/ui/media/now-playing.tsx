import { useEffect, useState } from 'react'

import type { Track, NowPlayingState } from './now-playing.types'

// ---- Hook ----

function useNowPlaying(): NowPlayingState {
  const [state, setState] = useState<NowPlayingState>({
    track: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const apiKey = import.meta.env.VITE_LASTFM_API_KEY as string | undefined
    const username = import.meta.env.VITE_LASTFM_USERNAME as string | undefined

    if (!apiKey || !username) {
      setState({ track: null, isLoading: false, error: 'missing_config' })
      return
    }

    const fetchTrack = async () => {
      try {
        const res = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&limit=1`,
        )
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        const tracks = data.recenttracks?.track

        if (!tracks || (Array.isArray(tracks) && tracks.length === 0)) {
          setState({ isLoading: false, track: null, error: null })
          return
        }

        const t = Array.isArray(tracks) ? tracks[0] : tracks

        setState({
          track: {
            name: t.name ?? '—',
            artist: t.artist?.['#text'] ?? '—',
            album: t.album?.['#text'] ?? '',
            imageUrl: t.image?.[3]?.['#text'] ?? '',
            url: t.url ?? '#',
          },
          isLoading: false,
          error: null,
        })
      } catch {
        setState({ track: null, isLoading: false, error: 'fetch_error' })
      }
    }

    fetchTrack()
    const interval = setInterval(fetchTrack, 60_000)
    return () => clearInterval(interval)
  }, [])

  return state
}

// ---- Component ----

export function NowPlaying() {
  const { track, isLoading } = useNowPlaying()

  const className = `block w-full max-w-xl mx-auto border-[3px] border-black dark:border-white bg-[#fcfcfc] dark:bg-[#0f0f0f] rounded-none shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] overflow-hidden transition-all duration-75 block ${
    track
      ? 'hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_#000] dark:hover:shadow-[10px_10px_0px_#fff] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#000] dark:active:shadow-[2px_2px_0px_#fff] cursor-pointer group'
      : ''
  }`

  const content = (
    <>
      <div className="flex h-full w-full flex-col text-black antialiased dark:text-white">
        {/* Color Block Header */}
        <div className="flex items-center justify-between bg-black px-3 py-[6px] text-white dark:bg-white dark:text-black">
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
            {isLoading ? 'SYNCING' : 'LAST SCROBBLE'}
          </span>
          <span className="font-mono text-[11px] font-black tracking-widest">
            LAST.FM
          </span>
        </div>

        {/* Minimalist Body - No Borders */}
        <div className="flex h-[110px]">
          {/* Naked Album Art Block */}
          <div className="relative flex h-full w-[110px] shrink-0 items-center justify-center overflow-hidden bg-[#CCFF00] text-5xl font-black dark:bg-[#CCFF00]">
            {isLoading ? (
              <div className="h-full w-full bg-black/10 dark:bg-black/80" />
            ) : track?.imageUrl ? (
              <img
                src={track.imageUrl}
                alt={track.album}
                className="h-full w-full object-cover opacity-90 contrast-[1.15] grayscale filter transition-all duration-0 group-hover:opacity-100 group-hover:contrast-100 group-hover:grayscale-0"
              />
            ) : (
              <span className="text-black">?</span>
            )}
          </div>

          {/* Clean Track Info Block */}
          <div className="relative flex flex-1 flex-col justify-center overflow-hidden p-[14px]">
            <div className="mt-[-4px] flex w-full flex-col overflow-hidden">
              {isLoading ? (
                <div className="w-full space-y-2.5">
                  <div className="h-5 w-full bg-black dark:bg-white" />
                  <div className="h-3 w-2/3 bg-black/50 dark:bg-white/50" />
                </div>
              ) : track ? (
                <>
                  <h3 className="truncate font-sans text-[22px] leading-[0.95] font-black tracking-tighter text-black uppercase dark:text-white">
                    {track.name}
                  </h3>
                  <p className="mt-1.5 truncate font-mono text-[12px] leading-tight font-bold tracking-tight text-black/70 uppercase dark:text-white/70">
                    {track.artist}
                  </p>
                </>
              ) : (
                <h3 className="font-sans text-xl font-black tracking-tighter text-black uppercase dark:text-white">
                  NO DATA
                </h3>
              )}
            </div>

            {/* Floating Clean Footer */}
            {!isLoading && track && (
              <div className="mt-auto flex w-full items-center justify-between pt-3">
                <div className="truncate pr-2 font-mono text-[9px] font-black tracking-tight text-black/50 uppercase dark:text-white/50">
                  {track.album || 'SINGLE'}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 opacity-80">
                  <svg
                    className="h-3.5 w-3.5 text-black dark:text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                  <span className="font-mono text-[10px] font-black tracking-widest text-black dark:text-white">
                    AUDIO
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )

  if (track) {
    return (
      <a
        href={track.url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    )
  }

  return <div className={className}>{content}</div>
}
