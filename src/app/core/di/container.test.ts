// =============================================================================
// DI Container Tests
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { DIContainer, ServiceTokens } from './container'
import type { UserService } from '@/app/domain/services/userService'

// Create a complete mock of UserService
function createMockUserService(): UserService {
  return {
    getById: async () => ({ success: true, data: undefined }),
    getList: async () => ({
      success: true,
      data: { data: [], page: 1, pageSize: 10, total: 0, totalPages: 0 },
    }),
    create: async () => ({ success: true, data: undefined }),
    update: async () => ({ success: true, data: undefined }),
    delete: async () => ({ success: true }),
    isOnline: () => true,
    syncPendingOperations: async () => {},
    clearCache: async () => {},
  } as unknown as UserService
}

describe('DIContainer', () => {
  let container: DIContainer

  beforeEach(() => {
    container = new DIContainer()
  })

  describe('register and resolve', () => {
    it('registers and resolves a service instance', () => {
      const mockService = createMockUserService()

      container.register(ServiceTokens.UserService, mockService)

      const resolved = container.resolve(ServiceTokens.UserService)

      expect(resolved).toBe(mockService)
    })

    it('throws error when resolving unregistered service', () => {
      expect(() => container.resolve(ServiceTokens.UserService)).toThrow(
        'Service not registered: UserService'
      )
    })
  })

  describe('registerFactory', () => {
    it('registers and resolves from factory function', () => {
      const mockService = createMockUserService()

      const factory = () => mockService

      container.registerFactory(ServiceTokens.UserService, factory)

      const resolved = container.resolve(ServiceTokens.UserService)

      expect(resolved).toBe(mockService)
    })

    it('caches instance after first resolve', () => {
      let callCount = 0
      const factory = () => {
        callCount++
        return createMockUserService()
      }

      container.registerFactory(ServiceTokens.UserService, factory)

      // Resolve multiple times
      container.resolve(ServiceTokens.UserService)
      container.resolve(ServiceTokens.UserService)
      container.resolve(ServiceTokens.UserService)

      // Factory should only be called once
      expect(callCount).toBe(1)
    })

    it('returns same instance on multiple resolves', () => {
      const factory = () => createMockUserService()

      container.registerFactory(ServiceTokens.UserService, factory)

      const instance1 = container.resolve(ServiceTokens.UserService)
      const instance2 = container.resolve(ServiceTokens.UserService)

      expect(instance1).toBe(instance2)
    })
  })

  describe('has', () => {
    it('returns true for registered service', () => {
      const mockService = {} as UserService

      container.register(ServiceTokens.UserService, mockService)

      expect(container.has(ServiceTokens.UserService)).toBe(true)
    })

    it('returns true for registered factory', () => {
      container.registerFactory(ServiceTokens.UserService, () => ({}) as UserService)

      expect(container.has(ServiceTokens.UserService)).toBe(true)
    })

    it('returns false for unregistered service', () => {
      expect(container.has(ServiceTokens.UserService)).toBe(false)
    })
  })

  describe('clear', () => {
    it('removes all registered services', () => {
      container.register(ServiceTokens.UserService, {} as UserService)

      container.clear()

      expect(container.has(ServiceTokens.UserService)).toBe(false)
    })

    it('removes all registered factories', () => {
      container.registerFactory(ServiceTokens.UserService, () => ({}) as UserService)

      container.clear()

      expect(container.has(ServiceTokens.UserService)).toBe(false)
    })
  })

  describe('priority', () => {
    it('prefers direct registration over factory', () => {
      const directService = { type: 'direct' } as unknown as UserService
      const factoryService = { type: 'factory' } as unknown as UserService

      container.registerFactory(ServiceTokens.UserService, () => factoryService)
      container.register(ServiceTokens.UserService, directService)

      const resolved = container.resolve(ServiceTokens.UserService) as unknown as { type: string }

      expect(resolved.type).toBe('direct')
    })
  })
})
