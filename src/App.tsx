import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from './context/LanguageContext'

// Lazy-load pages so each route is a separate chunk
const Home = lazy(() => import('./pages/Home'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Collection = lazy(() => import('./pages/Collection'))

export default function App() {
  return (
    <ThemeProvider
      enableSystem
      attribute="class"
      storageKey="theme"
      defaultTheme="system"
    >
      <LanguageProvider>
        <BrowserRouter>
          {/* Suspense is required by React.lazy; null fallback keeps the layout shift minimal */}
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/collection" element={<Collection />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}
