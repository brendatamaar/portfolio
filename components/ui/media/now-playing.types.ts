export interface Track {
  name: string
  artist: string
  album: string
  imageUrl: string
  url: string
}

export interface NowPlayingState {
  track: Track | null
  isLoading: boolean
  error: string | null
}
