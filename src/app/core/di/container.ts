// =============================================================================
// DI Container - Dependency Injection Container
// =============================================================================
// Provides a type-safe dependency injection container for the application.
// Services are registered by interface type and resolved at runtime.
// =============================================================================

import type { UserService } from '@/app/domain/services/userService'

// =============================================================================
// Service Types (Token Keys)
// =============================================================================

export const ServiceTokens = {
  UserService: 'UserService',
} as const

export type ServiceToken = (typeof ServiceTokens)[keyof typeof ServiceTokens]

// =============================================================================
// Service Map Interface
// =============================================================================

export interface ServiceMap {
  [ServiceTokens.UserService]: UserService
}

// =============================================================================
// DI Container Class
// =============================================================================

export class DIContainer {
  private services = new Map<ServiceToken, unknown>()
  private factories = new Map<ServiceToken, () => unknown>()

  /**
   * Register a service instance
   */
  register<K extends ServiceToken>(token: K, instance: ServiceMap[K]): void {
    this.services.set(token, instance)
  }

  /**
   * Register a factory function for lazy instantiation
   */
  registerFactory<K extends ServiceToken>(token: K, factory: () => ServiceMap[K]): void {
    this.factories.set(token, factory)
  }

  /**
   * Resolve a service by token
   */
  resolve<K extends ServiceToken>(token: K): ServiceMap[K] {
    // Check if already instantiated
    if (this.services.has(token)) {
      return this.services.get(token) as ServiceMap[K]
    }

    // Check if factory exists
    if (this.factories.has(token)) {
      const factory = this.factories.get(token)!
      const instance = factory() as ServiceMap[K]
      this.services.set(token, instance) // Cache the instance
      return instance
    }

    throw new Error(`Service not registered: ${token}`)
  }

  /**
   * Check if a service is registered
   */
  has(token: ServiceToken): boolean {
    return this.services.has(token) || this.factories.has(token)
  }

  /**
   * Clear all registered services (useful for testing)
   */
  clear(): void {
    this.services.clear()
    this.factories.clear()
  }
}

// =============================================================================
// Default Container Instance
// =============================================================================

export const container = new DIContainer()
