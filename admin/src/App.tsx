import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.tsx'
import PostList from './pages/PostList.tsx'
import PostEditor from './pages/PostEditor.tsx'
import CollectionManager from './pages/CollectionManager.tsx'
import ResumeEditor from './pages/ResumeEditor.tsx'
import { api } from './lib/api.ts'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import type { AuthState } from './types/editor'

export default function App() {
  const [auth, setAuth] = useState<AuthState>('checking')

  useEffect(() => {
    api
      .me()
      .then(() => setAuth('authenticated'))
      .catch(() => setAuth('unauthenticated'))
  }, [])

  function Guard({ children }: { children: React.ReactNode }) {
    if (auth === 'checking') return null
    return auth === 'authenticated' ? (
      <>{children}</>
    ) : (
      <Navigate to="/login" replace />
    )
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <Guard>
                <PostList />
              </Guard>
            }
          />
          <Route
            path="/posts/new"
            element={
              <Guard>
                <PostEditor />
              </Guard>
            }
          />
          <Route
            path="/posts/:id"
            element={
              <Guard>
                <PostEditor />
              </Guard>
            }
          />
          <Route
            path="/collection"
            element={
              <Guard>
                <CollectionManager />
              </Guard>
            }
          />
          <Route
            path="/resume"
            element={
              <Guard>
                <ResumeEditor />
              </Guard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
