export interface BookItem {
  id: number
  title: string
  author: string
  status: 'reading' | 'finished' | 'want'
  year: number | null
  coverUrl: string | null
  featured: boolean
  createdAt: string
}

export interface AlbumItem {
  id: number
  title: string
  artist: string
  year: number | null
  coverUrl: string | null
  featured: boolean
  createdAt: string
}
