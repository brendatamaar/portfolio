export type Lang = 'en' | 'id'

export const translations = {
  en: {
    nav: {
      home: 'home',
      writing: 'writing',
      collection: 'collection',
    },
    sections: {
      projects: 'Projects',
      work: 'Work',
      writing: 'Writing',
      reading: 'Reading',
      listening: 'Listening',
      connect: 'Connect',
    },
    blog: {
      heading: 'Writing',
      subtitle: "Occasional writing on what I'm learning.",
      empty: 'Nothing yet — soon.',
      all: 'all',
      back: '← writing',
      backAll: '← all posts',
      loading: 'loading...',
      notFound: 'Post not found.',
    },
    home: {
      showLess: '− show less',
      moreProjects: '+ {n} more projects',
      connect:
        'If you need help building software, designing products, or just want to grab coffee and talk — reach out.',
    },
    post: {
      minRead: 'min read',
    },
    collection: {
      heading: 'Collection',
      subtitle: 'A personal archive of things I genuinely like.',
      books: 'Bookshelf',
      albums: 'Record Crate',
      seeAll: 'see all →',
      empty: 'Nothing yet.',
    },
  },
  id: {
    nav: {
      home: 'beranda',
      writing: 'tulisan',
      collection: 'koleksi',
    },
    sections: {
      projects: 'Proyek',
      work: 'Pengalaman',
      writing: 'Tulisan',
      reading: 'Bacaan',
      listening: 'Musik',
      connect: 'Kontak',
    },
    blog: {
      heading: 'Tulisan',
      subtitle: 'Tulisan sesekali tentang hal yang sedang saya pelajari.',
      empty: 'Belum ada — segera.',
      all: 'semua',
      back: '← tulisan',
      backAll: '← semua tulisan',
      loading: 'memuat...',
      notFound: 'Tulisan tidak ditemukan.',
    },
    home: {
      showLess: '− tampilkan lebih sedikit',
      moreProjects: '+ {n} proyek lainnya',
      connect:
        'Jika kamu membutuhkan bantuan dalam membangun software, merancang produk, atau sekadar ngopi dan ngobrol — hubungi saya.',
    },
    post: {
      minRead: 'menit baca',
    },
    collection: {
      heading: 'Koleksi',
      subtitle: 'Arsip pribadi hal-hal yang benar-benar saya sukai.',
      books: 'Rak Buku',
      albums: 'Koleksi Album',
      seeAll: 'lihat semua →',
      empty: 'Belum ada.',
    },
  },
} as const

type Translations = typeof translations
type LangDict = Translations[Lang]

/** Nested key resolver — supports up to 2-level dot-notation e.g. "blog.heading" */
export function resolveKey(dict: LangDict, key: string): string {
  const parts = key.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = dict
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return key
    cur = cur[p]
  }
  return typeof cur === 'string' ? cur : key
}
