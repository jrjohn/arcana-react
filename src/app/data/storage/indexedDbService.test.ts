// =============================================================================
// IndexedDB Service Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { type CachedItem, type PendingOperation, type SyncMetadata } from './indexedDbService'

// ---------------------------------------------------------------------------
// Mock Dexie so that the service can be instantiated without real IndexedDB.
// We patch `this.db` on the service instance after construction.
// ---------------------------------------------------------------------------
vi.mock('dexie', () => {
  class FakeDexie {
    version() {
      return { stores: vi.fn() }
    }
    open = vi.fn().mockResolvedValue(undefined)
  }
  return { default: FakeDexie }
})

import { IndexedDbService } from './indexedDbService'

// Create mock tables
function createMockTables() {
  return {
    cache: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      count: vi.fn().mockResolvedValue(0),
      filter: vi.fn().mockReturnValue({
        primaryKeys: vi.fn().mockResolvedValue([]),
      }),
      toArray: vi.fn().mockResolvedValue([]),
      bulkDelete: vi.fn().mockResolvedValue(undefined),
    },
    pendingOperations: {
      add: vi.fn().mockResolvedValue(0),
      get: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      count: vi.fn().mockResolvedValue(0),
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          sortBy: vi.fn().mockResolvedValue([]),
          and: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
          count: vi.fn().mockResolvedValue(0),
        }),
      }),
      filter: vi.fn().mockReturnValue({
        primaryKeys: vi.fn().mockResolvedValue([]),
      }),
      toArray: vi.fn().mockResolvedValue([]),
      bulkDelete: vi.fn().mockResolvedValue(undefined),
    },
    syncMetadata: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      toArray: vi.fn().mockResolvedValue([]),
    },
  }
}

type MockTables = ReturnType<typeof createMockTables>

function createServiceWithMocks(): { service: IndexedDbService; tables: MockTables } {
  const service = new IndexedDbService()
  const tables = createMockTables()

  // Patch the internal db to use our mock tables
  const db = (service as unknown as { db: Record<string, unknown> }).db
  db.cache = tables.cache
  db.pendingOperations = tables.pendingOperations
  db.syncMetadata = tables.syncMetadata

  return { service, tables }
}

