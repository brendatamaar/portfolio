import { StrictMode, Component, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { createRouter } from './router'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import './globals.css'

declare global {
  interface Window {
    __TANSTACK_ROUTER_STATE__: any
  }
}

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

const router = createRouter()

if (window.__TANSTACK_ROUTER_STATE__) {
  router.hydrate(window.__TANSTACK_ROUTER_STATE__)
}

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)
