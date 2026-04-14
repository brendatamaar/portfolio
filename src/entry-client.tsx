import { StrictMode, Component, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { hydrate } from '@tanstack/react-router/ssr/client'
import { createRouter } from './router'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import './globals.css'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
          <strong>Something went wrong.</strong>
          <pre style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'red' }}>
            {(this.state.error as Error).message}
          </pre>
          <a href="/" style={{ fontSize: '0.75rem' }}>
            ← go home
          </a>
        </div>
      )
    }
    return this.props.children
  }
}

;(async () => {
  const router = createRouter()
  await hydrate(router)

  hydrateRoot(
    document.getElementById('root')!,
    <StrictMode>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </StrictMode>,
    {
      onRecoverableError(error) {
        if (
          error instanceof Error &&
          (error.message.includes('Hydration failed') ||
            error.message.includes('Invariant failed'))
        ) {
          return
        }
        console.error(error)
      },
    },
  )
})()
