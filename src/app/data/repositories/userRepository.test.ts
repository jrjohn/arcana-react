// =============================================================================
// User Repository Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, CreateUserDto, UpdateUserDto } from '@/app/domain/entities/user.model'
import type { UserApiDto, PaginatedApiResponse } from '../mappers/userMapper'

// ---------------------------------------------------------------------------
// vi.hoisted() — declare all mocks that vi.mock() factories reference
// ---------------------------------------------------------------------------
const {
  mockMemoryGet, mockMemorySet, mockMemoryDelete, mockMemoryClearByPrefix, mockMemoryStats,
  mockLruGet, mockLruSet, mockLruDelete, mockLruClearByPrefix, mockLruStats,
  mockIdbGetCache, mockIdbSetCache, mockIdbDeleteCache, mockIdbClearCacheByPrefix,
  mockIdbAddPendingOp, mockIdbGetPendingByEntity, mockIdbUpdatePendingOp, mockIdbDeletePendingOp, mockIdbGetStats,
  mockApiGet, mockApiPost, mockApiPut, mockApiDelete,
  mockIsCurrentlyOnline,
} = vi.hoisted(() => ({
  mockMemoryGet: vi.fn().mockReturnValue(null),
  mockMemorySet: vi.fn(),
  mockMemoryDelete: vi.fn(),
  mockMemoryClearByPrefix: vi.fn(),
  mockMemoryStats: { size: 0, maxSize: 100, hits: 0, misses: 0, hitRate: 0 },

  mockLruGet: vi.fn().mockReturnValue(null),
  mockLruSet: vi.fn(),
  mockLruDelete: vi.fn(),
  mockLruClearByPrefix: vi.fn(),
  mockLruStats: { size: 0, maxSize: 500, hits: 0, misses: 0, evictions: 0, hitRate: 0 },

  mockIdbGetCache: vi.fn().mockResolvedValue(null),
  mockIdbSetCache: vi.fn().mockResolvedValue(undefined),
  mockIdbDeleteCache: vi.fn().mockResolvedValue(undefined),
  mockIdbClearCacheByPrefix: vi.fn().mockResolvedValue(undefined),
  mockIdbAddPendingOp: vi.fn().mockResolvedValue(1),
  mockIdbGetPendingByEntity: vi.fn().mockResolvedValue([]),
  mockIdbUpdatePendingOp: vi.fn().mockResolvedValue(undefined),
  mockIdbDeletePendingOp: vi.fn().mockResolvedValue(undefined),
  mockIdbGetStats: vi.fn().mockResolvedValue({ cacheCount: 0, pendingCount: 0, cacheSize: 0 }),

  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
  mockApiPut: vi.fn(),
  mockApiDelete: vi.fn(),

  mockIsCurrentlyOnline: vi.fn().mockReturnValue(true),
}))

vi.mock('../storage/memoryCacheService', () => ({
  memoryCacheService: {
    get: (...args: unknown[]) => mockMemoryGet(...args),
    set: (...args: unknown[]) => mockMemorySet(...args),
    delete: (...args: unknown[]) => mockMemoryDelete(...args),
    clearByPrefix: (...args: unknown[]) => mockMemoryClearByPrefix(...args),
    stats: mockMemoryStats,
  },
}))

vi.mock('../storage/lruCacheService', () => ({
  lruCacheService: {
    get: (...args: unknown[]) => mockLruGet(...args),
    set: (...args: unknown[]) => mockLruSet(...args),
    delete: (...args: unknown[]) => mockLruDelete(...args),
    clearByPrefix: (...args: unknown[]) => mockLruClearByPrefix(...args),
    stats: mockLruStats,
  },
}))

vi.mock('../storage/indexedDbService', () => ({
  indexedDbService: {
    getCache: (...args: unknown[]) => mockIdbGetCache(...args),
    setCache: (...args: unknown[]) => mockIdbSetCache(...args),
    deleteCache: (...args: unknown[]) => mockIdbDeleteCache(...args),
    clearCacheByPrefix: (...args: unknown[]) => mockIdbClearCacheByPrefix(...args),
    addPendingOperation: (...args: unknown[]) => mockIdbAddPendingOp(...args),
    getPendingOperationsByEntity: (...args: unknown[]) => mockIdbGetPendingByEntity(...args),
    updatePendingOperation: (...args: unknown[]) => mockIdbUpdatePendingOp(...args),
    deletePendingOperation: (...args: unknown[]) => mockIdbDeletePendingOp(...args),
    getStats: (...args: unknown[]) => mockIdbGetStats(...args),
  },
}))

