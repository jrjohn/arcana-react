import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'
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
  if (globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.body.classList.toggle('dark-mode', theme === 'dark')
}

// =============================================================================
// Provider Component
// =============================================================================

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: Readonly<ThemeProviderProps>) {
  const [theme, setTheme] = useState<Theme>(loadTheme)

  const isDarkMode = theme === 'dark'

  const updateTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.THEME, newTheme)
    applyTheme(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    updateTheme(isDarkMode ? 'light' : 'dark')
  }, [isDarkMode, updateTheme])

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.THEME)) {
        updateTheme(e.matches ? 'dark' : 'light')
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [updateTheme])

  const value: ThemeContextType = useMemo(() => ({
    theme,
    isDarkMode,
    toggleTheme,
    setTheme: updateTheme,
  }), [theme, isDarkMode, toggleTheme, updateTheme])

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
