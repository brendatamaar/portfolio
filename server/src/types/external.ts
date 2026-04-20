export type ItunesResult = {
  collectionName?: string
  artistName?: string
  artworkUrl100?: string
  releaseDate?: string
}

export type GBVolume = {
  volumeInfo?: {
    title?: string
    authors?: string[]
    publishedDate?: string
    industryIdentifiers?: { type: string; identifier: string }[]
    imageLinks?: { thumbnail?: string }
  }
}
