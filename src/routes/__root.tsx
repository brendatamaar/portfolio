import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/src/context/LanguageContext'
import type { RootErrorProps } from './__root.types'

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootError,
})

function RootLayout() {
  return (
    <ThemeProvider
      enableSystem
      attribute="class"
      storageKey="theme"
      defaultTheme="system"
      disableTransitionOnChange
    >
      <LanguageProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:border-2 focus:border-black focus:bg-[#FFE600] focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:font-bold focus:tracking-widest focus:text-black focus:uppercase"
        >
          Skip to main content
        </a>
        <Outlet />
      </LanguageProvider>
    </ThemeProvider>
  )
}

function RootError({ error }: RootErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
      <div className="mx-auto max-w-md px-6 text-center">
        <p className="mb-4 font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
          Something went wrong
        </p>
        <p className="mb-6 font-mono text-xs text-black/60 dark:text-white/60">
          {error.message}
        </p>
        <a
          href="/"
          className="font-mono text-[11px] font-bold tracking-widest text-black uppercase hover:underline dark:text-white"
        >
          ← go home
        </a>
      </div>
    </div>
  )
}
