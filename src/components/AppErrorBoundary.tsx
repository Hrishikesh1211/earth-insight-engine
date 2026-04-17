import { Component, type ErrorInfo, type ReactNode } from 'react'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  error: Error | null
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Earth Insight Engine runtime error:', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="app-error" role="alert">
          <h1>Earth Insight Engine could not finish loading.</h1>
          <p>
            Reload the page. If the issue continues, open the browser console and
            check the runtime error details.
          </p>
          <pre>{this.state.error.message}</pre>
        </main>
      )
    }

    return this.props.children
  }
}
