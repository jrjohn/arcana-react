// =============================================================================
// DI Provider - React Context for Dependency Injection
// =============================================================================
// Provides dependency injection through React Context.
// Components can use hooks to resolve dependencies without direct imports.
// =============================================================================

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { DIContainer, ServiceTokens, type ServiceMap, type ServiceToken } from './container'

// =============================================================================
// Context
// =============================================================================

const DIContext = createContext<DIContainer | null>(null)

// =============================================================================
// Provider Props
// =============================================================================

interface DIProviderProps {
  children: ReactNode
  container: DIContainer
}

// =============================================================================
// DI Provider Component
// =============================================================================

export function DIProvider({ children, container }: DIProviderProps) {
  // Memoize container to prevent unnecessary re-renders
  const value = useMemo(() => container, [container])

  return <DIContext.Provider value={value}>{children}</DIContext.Provider>
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Get the DI container from context
 * @throws Error if used outside DIProvider
 */
export function useDIContainer(): DIContainer {
  const container = useContext(DIContext)

  if (!container) {
    throw new Error('useDIContainer must be used within a DIProvider')
  }

  return container
}

/**
 * Resolve a service from the DI container
 * @param token - The service token to resolve
 * @returns The resolved service instance
 */
export function useService<K extends ServiceToken>(token: K): ServiceMap[K] {
  const container = useDIContainer()
  return useMemo(() => container.resolve(token), [container, token])
}

/**
 * Resolve the UserService from the DI container
 * Convenience hook for the most commonly used service
 */
export function useUserService() {
  return useService(ServiceTokens.UserService)
}
