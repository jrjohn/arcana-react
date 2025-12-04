import { BrowserRouter } from 'react-router-dom'
import { ApplicationRoutes } from './routes'
import { AuthProvider } from '@core/providers/AuthProvider'
import { I18nProvider } from '@core/providers/I18nProvider'
import { ThemeProvider } from '@core/providers/ThemeProvider'
import { DIProvider, container, configureServices } from '@core/di'

// Configure DI container at app startup (composition root)
configureServices(container)

export function App() {
  return (
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
  )
}
