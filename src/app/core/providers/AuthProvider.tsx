import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { APP_CONSTANTS } from '@core/constants/app.constants'

// =============================================================================
// Types
// =============================================================================

export interface CurrentUser {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'Admin' | 'User' | 'Guest'
  status: 'online' | 'away' | 'busy' | 'offline'
}

interface AuthContextType {
  currentUser: CurrentUser | null
  isAuthenticated: boolean
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<CurrentUser>) => void
}

// =============================================================================
// Mock User Data
// =============================================================================

const MOCK_USER: CurrentUser = {
  id: '1',
  email: 'admin@arcana.io',
  firstName: 'John',
  lastName: 'Doe',
  avatar: 'https://i.pravatar.cc/150?img=8',
  role: 'Admin',
  status: 'online',
}

const MOCK_TOKEN = 'mock-jwt-token-12345'

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextType | null>(null)

// =============================================================================
// Helper Functions
// =============================================================================

function loadStoredAuth(): { user: CurrentUser | null; token: string | null } {
  try {
    const storedToken = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN)
    const storedUser = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.USER)

    if (storedToken && storedUser) {
      return {
        token: storedToken,
        user: JSON.parse(storedUser),
      }
    }
  } catch (error) {
    console.error('Failed to load stored auth:', error)
  }

  return { user: null, token: null }
}

// =============================================================================
// Provider Component
// =============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const { user } = loadStoredAuth()
    return user || MOCK_USER // Auto-login for demo
  })

  const [token, setToken] = useState<string | null>(() => {
    const { token } = loadStoredAuth()
    return token || MOCK_TOKEN // Auto-login for demo
  })

  const isAuthenticated = !!currentUser && !!token

  // Persist auth state
  useEffect(() => {
    if (currentUser && token) {
      localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN, token)
      localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.USER, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.USER)
    }
  }, [currentUser, token])

  const login = useCallback(async (_email: string, _password: string): Promise<void> => {
    // Mock login - in production, this would call an auth API
    await new Promise(resolve => setTimeout(resolve, 500))
    setCurrentUser(MOCK_USER)
    setToken(MOCK_TOKEN)
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    setToken(null)
    localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.USER)
  }, [])

  const updateUser = useCallback((updates: Partial<CurrentUser>) => {
    setCurrentUser(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  const value: AuthContextType = {
    currentUser,
    isAuthenticated,
    token,
    login,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
