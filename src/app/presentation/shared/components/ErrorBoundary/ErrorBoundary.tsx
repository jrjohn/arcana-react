// =============================================================================
// Error Boundary Component
// =============================================================================
// React Error Boundary for catching and handling component errors gracefully.
// Provides fallback UI and error recovery mechanisms.
// =============================================================================

import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'root' | 'layout' | 'feature' | 'component'
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error)
      console.error('Component stack:', errorInfo.componentStack)
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback, level = 'component' } = this.props

    if (hasError && error) {
      // Custom fallback
      if (typeof fallback === 'function') {
        return fallback(error, this.handleReset)
      }

      if (fallback) {
        return fallback
      }

      // Default fallback based on level
      return <DefaultErrorFallback error={error} level={level} onReset={this.handleReset} />
    }

    return children
  }
}

/**
 * Default Error Fallback Component
 */
interface DefaultErrorFallbackProps {
  error: Error
  level: 'root' | 'layout' | 'feature' | 'component'
  onReset: () => void
}

function DefaultErrorFallback({ error, level, onReset }: DefaultErrorFallbackProps) {
  const isRootLevel = level === 'root'
  const isLayoutLevel = level === 'layout'

  // Root level - full page error
  if (isRootLevel) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center p-5">
          <div className="mb-4">
            <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '4rem' }}></i>
          </div>
          <h1 className="h3 mb-3">Something went wrong</h1>
          <p className="text-muted mb-4">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          {import.meta.env.DEV && (
            <div className="alert alert-secondary text-start mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <strong>Error:</strong> {error.message}
            </div>
          )}
          <div className="d-flex gap-2 justify-content-center">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh Page
            </button>
            <button className="btn btn-outline-secondary" onClick={onReset}>
              <i className="bi bi-arrow-counterclockwise me-2"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Layout level - contained error with navigation
  if (isLayoutLevel) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-danger">
              <div className="card-body text-center py-5">
                <i className="bi bi-exclamation-circle text-danger" style={{ fontSize: '3rem' }}></i>
                <h4 className="mt-3">Layout Error</h4>
                <p className="text-muted">
                  There was a problem loading this section. Please try again.
                </p>
                {import.meta.env.DEV && (
                  <div className="alert alert-secondary text-start mt-3">
                    <small><strong>Error:</strong> {error.message}</small>
                  </div>
                )}
                <button className="btn btn-danger mt-3" onClick={onReset}>
                  <i className="bi bi-arrow-counterclockwise me-2"></i>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Feature/Component level - inline error
  return (
    <div className="alert alert-danger d-flex align-items-center" role="alert">
      <i className="bi bi-exclamation-triangle-fill me-2"></i>
      <div className="flex-grow-1">
        <strong>Error:</strong> {error.message || 'Something went wrong'}
      </div>
      <button className="btn btn-sm btn-outline-danger ms-3" onClick={onReset}>
        <i className="bi bi-arrow-counterclockwise me-1"></i>
        Retry
      </button>
    </div>
  )
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`

  return ComponentWithErrorBoundary
}

/**
 * Hook for programmatically throwing errors to be caught by ErrorBoundary
 */
export function useErrorHandler(): (error: Error) => void {
  return (error: Error) => {
    throw error
  }
}
