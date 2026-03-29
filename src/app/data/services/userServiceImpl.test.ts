// =============================================================================
// User Service Implementation Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, PaginatedResponse } from '@/app/domain/entities/user.model'

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const mockRepoGetById = vi.fn()
const mockRepoGetList = vi.fn()
const mockRepoCreate = vi.fn()
const mockRepoUpdate = vi.fn()
const mockRepoDelete = vi.fn()
const mockRepoSyncPending = vi.fn().mockResolvedValue(undefined)
const mockRepoClearCache = vi.fn().mockResolvedValue(undefined)

vi.mock('@/app/data/repositories/userRepository', () => ({
  userRepository: {
    getById: (...args: unknown[]) => mockRepoGetById(...args),
    getList: (...args: unknown[]) => mockRepoGetList(...args),
    create: (...args: unknown[]) => mockRepoCreate(...args),
    update: (...args: unknown[]) => mockRepoUpdate(...args),
    delete: (...args: unknown[]) => mockRepoDelete(...args),
    syncPendingOperations: (...args: unknown[]) => mockRepoSyncPending(...args),
    clearCache: (...args: unknown[]) => mockRepoClearCache(...args),
  },
}))

const mockIsCurrentlyOnline = vi.fn().mockReturnValue(true)

vi.mock('@/app/domain/services/networkStatusService', () => ({
  networkStatusService: {
    isCurrentlyOnline: () => mockIsCurrentlyOnline(),
    onChange$: { subscribe: vi.fn() },
  },
}))

// Import after mocks
import { userService } from './impl/userServiceImpl'

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

describe('UserServiceImpl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCurrentlyOnline.mockReturnValue(true)
  })

  // ==========================================================================
  // getById
  // ==========================================================================
  describe('getById', () => {
    it('returns success result when user found', async () => {
      mockRepoGetById.mockResolvedValue(mockUser)

      const result = await userService.getById('1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
    })

    it('returns failure when user not found', async () => {
      mockRepoGetById.mockResolvedValue(null)

      const result = await userService.getById('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })

    it('returns failure on repository error', async () => {
      mockRepoGetById.mockRejectedValue(new Error('DB Error'))

      const result = await userService.getById('1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('DB Error')
    })

    it('handles non-Error exception', async () => {
      mockRepoGetById.mockRejectedValue('string error')

      const result = await userService.getById('1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('An unknown error occurred')
    })
  })

  // ==========================================================================
  // getList
  // ==========================================================================
  describe('getList', () => {
    it('returns success with paginated data', async () => {
      const paginatedResult: PaginatedResponse<User> = {
        data: [mockUser],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      }
      mockRepoGetList.mockResolvedValue(paginatedResult)

      const result = await userService.getList({ page: 1, pageSize: 10 })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(paginatedResult)
    })

    it('passes search parameter to repository', async () => {
      const paginatedResult: PaginatedResponse<User> = {
        data: [],
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      }
      mockRepoGetList.mockResolvedValue(paginatedResult)

      await userService.getList({ page: 1, pageSize: 10 }, 'john')

      expect(mockRepoGetList).toHaveBeenCalledWith({ page: 1, pageSize: 10 }, 'john')
    })

    it('returns failure on error', async () => {
      mockRepoGetList.mockRejectedValue(new Error('Fetch failed'))

      const result = await userService.getList({ page: 1, pageSize: 10 })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Fetch failed')
    })
  })

  // ==========================================================================
  // create
  // ==========================================================================
  describe('create', () => {
    const createDto = {
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
    }

    it('returns success with created user', async () => {
      const createdUser: User = { ...mockUser, id: '10', email: 'new@example.com', firstName: 'New', lastName: 'User' }
      mockRepoCreate.mockResolvedValue(createdUser)

      const result = await userService.create(createDto)

      expect(result.success).toBe(true)
      expect(result.data!.email).toBe('new@example.com')
    })

    it('returns failure on create error', async () => {
      mockRepoCreate.mockRejectedValue(new Error('Validation failed'))

      const result = await userService.create(createDto)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
    })
  })

  // ==========================================================================
  // update
  // ==========================================================================
  describe('update', () => {
    const updateDto = { firstName: 'Updated' }

    it('returns success with updated user', async () => {
      const updatedUser: User = { ...mockUser, firstName: 'Updated' }
      mockRepoUpdate.mockResolvedValue(updatedUser)

      const result = await userService.update('1', updateDto)

      expect(result.success).toBe(true)
      expect(result.data!.firstName).toBe('Updated')
    })

    it('returns failure on update error', async () => {
      mockRepoUpdate.mockRejectedValue(new Error('Not found'))

      const result = await userService.update('1', updateDto)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not found')
    })
  })

  // ==========================================================================
  // delete
  // ==========================================================================
  describe('delete', () => {
    it('returns success on successful delete', async () => {
      mockRepoDelete.mockResolvedValue(undefined)

      const result = await userService.delete('1')

      expect(result.success).toBe(true)
    })

    it('returns failure on delete error', async () => {
      mockRepoDelete.mockRejectedValue(new Error('User not found'))

      const result = await userService.delete('1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })
  })

  // ==========================================================================
  // isOnline
  // ==========================================================================
  describe('isOnline', () => {
    it('returns true when network is online', () => {
      mockIsCurrentlyOnline.mockReturnValue(true)

      expect(userService.isOnline()).toBe(true)
    })

    it('returns false when network is offline', () => {
      mockIsCurrentlyOnline.mockReturnValue(false)

      expect(userService.isOnline()).toBe(false)
    })
  })

  // ==========================================================================
  // syncPendingOperations
  // ==========================================================================
  describe('syncPendingOperations', () => {
    it('delegates to repository', async () => {
      await userService.syncPendingOperations()

      expect(mockRepoSyncPending).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // clearCache
  // ==========================================================================
  describe('clearCache', () => {
    it('delegates to repository', async () => {
      await userService.clearCache()

      expect(mockRepoClearCache).toHaveBeenCalled()
    })
  })
})
