export type BookEntry = {
  isbn?: string
  title: string
  author: string
  status: 'reading' | 'finished' | 'want-to-read' | 'read'
}
