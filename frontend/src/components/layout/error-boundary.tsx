import { Component } from "react"
import type { ErrorInfo, ReactNode } from "react"
import { Button } from "../ui/button"

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Render error boundary caught:", error, info.componentStack)
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
        <p className="label-caps">Something went wrong</p>
        <p className="max-w-prose text-md text-ink-2">
          This view failed to render. The rest of the application is unaffected.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
          <Button size="sm" variant="ghost" onClick={() => window.location.assign("/")}>
            Go to start
          </Button>
        </div>
      </div>
    )
  }
}
