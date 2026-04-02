export type BookEntry = {
  isbn: string
  title: string
  author: string
  status: 'reading' | 'finished' | 'want-to-read'
}

export const READING_DATA: BookEntry[] = [
  {
    isbn: '9780743273565',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    status: 'finished',
  },
  {
    isbn: '9780061965012',
    title: 'The Lean Startup',
    author: 'Eric Ries',
    status: 'finished',
  },
  {
    isbn: '9780735224292',
    title: "It Doesn't Have to Be Crazy at Work",
    author: 'Jason Fried & DHH',
    status: 'reading',
  },
  {
    isbn: '9780062316097',
    title: 'The Hard Thing About Hard Things',
    author: 'Ben Horowitz',
    status: 'finished',
  },
  {
    isbn: '9781501156700',
    title: 'Deep Work',
    author: 'Cal Newport',
    status: 'want-to-read',
  },
  {
    isbn: '9780525559474',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    status: 'finished',
  },
]
