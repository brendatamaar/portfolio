import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { api } from '@/src/lib/api'
import type { BookItem, AlbumItem } from '@/src/lib/api'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { SectionLabel } from '@/components/ui/layout/section-label'
import { Reveal } from '@/components/ui/text/reveal'
import { BookShelf } from '@/components/ui/media/book-shelf'
import { VinylShelf } from '@/components/ui/media/vinyl-shelf'
import { useLang } from '@/src/context/LanguageContext'

export const Route = createFileRoute('/collection')({
  loader: async () => {
    const [books, albums] = await Promise.all([
      api.getBooks().catch(() => [] as BookItem[]),
      api.getAlbums().catch(() => [] as AlbumItem[]),
    ])
    return { books, albums }
  },
  component: CollectionPage,
})

function CollectionPage() {
  const { books, albums } = Route.useLoaderData() as {
    books: BookItem[]
    albums: AlbumItem[]
  }
  const { t } = useLang()

  // Handle hash navigation for anchor links from home page
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
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
          <Reveal>
            <section id="books">
              <SectionLabel num="01" label={t('collection.books')} />
              {books.length > 0 ? (
                <BookShelf books={books} />
              ) : (
                <p className="py-4 font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
                  {t('collection.empty')}
                </p>
              )}
            </section>
          </Reveal>

          <Reveal delay={0.05}>
            <section id="albums">
              <SectionLabel num="02" label={t('collection.albums')} />
              {albums.length > 0 ? (
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
