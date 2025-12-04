import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { APP_CONSTANTS } from '@core/constants/app.constants'

// =============================================================================
// Types
// =============================================================================

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  isDarkMode: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

// =============================================================================
// Context
// =============================================================================

const ThemeContext = createContext<ThemeContextType | null>(null)

// =============================================================================
// Helper Functions
// =============================================================================

function loadTheme(): Theme {
  const stored = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.THEME)
  if (stored === 'dark' || stored === 'light') {
    return stored
  }
  // Check system preference
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  document.body.classList.toggle('dark-mode', theme === 'dark')
}

// =============================================================================
// Provider Component
// =============================================================================

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(loadTheme)

  const isDarkMode = theme === 'dark'

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.THEME, newTheme)
    applyTheme(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }, [isDarkMode, setTheme])

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.THEME)) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [setTheme])

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    toggleTheme,
    setTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
