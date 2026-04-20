import type { BookItem, AlbumItem } from '@/src/lib/api'

export type FeaturedCardProps =
  | { type: 'book'; item: BookItem }
  | { type: 'album'; item: AlbumItem }
