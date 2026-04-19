import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
          <div className="max-w-md border-2 border-red-500 p-6 font-mono text-sm text-red-500">
            <p className="mb-2 font-bold tracking-widest uppercase">
              Something went wrong
            </p>
            <p className="text-xs opacity-70">{this.state.error.message}</p>
            <button
              className="mt-4 border-2 border-red-500 px-4 py-1 text-xs tracking-widest uppercase hover:bg-red-500 hover:text-white"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
