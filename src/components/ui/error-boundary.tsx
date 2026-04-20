import { Component } from 'react'
import type { ErrorInfo } from 'react'
import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from './error-boundary.types'

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="border-2 border-red-500 p-4 font-mono text-xs text-red-500">
            Something went wrong. Please refresh the page.
          </div>
        )
      )
    }
    return this.props.children
  }
}