describe('IndexedDbService', () => {
  let service: IndexedDbService
  let tables: MockTables

  beforeEach(() => {
    vi.clearAllMocks()
    const result = createServiceWithMocks()
    service = result.service
    tables = result.tables
  })

  // ==========================================================================
  // Initialization
  // ==========================================================================
  describe('init', () => {
    it('initializes the database successfully', async () => {
      await service.init()
      expect(service.isInitialized.value).toBe(true)
    })

    it('does not reinitialize if already initialized', async () => {
      await service.init()
      await service.init()
      expect(service.isInitialized.value).toBe(true)
    })
  })

  // ==========================================================================
  // Cache Operations
  // ==========================================================================
  describe('getCache', () => {
    it('returns cached value when not expired', async () => {
      const item: CachedItem = {
        key: 'test-key',
        value: { name: 'test' },
        timestamp: Date.now(),
        expiresAt: Date.now() + 60000,
        version: 1,
      }
      tables.cache.get.mockResolvedValue(item)

      const result = await service.getCache<{ name: string }>('test-key')

      expect(result).toEqual({ name: 'test' })
    })

    it('returns null when key does not exist', async () => {
      tables.cache.get.mockResolvedValue(undefined)

      const result = await service.getCache('nonexistent')

      expect(result).toBeNull()
    })

    it('returns null and deletes entry when expired', async () => {
      const item: CachedItem = {
        key: 'expired',
        value: 'old-data',
        timestamp: Date.now() - 120000,
        expiresAt: Date.now() - 1000,
        version: 1,
      }
      tables.cache.get.mockResolvedValue(item)

      const result = await service.getCache('expired')

      expect(result).toBeNull()
      expect(tables.cache.delete).toHaveBeenCalledWith('expired')
    })
  })

  describe('setCache', () => {
    it('stores item with correct structure', async () => {
      await service.setCache('my-key', { foo: 'bar' }, 5000)

      expect(tables.cache.put).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'my-key',
          value: { foo: 'bar' },
          version: 1,
        })
      )
    })

    it('sets expiresAt based on TTL', async () => {
      const before = Date.now()
      await service.setCache('ttl-key', 'val', 10000)

      const call = tables.cache.put.mock.calls[0][0]
      expect(call.expiresAt).toBeGreaterThanOrEqual(before + 10000)
    })
  })

  describe('deleteCache', () => {
    it('deletes the cache entry by key', async () => {
      await service.deleteCache('key-to-delete')

      expect(tables.cache.delete).toHaveBeenCalledWith('key-to-delete')
    })
  })

  describe('clearCacheByPrefix', () => {
    it('deletes all matching keys', async () => {
      const mockKeys = ['user:1', 'user:2']
      tables.cache.filter.mockReturnValue({
        primaryKeys: vi.fn().mockResolvedValue(mockKeys),
      })

      await service.clearCacheByPrefix('user:')

      expect(tables.cache.bulkDelete).toHaveBeenCalledWith(mockKeys)
    })
  })

  describe('clearAllCache', () => {
    it('clears the entire cache table', async () => {
      await service.clearAllCache()

      expect(tables.cache.clear).toHaveBeenCalled()
    })
  })

  describe('cleanupExpiredCache', () => {
    it('returns number of cleaned up entries', async () => {
      tables.cache.filter.mockReturnValue({
        primaryKeys: vi.fn().mockResolvedValue(['a', 'b', 'c']),
      })

      const count = await service.cleanupExpiredCache()

      expect(count).toBe(3)
    })

    it('returns 0 when nothing is expired', async () => {
      const count = await service.cleanupExpiredCache()

      expect(count).toBe(0)
    })
  })

  // ==========================================================================
  // Pending Operations
  // ==========================================================================
  describe('addPendingOperation', () => {
    it('adds operation with default status and retries', async () => {
      tables.pendingOperations.add.mockResolvedValue(42)

      const id = await service.addPendingOperation({
        type: 'create',
        entity: 'user',
        entityId: 'u1',
        payload: { name: 'test' },
        maxRetries: 3,
      })

      expect(id).toBe(42)
      expect(tables.pendingOperations.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'create',
          entity: 'user',
          entityId: 'u1',
          status: 'pending',
          retries: 0,
        })
      )
    })
  })

  describe('getPendingOperations', () => {
    it('returns pending operations sorted by timestamp', async () => {
      const ops: PendingOperation[] = [
        { id: 1, type: 'create', entity: 'user', entityId: 'u1', payload: null, timestamp: 100, retries: 0, maxRetries: 3, status: 'pending' },
        { id: 2, type: 'update', entity: 'user', entityId: 'u2', payload: null, timestamp: 200, retries: 0, maxRetries: 3, status: 'pending' },
      ]

      tables.pendingOperations.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          sortBy: vi.fn().mockResolvedValue(ops),
        }),
      })

      const result = await service.getPendingOperations()

      expect(result).toEqual(ops)
      expect(result).toHaveLength(2)
    })
  })

  describe('getPendingOperationsByEntity', () => {
    it('returns operations filtered by entity', async () => {
      const ops: PendingOperation[] = [
        { id: 1, type: 'create', entity: 'user', entityId: 'u1', payload: null, timestamp: 100, retries: 0, maxRetries: 3, status: 'pending' },
      ]

      tables.pendingOperations.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          and: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue(ops),
          }),
        }),
      })

      const result = await service.getPendingOperationsByEntity('user')

      expect(result).toEqual(ops)
    })
  })

  describe('updatePendingOperation', () => {
    it('updates operation by id', async () => {
      await service.updatePendingOperation(42, { status: 'processing' })

      expect(tables.pendingOperations.update).toHaveBeenCalledWith(42, { status: 'processing' })
    })
  })

  describe('deletePendingOperation', () => {
    it('deletes operation by id', async () => {
      await service.deletePendingOperation(42)

      expect(tables.pendingOperations.delete).toHaveBeenCalledWith(42)
    })
  })

  describe('cleanupOldOperations', () => {
    it('deletes old non-pending operations', async () => {
      tables.pendingOperations.filter.mockReturnValue({
        primaryKeys: vi.fn().mockResolvedValue([1, 2]),
      })

      const count = await service.cleanupOldOperations(86400000)

      expect(count).toBe(2)
      expect(tables.pendingOperations.bulkDelete).toHaveBeenCalledWith([1, 2])
    })

    it('returns 0 when no old operations found', async () => {
      const count = await service.cleanupOldOperations()

      expect(count).toBe(0)
    })
  })

  describe('getPendingCount', () => {
    it('returns count of pending operations', async () => {
      tables.pendingOperations.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue(5),
        }),
      })

      const count = await service.getPendingCount()

      expect(count).toBe(5)
    })
  })

  // ==========================================================================
  // Sync Metadata
  // ==========================================================================
  describe('getSyncMetadata', () => {
    it('returns metadata when found', async () => {
      const meta: SyncMetadata = { key: 'users', lastSync: 1000, version: 1 }
      tables.syncMetadata.get.mockResolvedValue(meta)

      const result = await service.getSyncMetadata('users')

      expect(result).toEqual(meta)
    })

    it('returns null when not found', async () => {
      tables.syncMetadata.get.mockResolvedValue(undefined)

      const result = await service.getSyncMetadata('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('updateSyncMetadata', () => {
    it('stores metadata with current timestamp', async () => {
      const before = Date.now()
      await service.updateSyncMetadata('users', 2)

      const call = tables.syncMetadata.put.mock.calls[0][0]
      expect(call.key).toBe('users')
      expect(call.version).toBe(2)
      expect(call.lastSync).toBeGreaterThanOrEqual(before)
    })

    it('defaults version to 1 when not specified', async () => {
      await service.updateSyncMetadata('users')

      const call = tables.syncMetadata.put.mock.calls[0][0]
      expect(call.version).toBe(1)
    })
  })

  // ==========================================================================
  // Utility
  // ==========================================================================
  describe('getStats', () => {
    it('returns cache and pending counts', async () => {
      tables.cache.count.mockResolvedValue(10)
      tables.pendingOperations.count.mockResolvedValue(3)

      const stats = await service.getStats()

      expect(stats).toEqual({
        cacheCount: 10,
        pendingCount: 3,
        cacheSize: 10,
      })
    })
  })

  describe('exportData', () => {
    it('exports all tables', async () => {
      tables.cache.toArray.mockResolvedValue([{ key: 'k1' }])
      tables.pendingOperations.toArray.mockResolvedValue([{ id: 1 }])
      tables.syncMetadata.toArray.mockResolvedValue([{ key: 'users' }])

      const data = await service.exportData()

      expect(data.cache).toEqual([{ key: 'k1' }])
      expect(data.pendingOperations).toEqual([{ id: 1 }])
      expect(data.syncMetadata).toEqual([{ key: 'users' }])
    })
  })

  describe('clearAll', () => {
    it('clears all tables', async () => {
      await service.clearAll()

      expect(tables.cache.clear).toHaveBeenCalled()
      expect(tables.pendingOperations.clear).toHaveBeenCalled()
      expect(tables.syncMetadata.clear).toHaveBeenCalled()
    })
  })

  describe('isInitialized', () => {
    it('returns false before init', () => {
      const freshService = new IndexedDbService()
      expect(freshService.isInitialized.value).toBe(false)
    })

    it('returns true after init', async () => {
      await service.init()
      expect(service.isInitialized.value).toBe(true)
    })
  })
})
