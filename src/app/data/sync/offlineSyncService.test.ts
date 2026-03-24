// =============================================================================
// Offline Sync Service Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PendingOperation } from '../storage/indexedDbService'

// ---------------------------------------------------------------------------
// Use vi.hoisted() for all mock functions referenced in vi.mock() factories
// ---------------------------------------------------------------------------
const {
  mockGetPendingOperations,
  mockGetPendingCount,
  mockUpdatePendingOperation,
  mockDeletePendingOperation,
  mockCleanupOldOperations,
  mockIsCurrentlyOnline,
  mockNetworkSubscribe,
} = vi.hoisted(() => ({
  mockGetPendingOperations: vi.fn().mockResolvedValue([]),
  mockGetPendingCount: vi.fn().mockResolvedValue(0),
  mockUpdatePendingOperation: vi.fn().mockResolvedValue(undefined),
  mockDeletePendingOperation: vi.fn().mockResolvedValue(undefined),
  mockCleanupOldOperations: vi.fn().mockResolvedValue(0),
  mockIsCurrentlyOnline: vi.fn().mockReturnValue(true),
  mockNetworkSubscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
}))

vi.mock('../storage/indexedDbService', () => ({
  indexedDbService: {
    getPendingOperations: (...args: unknown[]) => mockGetPendingOperations(...args),
    getPendingCount: (...args: unknown[]) => mockGetPendingCount(...args),
    updatePendingOperation: (...args: unknown[]) => mockUpdatePendingOperation(...args),
    deletePendingOperation: (...args: unknown[]) => mockDeletePendingOperation(...args),
    cleanupOldOperations: (...args: unknown[]) => mockCleanupOldOperations(...args),
  },
}))

vi.mock('@/app/domain/services/networkStatusService', () => ({
  networkStatusService: {
    isCurrentlyOnline: () => mockIsCurrentlyOnline(),
    onChange$: { subscribe: mockNetworkSubscribe },
  },
}))

// Mock rxjs interval to avoid real timers
vi.mock('rxjs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('rxjs')>()
  return {
    ...actual,
    interval: vi.fn().mockReturnValue({
      pipe: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      }),
    }),
  }
})

// Import after mocks - the singleton is created at import time
import { offlineSyncService, SyncStatus } from './offlineSyncService'

