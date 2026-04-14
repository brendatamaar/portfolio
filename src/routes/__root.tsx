import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/src/context/LanguageContext'

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
    >
      <LanguageProvider>
        <Outlet />
      </LanguageProvider>
    </ThemeProvider>
  )
}

function RootError({ error }: { error: Error }) {
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
