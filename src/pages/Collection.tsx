import { useState, useEffect } from 'react'
import { api } from '@/src/lib/api'
import type { BookItem, AlbumItem } from '@/src/lib/api'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { SectionLabel } from '@/components/ui/section-label'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { Reveal } from '@/components/ui/reveal'
import { BookShelf } from '@/components/ui/book-shelf'
import { VinylShelf } from '@/components/ui/vinyl-shelf'
import { useLang } from '@/src/context/LanguageContext'

export default function Collection() {
  const { t } = useLang()

  const [books, setBooks] = useState<BookItem[]>([])
  const [albums, setAlbums] = useState<AlbumItem[]>([])
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [loadingAlbums, setLoadingAlbums] = useState(true)

  useEffect(() => {
    api
      .getBooks()
      .then(setBooks)
      .catch(console.error)
      .finally(() => setLoadingBooks(false))
    api
      .getAlbums()
      .then(setAlbums)
      .catch(console.error)
      .finally(() => setLoadingAlbums(false))
  }, [])

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Header />

        <div className="mb-12">
          <h1 className="mb-4 text-5xl font-black tracking-tighter text-black uppercase sm:text-7xl dark:text-white">
            {t('collection.heading')}
          </h1>
          <p className="text-base leading-relaxed text-black/60 dark:text-white/60">
            {t('collection.subtitle')}
          </p>
        </div>

        <main className="space-y-20">
          {/* 01 — Bookshelf */}
          <Reveal>
            <section id="books">
              <SectionLabel num="01" label={t('collection.books')} />
              {loadingBooks ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: 3 }, (_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : books.length > 0 ? (
                <BookShelf books={books} />
              ) : (
                <p className="py-4 font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
                  {t('collection.empty')}
                </p>
              )}
            </section>
          </Reveal>

          {/* 02 — Record Crate */}
          <Reveal delay={0.05}>
            <section id="albums">
              <SectionLabel num="02" label={t('collection.albums')} />
              {loadingAlbums ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 2 }, (_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : albums.length > 0 ? (
                <VinylShelf albums={albums} />
              ) : (
                <p className="py-4 font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
                  {t('collection.empty')}
                </p>
              )}
            </section>
          </Reveal>
        </main>

        <Footer />
      </div>
    </div>
  )
}