describe('OfflineSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCurrentlyOnline.mockReturnValue(true)
    mockGetPendingOperations.mockResolvedValue([])
    mockGetPendingCount.mockResolvedValue(0)
    // Reset the service state
    offlineSyncService.resetStats()
  })

  // ==========================================================================
  // SyncStatus constants
  // ==========================================================================
  describe('SyncStatus constants', () => {
    it('has correct status values', () => {
      expect(SyncStatus.IDLE).toBe('idle')
      expect(SyncStatus.SYNCING).toBe('syncing')
      expect(SyncStatus.SUCCESS).toBe('success')
      expect(SyncStatus.FAILED).toBe('failed')
    })
  })

  // ==========================================================================
  // Sync operations
  // ==========================================================================
  describe('sync', () => {
    it('does not sync when offline', async () => {
      mockIsCurrentlyOnline.mockReturnValue(false)

      await offlineSyncService.sync()

      expect(mockGetPendingOperations).not.toHaveBeenCalled()
    })

    it('fetches and processes pending operations when online', async () => {
      const ops: PendingOperation[] = [
        {
          id: 1,
          type: 'create',
          entity: 'user',
          entityId: 'u1',
          payload: { name: 'Test' },
          timestamp: Date.now(),
          retries: 0,
          maxRetries: 3,
          status: 'pending',
        },
      ]
      mockGetPendingOperations.mockResolvedValue(ops)

      const mockCreate = vi.fn().mockResolvedValue(undefined)
      offlineSyncService.registerHandler('user', {
        create: mockCreate,
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      })

      await offlineSyncService.sync()

      expect(mockUpdatePendingOperation).toHaveBeenCalledWith(1, { status: 'processing' })
      expect(mockCreate).toHaveBeenCalledWith(ops[0])
      expect(mockDeletePendingOperation).toHaveBeenCalledWith(1)
    })

    it('calls update handler for update operations', async () => {
      const ops: PendingOperation[] = [
        {
          id: 2,
          type: 'update',
          entity: 'user',
          entityId: 'u1',
          payload: { name: 'Updated' },
          timestamp: Date.now(),
          retries: 0,
          maxRetries: 3,
          status: 'pending',
        },
      ]
      mockGetPendingOperations.mockResolvedValue(ops)

      const mockUpdate = vi.fn().mockResolvedValue(undefined)
      offlineSyncService.registerHandler('user', {
        create: vi.fn(),
        update: mockUpdate,
        delete: vi.fn(),
      })

      await offlineSyncService.sync()

      expect(mockUpdate).toHaveBeenCalledWith(ops[0])
    })

    it('calls delete handler for delete operations', async () => {
      const ops: PendingOperation[] = [
        {
          id: 3,
          type: 'delete',
          entity: 'user',
          entityId: 'u1',
          payload: null,
          timestamp: Date.now(),
          retries: 0,
          maxRetries: 3,
          status: 'pending',
        },
      ]
      mockGetPendingOperations.mockResolvedValue(ops)

      const mockDelete = vi.fn().mockResolvedValue(undefined)
      offlineSyncService.registerHandler('user', {
        create: vi.fn(),
        update: vi.fn(),
        delete: mockDelete,
      })

      await offlineSyncService.sync()

      expect(mockDelete).toHaveBeenCalledWith(ops[0])
    })

    it('skips operations with no registered handler', async () => {
      const ops: PendingOperation[] = [
        {
          id: 4,
          type: 'create',
          entity: 'unknown_entity',
          entityId: 'x1',
          payload: null,
          timestamp: Date.now(),
          retries: 0,
          maxRetries: 3,
          status: 'pending',
        },
      ]
      mockGetPendingOperations.mockResolvedValue(ops)

      await offlineSyncService.sync()

      expect(mockDeletePendingOperation).not.toHaveBeenCalled()
    })

    it('marks operation as failed after max retries', async () => {
      const ops: PendingOperation[] = [
        {
          id: 5,
          type: 'create',
          entity: 'user',
          entityId: 'u1',
          payload: null,
          timestamp: Date.now(),
          retries: 2,
          maxRetries: 3,
          status: 'pending',
        },
      ]
      mockGetPendingOperations.mockResolvedValue(ops)

      offlineSyncService.registerHandler('user', {
        create: vi.fn().mockRejectedValue(new Error('API Error')),
        update: vi.fn(),
        delete: vi.fn(),
      })

      await offlineSyncService.sync()

      expect(mockUpdatePendingOperation).toHaveBeenCalledWith(5, expect.objectContaining({
        status: 'failed',
        retries: 3,
        error: 'API Error',
      }))
    })

    it('retries operation when retries not exhausted', async () => {
      const ops: PendingOperation[] = [
        {
          id: 6,
          type: 'create',
          entity: 'user',
          entityId: 'u1',
          payload: null,
          timestamp: Date.now(),
          retries: 0,
          maxRetries: 3,
          status: 'pending',
        },
      ]
      mockGetPendingOperations.mockResolvedValue(ops)

      offlineSyncService.registerHandler('user', {
        create: vi.fn().mockRejectedValue(new Error('Temporary Error')),
        update: vi.fn(),
        delete: vi.fn(),
      })

      await offlineSyncService.sync()

      expect(mockUpdatePendingOperation).toHaveBeenCalledWith(6, expect.objectContaining({
        status: 'pending',
        retries: 1,
      }))
    })
  })

  // ==========================================================================
  // Handler registration
  // ==========================================================================
  describe('registerHandler', () => {
    it('registers handlers for an entity type', () => {
      const handlers = {
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      }

      expect(() => offlineSyncService.registerHandler('product', handlers)).not.toThrow()
    })
  })

  // ==========================================================================
  // Stats
  // ==========================================================================
  describe('getStats', () => {
    it('returns current sync statistics', () => {
      const stats = offlineSyncService.getStats()

      expect(stats).toHaveProperty('pendingCount')
      expect(stats).toHaveProperty('syncedCount')
      expect(stats).toHaveProperty('failedCount')
      expect(stats).toHaveProperty('lastSyncTime')
    })
  })

  describe('resetStats', () => {
    it('resets counters to zero', () => {
      offlineSyncService.resetStats()

      const stats = offlineSyncService.getStats()
      expect(stats.syncedCount).toBe(0)
      expect(stats.failedCount).toBe(0)
    })
  })

  // ==========================================================================
  // clearFailed
  // ==========================================================================
  describe('clearFailed', () => {
    it('calls cleanupOldOperations with 0 maxAge', async () => {
      await offlineSyncService.clearFailed()

      expect(mockCleanupOldOperations).toHaveBeenCalledWith(0)
    })
  })

  // ==========================================================================
  // forceSync
  // ==========================================================================
  describe('forceSync', () => {
    it('returns a promise that resolves', async () => {
      await expect(offlineSyncService.forceSync()).resolves.toBeUndefined()
    })
  })

  // ==========================================================================
  // events$
  // ==========================================================================
  describe('events$', () => {
    it('exposes an observable for sync events', () => {
      expect(offlineSyncService.events$).toBeDefined()
      expect(typeof offlineSyncService.events$.subscribe).toBe('function')
    })

    it('emits start and complete events during successful sync', async () => {
      mockGetPendingOperations.mockResolvedValue([])
      const events: string[] = []
      const sub = offlineSyncService.events$.subscribe((event) => {
        events.push(event.type)
      })

      await offlineSyncService.sync()

      expect(events).toContain('start')
      expect(events).toContain('complete')

      sub.unsubscribe()
    })
  })

  // ==========================================================================
  // destroy
  // ==========================================================================
  describe('destroy', () => {
    it('does not throw', () => {
      expect(() => offlineSyncService.destroy()).not.toThrow()
    })
  })

  // ==========================================================================
  // Computed values
  // ==========================================================================
  describe('computed values', () => {
    it('currentStatus is defined', () => {
      expect(offlineSyncService.currentStatus.value).toBeDefined()
    })

    it('isSyncing is false when idle', () => {
      expect(offlineSyncService.isSyncing.value).toBe(false)
    })

    it('hasPending reflects pending count', () => {
      expect(offlineSyncService.hasPending.value).toBe(false)
    })
  })
})
