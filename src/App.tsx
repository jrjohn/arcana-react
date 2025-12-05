import { BrowserRouter } from 'react-router-dom'
import { ApplicationRoutes } from './routes'
import { AuthProvider } from '@core/providers/AuthProvider'
import { I18nProvider } from '@core/providers/I18nProvider'
import { ThemeProvider } from '@core/providers/ThemeProvider'
import { DIProvider, container, configureServices } from '@core/di'
import { ErrorBoundary } from '@shared/components/ErrorBoundary/ErrorBoundary'

// Configure DI container at app startup (composition root)
configureServices(container)

/**
 * Root error handler for logging critical errors
 */
function handleRootError(error: Error, errorInfo: React.ErrorInfo): void {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Root Error Boundary caught error:', error)
    console.error('Component stack:', errorInfo.componentStack)
  }

  // In production, this would send to error tracking service
  // e.g., Sentry, LogRocket, etc.
}

export function App() {
  return (
    <ErrorBoundary level="root" onError={handleRootError}>
      <BrowserRouter>
        <DIProvider container={container}>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <ApplicationRoutes />
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </DIProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
