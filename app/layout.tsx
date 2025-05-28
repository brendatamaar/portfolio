import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { RESUME_DATA } from '@/data/resume-data'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  title: {
    template: `%s | ${RESUME_DATA.name}`,
    default: `${RESUME_DATA.name}`,
  },
  description: `${RESUME_DATA.description}`,

  authors: [{ name: RESUME_DATA.name, url: RESUME_DATA.personalWebsiteUrl }],
  creator: RESUME_DATA.name,
  publisher: RESUME_DATA.name,

  applicationName: `${RESUME_DATA.name} - Portfolio`,
  keywords: [
    RESUME_DATA.currentJob,
    'portfolio',
    'resume',
    'professional',
    ...RESUME_DATA.skills,
  ],
  category: 'portfolio',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['id_ID'],
    url: RESUME_DATA.personalWebsiteUrl,
    title: `${RESUME_DATA.name}`,
    description: RESUME_DATA.description,
    siteName: `${RESUME_DATA.name} - Portfolio`,
    images: [
      {
        url: `${RESUME_DATA.personalWebsiteUrl}images/preview.png`,
        width: 1200,
        height: 630,
        alt: `${RESUME_DATA.name} - Portfolio`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: `${RESUME_DATA.name}`,
    description: RESUME_DATA.description,
    creator: '@berkelomang',
    images: [`${RESUME_DATA.personalWebsiteUrl}images/preview.png`],
  },

  alternates: {
    canonical: RESUME_DATA.personalWebsiteUrl,
    languages: {
      en: '/en',
      id: '/id',
    },
  },

  appleWebApp: {
    title: `${RESUME_DATA.name} - Portfolio`,
    statusBarStyle: 'black-translucent',
    capable: true,
  },

  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true,
  },
}
const geist = Geist({ variable: '--font-geist', subsets: ['latin'] })

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} bg-white tracking-tight antialiased dark:bg-zinc-950`}
      >
        <ThemeProvider
          enableSystem={true}
          attribute="class"
          storageKey="theme"
          defaultTheme="system"
        >
          {children}
          <SpeedInsights />
        </ThemeProvider>
      </body>
      <Analytics />
    </html>
  )
}