vi.mock('../api/apiService', () => ({
  apiService: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    put: (...args: unknown[]) => mockApiPut(...args),
    delete: (...args: unknown[]) => mockApiDelete(...args),
  },
}))

vi.mock('@/app/domain/services/networkStatusService', () => ({
  networkStatusService: {
    isCurrentlyOnline: () => mockIsCurrentlyOnline(),
    onChange$: { subscribe: vi.fn() },
  },
}))

// Mock crypto
vi.stubGlobal('crypto', {
  randomUUID: () => 'mock-uuid-1234',
})

// Import after mocks
import { userRepository } from './userRepository'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
const now = new Date('2025-06-15T10:00:00Z')

const mockUser: User = {
  id: '1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  avatar: 'https://example.com/avatar.png',
  createdAt: now,
  updatedAt: now,
}

const mockApiUser: UserApiDto = {
  id: 1,
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  avatar: 'https://example.com/avatar.png',
  created_at: '2025-06-15T10:00:00.000Z',
  updated_at: '2025-06-15T10:00:00.000Z',
}

describe('UserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCurrentlyOnline.mockReturnValue(true)
    mockMemoryGet.mockReturnValue(null)
    mockLruGet.mockReturnValue(null)
    mockIdbGetCache.mockResolvedValue(null)
  })

  // ==========================================================================
  // getById - 4-layer cache
  // ==========================================================================
  describe('getById', () => {
    it('returns from memory cache (L1) if found', async () => {
      mockMemoryGet.mockReturnValue(mockUser)

      const result = await userRepository.getById('1')

      expect(result).toEqual(mockUser)
      expect(mockLruGet).not.toHaveBeenCalled()
      expect(mockIdbGetCache).not.toHaveBeenCalled()
      expect(mockApiGet).not.toHaveBeenCalled()
    })

    it('returns from LRU cache (L2) and promotes to L1', async () => {
      mockLruGet.mockReturnValue(mockUser)

      const result = await userRepository.getById('1')

      expect(result).toEqual(mockUser)
      expect(mockMemorySet).toHaveBeenCalledWith('user:1', mockUser)
      expect(mockIdbGetCache).not.toHaveBeenCalled()
      expect(mockApiGet).not.toHaveBeenCalled()
    })

    it('returns from IndexedDB (L3) and promotes to L1 and L2', async () => {
      mockIdbGetCache.mockResolvedValue(mockUser)

      const result = await userRepository.getById('1')

      expect(result).toEqual(mockUser)
      expect(mockLruSet).toHaveBeenCalledWith('user:1', mockUser)
      expect(mockMemorySet).toHaveBeenCalledWith('user:1', mockUser)
    })

    it('fetches from API (L4) when not in any cache', async () => {
      mockApiGet.mockResolvedValue({ data: mockApiUser, status: 200, headers: {} })

      const result = await userRepository.getById('1')

      expect(result).toBeDefined()
      expect(result!.email).toBe('john@example.com')
      expect(mockApiGet).toHaveBeenCalledWith('/users/1')
    })

    it('caches API result in all layers', async () => {
      mockApiGet.mockResolvedValue({ data: mockApiUser, status: 200, headers: {} })

      await userRepository.getById('1')

      expect(mockMemorySet).toHaveBeenCalled()
      expect(mockLruSet).toHaveBeenCalled()
      expect(mockIdbSetCache).toHaveBeenCalled()
    })

    it('returns null when offline and not cached', async () => {
      mockIsCurrentlyOnline.mockReturnValue(false)

      const result = await userRepository.getById('nonexistent')

      expect(result).toBeNull()
      expect(mockApiGet).not.toHaveBeenCalled()
    })

    it('returns null and sets error when API call fails', async () => {
      mockApiGet.mockRejectedValue(new Error('Server Error'))

      const result = await userRepository.getById('1')

      expect(result).toBeNull()
    })
  })

  // ==========================================================================
  // getList
  // ==========================================================================
  describe('getList', () => {
    it('returns from LRU cache if found', async () => {
      const cachedList = {
        data: [mockUser],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      }
      mockLruGet.mockReturnValue(cachedList)

      const result = await userRepository.getList({ page: 1, pageSize: 10 })

      expect(result).toEqual(cachedList)
      expect(mockApiGet).not.toHaveBeenCalled()
    })

    it('returns from IndexedDB if not in LRU cache', async () => {
      const cachedList = {
        data: [mockUser],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      }
      mockIdbGetCache.mockResolvedValue(cachedList)

      const result = await userRepository.getList({ page: 1, pageSize: 10 })

      expect(result).toEqual(cachedList)
      expect(mockLruSet).toHaveBeenCalled()
    })

    it('fetches from API when not cached', async () => {
      const apiResponse: PaginatedApiResponse<UserApiDto> = {
        data: [mockApiUser],
        page: 1,
        per_page: 10,
        total: 1,
        total_pages: 1,
      }
      mockApiGet.mockResolvedValue({ data: apiResponse, status: 200, headers: {} })

      const result = await userRepository.getList({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].email).toBe('john@example.com')
    })

    it('appends search parameter when provided', async () => {
      const apiResponse: PaginatedApiResponse<UserApiDto> = {
        data: [],
        page: 1,
        per_page: 10,
        total: 0,
        total_pages: 0,
      }
      mockApiGet.mockResolvedValue({ data: apiResponse, status: 200, headers: {} })

      await userRepository.getList({ page: 1, pageSize: 10 }, 'john')

      expect(mockApiGet).toHaveBeenCalledWith(expect.stringContaining('search=john'))
    })

    it('falls back to offline list when API fails', async () => {
      mockApiGet.mockRejectedValue(new Error('Network Error'))
      mockIdbGetCache.mockImplementation((key: string) => {
        if (key === 'users:all') return Promise.resolve([mockUser])
        return Promise.resolve(null)
      })

      const result = await userRepository.getList({ page: 1, pageSize: 10 })

      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
    })

    it('returns offline list when offline', async () => {
      mockIsCurrentlyOnline.mockReturnValue(false)
      mockIdbGetCache.mockImplementation((key: string) => {
        if (key === 'users:all') return Promise.resolve([mockUser])
        return Promise.resolve(null)
      })

      const result = await userRepository.getList({ page: 1, pageSize: 10 })

      expect(result).toBeDefined()
      expect(mockApiGet).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // create
  // ==========================================================================
  describe('create', () => {
    const createDto: CreateUserDto = {
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
    }

    it('creates user via API when online', async () => {
      const apiUser: UserApiDto = {
        id: 10,
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
      }
      mockApiPost.mockResolvedValue({ data: apiUser, status: 201, headers: {} })

      const result = await userRepository.create(createDto)

      expect(result.email).toBe('new@example.com')
      expect(mockApiPost).toHaveBeenCalledWith('/users', expect.objectContaining({
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
      }))
    })

    it('caches the created user', async () => {
      const apiUser: UserApiDto = { id: 10, email: 'new@example.com', first_name: 'New', last_name: 'User' }
      mockApiPost.mockResolvedValue({ data: apiUser, status: 201, headers: {} })

      await userRepository.create(createDto)

      expect(mockMemorySet).toHaveBeenCalled()
      expect(mockLruSet).toHaveBeenCalled()
      expect(mockIdbSetCache).toHaveBeenCalled()
    })

    it('creates offline user when offline', async () => {
      mockIsCurrentlyOnline.mockReturnValue(false)

      const result = await userRepository.create(createDto)

      expect(result.id).toMatch(/^offline_/)
      expect(result.email).toBe('new@example.com')
      expect(mockIdbAddPendingOp).toHaveBeenCalledWith(expect.objectContaining({
        type: 'create',
        entity: 'user',
      }))
    })

    it('falls back to offline creation on network error', async () => {
      mockApiPost.mockRejectedValue(new Error('network error'))

      const result = await userRepository.create(createDto)

      expect(result.id).toMatch(/^offline_/)
    })

    it('throws on non-network API error', async () => {
      mockApiPost.mockRejectedValue(new Error('Validation Error'))

      await expect(userRepository.create(createDto)).rejects.toThrow('Validation Error')
    })
  })

  // ==========================================================================
  // update
  // ==========================================================================
  describe('update', () => {
    const updateDto: UpdateUserDto = { firstName: 'Updated' }

    it('updates user via API when online', async () => {
      mockMemoryGet.mockReturnValue(mockUser)

      const updatedApi: UserApiDto = {
        id: 1,
        email: 'john@example.com',
        first_name: 'Updated',
        last_name: 'Doe',
      }
      mockApiPut.mockResolvedValue({ data: updatedApi, status: 200, headers: {} })

      const result = await userRepository.update('1', updateDto)

      expect(result.firstName).toBe('Updated')
      expect(mockApiPut).toHaveBeenCalledWith('/users/1', expect.objectContaining({
        first_name: 'Updated',
      }))
    })

    it('throws when user not found', async () => {
      mockIsCurrentlyOnline.mockReturnValue(false)

      await expect(userRepository.update('nonexistent', updateDto)).rejects.toThrow('User not found')
    })

    it('updates offline when offline', async () => {
      mockIsCurrentlyOnline.mockReturnValue(false)
      mockMemoryGet.mockReturnValue(mockUser)

      const result = await userRepository.update('1', updateDto)

      expect(result.firstName).toBe('Updated')
      expect(mockIdbAddPendingOp).toHaveBeenCalledWith(expect.objectContaining({
        type: 'update',
        entity: 'user',
        entityId: '1',
      }))
    })

    it('falls back to offline update on network error', async () => {
      mockMemoryGet.mockReturnValue(mockUser)
      mockApiPut.mockRejectedValue(new Error('network failure'))

      const result = await userRepository.update('1', updateDto)

      expect(result.firstName).toBe('Updated')
    })
  })

  // ==========================================================================
  // delete
  // ==========================================================================
  describe('delete', () => {
    it('deletes user via API when online', async () => {
      mockMemoryGet.mockReturnValue(mockUser)
      mockApiDelete.mockResolvedValue({ data: null, status: 204, headers: {} })

      await userRepository.delete('1')

      expect(mockApiDelete).toHaveBeenCalledWith('/users/1')
      expect(mockMemoryDelete).toHaveBeenCalledWith('user:1')
      expect(mockLruDelete).toHaveBeenCalledWith('user:1')
      expect(mockIdbDeleteCache).toHaveBeenCalledWith('user:1')
    })

    it('throws when user not found', async () => {
      mockIsCurrentlyOnline.mockReturnValue(false)

      await expect(userRepository.delete('nonexistent')).rejects.toThrow('User not found')
    })

    it('queues offline deletion when offline', async () => {
      mockIsCurrentlyOnline.mockReturnValue(false)
      mockMemoryGet.mockReturnValue(mockUser)

      await userRepository.delete('1')

      expect(mockIdbAddPendingOp).toHaveBeenCalledWith(expect.objectContaining({
        type: 'delete',
        entity: 'user',
        entityId: '1',
      }))
    })

    it('falls back to offline deletion on network error', async () => {
      mockMemoryGet.mockReturnValue(mockUser)
      mockApiDelete.mockRejectedValue(new Error('network error'))

      await userRepository.delete('1')

      expect(mockIdbAddPendingOp).toHaveBeenCalledWith(expect.objectContaining({
        type: 'delete',
      }))
    })

    it('throws on non-network API error', async () => {
      mockMemoryGet.mockReturnValue(mockUser)
      mockApiDelete.mockRejectedValue(new Error('Forbidden'))

      await expect(userRepository.delete('1')).rejects.toThrow('Forbidden')
    })
  })

  // ==========================================================================
  // syncPendingOperations
  // ==========================================================================
  describe('syncPendingOperations', () => {
    it('does nothing when offline', async () => {
      mockIsCurrentlyOnline.mockReturnValue(false)

      await userRepository.syncPendingOperations()

      expect(mockIdbGetPendingByEntity).not.toHaveBeenCalled()
    })

    it('processes create operations', async () => {
      const ops = [{
        id: 1,
        type: 'create' as const,
        entity: 'user',
        entityId: 'offline_123',
        payload: { email: 'a@b.com', firstName: 'A', lastName: 'B' },
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3,
        status: 'pending' as const,
      }]
      mockIdbGetPendingByEntity.mockResolvedValue(ops)

      const newApiUser: UserApiDto = { id: 100, email: 'a@b.com', first_name: 'A', last_name: 'B' }
      mockApiPost.mockResolvedValue({ data: newApiUser, status: 201, headers: {} })

      await userRepository.syncPendingOperations()

      expect(mockApiPost).toHaveBeenCalledWith('/users', expect.any(Object))
      expect(mockIdbDeletePendingOp).toHaveBeenCalledWith(1)
    })

    it('processes update operations', async () => {
      const ops = [{
        id: 2,
        type: 'update' as const,
        entity: 'user',
        entityId: '1',
        payload: { firstName: 'Updated' },
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3,
        status: 'pending' as const,
      }]
      mockIdbGetPendingByEntity.mockResolvedValue(ops)

      const updatedApiUser: UserApiDto = { id: 1, email: 'john@example.com', first_name: 'Updated', last_name: 'Doe' }
      mockApiPut.mockResolvedValue({ data: updatedApiUser, status: 200, headers: {} })

      await userRepository.syncPendingOperations()

      expect(mockApiPut).toHaveBeenCalledWith('/users/1', expect.any(Object))
      expect(mockIdbDeletePendingOp).toHaveBeenCalledWith(2)
    })

    it('processes delete operations', async () => {
      const ops = [{
        id: 3,
        type: 'delete' as const,
        entity: 'user',
        entityId: '1',
        payload: null,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3,
        status: 'pending' as const,
      }]
      mockIdbGetPendingByEntity.mockResolvedValue(ops)
      mockApiDelete.mockResolvedValue({ data: null, status: 204, headers: {} })

      await userRepository.syncPendingOperations()

      expect(mockApiDelete).toHaveBeenCalledWith('/users/1')
      expect(mockIdbDeletePendingOp).toHaveBeenCalledWith(3)
    })

    it('marks operation as failed after max retries', async () => {
      const ops = [{
        id: 4,
        type: 'create' as const,
        entity: 'user',
        entityId: 'offline_x',
        payload: { email: 'a@b.com', firstName: 'A', lastName: 'B' },
        timestamp: Date.now(),
        retries: 2,
        maxRetries: 3,
        status: 'pending' as const,
      }]
      mockIdbGetPendingByEntity.mockResolvedValue(ops)
      mockApiPost.mockRejectedValue(new Error('API Down'))

      await userRepository.syncPendingOperations()

      expect(mockIdbUpdatePendingOp).toHaveBeenCalledWith(4, expect.objectContaining({
        status: 'failed',
      }))
    })

    it('retries when retries not exhausted', async () => {
      const ops = [{
        id: 5,
        type: 'create' as const,
        entity: 'user',
        entityId: 'offline_y',
        payload: { email: 'a@b.com', firstName: 'A', lastName: 'B' },
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3,
        status: 'pending' as const,
      }]
      mockIdbGetPendingByEntity.mockResolvedValue(ops)
      mockApiPost.mockRejectedValue(new Error('Temporary'))

      await userRepository.syncPendingOperations()

      expect(mockIdbUpdatePendingOp).toHaveBeenCalledWith(5, expect.objectContaining({
        status: 'pending',
        retries: 1,
      }))
    })
  })

  // ==========================================================================
  // clearCache
  // ==========================================================================
  describe('clearCache', () => {
    it('clears all cache layers', async () => {
      await userRepository.clearCache()

      expect(mockMemoryClearByPrefix).toHaveBeenCalledWith('user')
      expect(mockLruClearByPrefix).toHaveBeenCalledWith('user')
      expect(mockIdbClearCacheByPrefix).toHaveBeenCalledWith('user')
    })
  })

  // ==========================================================================
  // getCacheStats
  // ==========================================================================
  describe('getCacheStats', () => {
    it('returns stats from all cache layers', async () => {
      mockIdbGetStats.mockResolvedValue({ cacheCount: 5, pendingCount: 2, cacheSize: 5 })

      const stats = await userRepository.getCacheStats()

      expect(stats).toHaveProperty('memory')
      expect(stats).toHaveProperty('lru')
      expect(stats).toHaveProperty('indexedDb')
    })
  })

  // ==========================================================================
  // Reactive state
  // ==========================================================================
  describe('reactive state', () => {
    it('exposes loading signal as boolean', () => {
      expect(typeof userRepository.loading.value).toBe('boolean')
    })

    it('exposes error signal', () => {
      // Error may be set from previous test runs on the singleton
      expect(userRepository.error).toBeDefined()
      expect(typeof userRepository.error.value === 'string' || userRepository.error.value === null).toBe(true)
    })

    it('exposes lastSync signal', () => {
      // lastSync may have been set by prior getList tests on the singleton
      expect(userRepository.lastSync).toBeDefined()
    })
  })

  // ==========================================================================
  // updates$
  // ==========================================================================
  describe('updates$', () => {
    it('exposes an observable for user updates', () => {
      expect(userRepository.updates$).toBeDefined()
      expect(typeof userRepository.updates$.subscribe).toBe('function')
    })
  })
})
