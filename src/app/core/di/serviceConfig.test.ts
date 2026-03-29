// =============================================================================
// Service Configuration Tests
// =============================================================================

import { describe, it, expect, vi } from 'vitest'
import { DIContainer, ServiceTokens } from './container'
import { configureServices, configureTestServices } from './serviceConfig'
import type { UserService } from '@/app/domain/services/userService'

// Mock the real userServiceImpl to avoid real HTTP calls in unit tests
vi.mock('@/app/data/services/userServiceImpl', () => ({
  userService: {
    getById: vi.fn(),
    getList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    isOnline: vi.fn().mockReturnValue(true),
    syncPendingOperations: vi.fn(),
    clearCache: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockUserService(overrides: Partial<UserService> = {}): UserService {
  return {
    getById: vi.fn(),
    getList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    isOnline: vi.fn().mockReturnValue(true),
    syncPendingOperations: vi.fn(),
    clearCache: vi.fn(),
    ...overrides,
  } as unknown as UserService
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('configureServices', () => {
  it('registers UserService in the container', () => {
    const container = new DIContainer()
    configureServices(container)
    const svc = container.resolve(ServiceTokens.UserService)
    expect(svc).toBeDefined()
  })

  it('allows resolving UserService after configuration', () => {
    const container = new DIContainer()
    configureServices(container)
    const svc = container.resolve(ServiceTokens.UserService)
    expect(typeof svc.isOnline).toBe('function')
  })
})

describe('configureTestServices', () => {
  it('registers real userService when no mocks provided', () => {
    const container = new DIContainer()
    configureTestServices(container)
    const svc = container.resolve(ServiceTokens.UserService)
    expect(svc).toBeDefined()
  })

  it('registers the provided mock userService', () => {
    const container = new DIContainer()
    const mockSvc = makeMockUserService({ isOnline: vi.fn().mockReturnValue(false) })
    configureTestServices(container, { userService: mockSvc })
    const resolved = container.resolve(ServiceTokens.UserService)
    expect(resolved.isOnline()).toBe(false)
  })

  it('falls back to real implementation for unprovided mocks', () => {
    const container = new DIContainer()
    configureTestServices(container, {})
    const svc = container.resolve(ServiceTokens.UserService)
    expect(svc).toBeDefined()
  })
})
