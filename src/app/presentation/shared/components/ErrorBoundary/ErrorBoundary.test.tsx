// =============================================================================
// Error Boundary Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary'

// Suppress console.error for expected errors
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalError
})

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Rendered successfully</div>
}

describe('ErrorBoundary', () => {
  describe('Error Catching', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('catches errors and displays default fallback', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Error:/)).toBeInTheDocument()
      expect(screen.getByText(/Test error message/)).toBeInTheDocument()
    })

    it('calls onError callback when error occurs', () => {
      const onError = vi.fn()

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error message' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      )
    })
  })

  describe('Fallback Rendering', () => {
    it('renders custom fallback ReactNode', () => {
      render(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom fallback')).toBeInTheDocument()
    })

    it('renders custom fallback function with error and reset', () => {
      const fallbackFn = vi.fn((error: Error, reset: () => void) => (
        <div>
          <span>Error: {error.message}</span>
          <button onClick={reset}>Reset</button>
        </div>
      ))

      render(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(fallbackFn).toHaveBeenCalled()
      expect(screen.getByText('Error: Test error message')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
    })
  })

  describe('Error Levels', () => {
    it('renders root level fallback with full page layout', () => {
      render(
        <ErrorBoundary level="root">
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Refresh Page/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
    })

    it('renders layout level fallback with card layout', () => {
      render(
        <ErrorBoundary level="layout">
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Layout Error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })

    it('renders feature level fallback with inline alert', () => {
      render(
        <ErrorBoundary level="feature">
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Test error message/)).toBeInTheDocument()
    })

    it('renders component level fallback (default)', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('Error Recovery', () => {
    it('resets error state when retry button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Rerender with non-throwing component and click retry
      rerender(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      )

      fireEvent.click(screen.getByRole('button', { name: /Retry/i }))

      expect(screen.getByText('Rendered successfully')).toBeInTheDocument()
    })

    it('allows custom reset handler in fallback function', () => {
      let resetCalled = false

      render(
        <ErrorBoundary
          fallback={(_error, reset) => (
            <button
              onClick={() => {
                resetCalled = true
                reset()
              }}
            >
              Custom Reset
            </button>
          )}
        >
          <ThrowingComponent />
        </ErrorBoundary>
      )

      fireEvent.click(screen.getByRole('button', { name: 'Custom Reset' }))
      expect(resetCalled).toBe(true)
    })
  })
})

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowingComponent)

    render(<WrappedComponent />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('passes props to wrapped component', () => {
    function PropsComponent({ message }: { message: string }) {
      return <div>{message}</div>
    }

    const WrappedComponent = withErrorBoundary(PropsComponent)

    render(<WrappedComponent message="Hello World" />)

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('accepts error boundary props', () => {
    const onError = vi.fn()
    const WrappedComponent = withErrorBoundary(ThrowingComponent, {
      onError,
      level: 'feature',
    })

    render(<WrappedComponent />)

    expect(onError).toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('sets correct display name', () => {
    function MyComponent() {
      return <div>Test</div>
    }

    const WrappedComponent = withErrorBoundary(MyComponent)

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(MyComponent)')
  })
})

describe('Development Mode', () => {
  it('shows error details in development mode', () => {
    // import.meta.env.DEV is true in test environment
    render(
      <ErrorBoundary level="root">
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Test error message/)).toBeInTheDocument()
  })
})

describe('Page Refresh', () => {
  it('calls reload when refresh button clicked at root level', () => {
    const reloadMock = vi.fn()
    const originalLocation = window.location

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload: reloadMock },
      writable: true,
    })

    render(
      <ErrorBoundary level="root">
        <ThrowingComponent />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: /Refresh Page/i }))
    expect(reloadMock).toHaveBeenCalled()

    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })
})
