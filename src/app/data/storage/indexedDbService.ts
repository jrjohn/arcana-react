// =============================================================================
// IndexedDB Service - Layer 3 (Persistent)
// =============================================================================

import Dexie, { type Table } from 'dexie'
import { signal } from '@preact/signals-react'
import { APP_CONSTANTS } from '@/app/core/constants/app.constants'

/**
 * Cached item structure for IndexedDB
 */
export interface CachedItem<T = unknown> {
  key: string
  value: T
  timestamp: number
  expiresAt: number
  version: number
}

/**
 * Pending operation for offline sync
 */
export interface PendingOperation {
  id?: number
  type: 'create' | 'update' | 'delete'
  entity: string
  entityId: string
  payload: unknown
  timestamp: number
  retries: number
  maxRetries: number
  status: 'pending' | 'processing' | 'failed'
  error?: string
}

/**
 * Sync metadata
 */
export interface SyncMetadata {
  key: string
  lastSync: number
  version: number
}

/**
 * Database schema version
 */
const DB_VERSION = 1

/**
 * Arcana Database using Dexie.js
 */
class ArcanaDB extends Dexie {
  cache!: Table<CachedItem>
  pendingOperations!: Table<PendingOperation>
  syncMetadata!: Table<SyncMetadata>

  constructor() {
    super('ArcanaDB')

    this.version(DB_VERSION).stores({
      cache: 'key, timestamp, expiresAt',
      pendingOperations: '++id, entity, entityId, status, timestamp',
      syncMetadata: 'key, lastSync',
    })
  }
}

/**
 * IndexedDB Service
 * Layer 3: Persistent storage using Dexie.js (IndexedDB wrapper)
 * - Survives browser restarts
 * - Stores cached API responses
 * - Manages pending offline operations
 */
class IndexedDbService {
  private db: ArcanaDB
  private initialized = signal(false)
  private initPromise: Promise<void> | null = null

  constructor() {
    this.db = new ArcanaDB()
    this.init()
  }

  /**
   * Initialize database
   */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      try {
        await this.db.open()
        this.initialized.value = true
        console.log('[IndexedDB] Database initialized')
      } catch (error) {
        console.error('[IndexedDB] Failed to initialize:', error)
        throw error
      }
    })()

    return this.initPromise
  }

  /**
   * Ensure database is ready
   */
  private async ensureReady(): Promise<void> {
    if (!this.initialized.value) {
      await this.init()
    }
  }

  // ==========================================================================
  // Cache Operations
  // ==========================================================================

  /**
   * Get cached item
   */
  async getCache<T>(key: string): Promise<T | null> {
    await this.ensureReady()

    const item = await this.db.cache.get(key)

    if (!item) return null

    // Check expiration
    if (Date.now() > item.expiresAt) {
      await this.db.cache.delete(key)
      return null
    }

    return item.value as T
  }

  /**
   * Set cached item
   */
  async setCache<T>(key: string, value: T, ttl: number = APP_CONSTANTS.CACHE.DEFAULT_TTL): Promise<void> {
    await this.ensureReady()

    const item: CachedItem<T> = {
      key,
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      version: 1,
    }

    await this.db.cache.put(item)
  }

  /**
   * Delete cached item
   */
  async deleteCache(key: string): Promise<void> {
    await this.ensureReady()
    await this.db.cache.delete(key)
  }

  /**
   * Clear cache by prefix
   */
  async clearCacheByPrefix(prefix: string): Promise<void> {
    await this.ensureReady()

    const keys = await this.db.cache
      .filter((item) => item.key.startsWith(prefix))
      .primaryKeys()

    await this.db.cache.bulkDelete(keys)
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    await this.ensureReady()
    await this.db.cache.clear()
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<number> {
    await this.ensureReady()

    const now = Date.now()
    const expired = await this.db.cache.filter((item) => item.expiresAt < now).primaryKeys()

    await this.db.cache.bulkDelete(expired)
    return expired.length
  }

  // ==========================================================================
  // Pending Operations (Offline Sync Queue)
  // ==========================================================================

  /**
   * Add pending operation
   */
  async addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<number> {
    await this.ensureReady()

    const op: PendingOperation = {
      ...operation,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    }

    return await this.db.pendingOperations.add(op)
  }

  /**
   * Get all pending operations
   */
  async getPendingOperations(): Promise<PendingOperation[]> {
    await this.ensureReady()

    return await this.db.pendingOperations
      .where('status')
      .equals('pending')
      .sortBy('timestamp')
  }

  /**
   * Get pending operations by entity
   */
  async getPendingOperationsByEntity(entity: string): Promise<PendingOperation[]> {
    await this.ensureReady()

    return await this.db.pendingOperations
      .where('entity')
      .equals(entity)
      .and((op) => op.status === 'pending')
      .toArray()
  }

  /**
   * Update pending operation
   */
  async updatePendingOperation(id: number, updates: Partial<PendingOperation>): Promise<void> {
    await this.ensureReady()
    await this.db.pendingOperations.update(id, updates)
  }

  /**
   * Delete pending operation
   */
  async deletePendingOperation(id: number): Promise<void> {
    await this.ensureReady()
    await this.db.pendingOperations.delete(id)
  }

  /**
   * Clear completed/failed operations older than specified time
   */
  async cleanupOldOperations(maxAge: number = 86400000): Promise<number> {
    await this.ensureReady()

    const cutoff = Date.now() - maxAge
    const old = await this.db.pendingOperations
      .filter((op) => op.timestamp < cutoff && op.status !== 'pending')
      .primaryKeys()

    await this.db.pendingOperations.bulkDelete(old as number[])
    return old.length
  }

  /**
   * Get count of pending operations
   */
  async getPendingCount(): Promise<number> {
    await this.ensureReady()
    return await this.db.pendingOperations.where('status').equals('pending').count()
  }

  // ==========================================================================
  // Sync Metadata
  // ==========================================================================

  /**
   * Get sync metadata
   */
  async getSyncMetadata(key: string): Promise<SyncMetadata | null> {
    await this.ensureReady()
    const metadata = await this.db.syncMetadata.get(key)
    return metadata ?? null
  }

  /**
   * Update sync metadata
   */
  async updateSyncMetadata(key: string, version?: number): Promise<void> {
    await this.ensureReady()

    const metadata: SyncMetadata = {
      key,
      lastSync: Date.now(),
      version: version ?? 1,
    }

    await this.db.syncMetadata.put(metadata)
  }

  // ==========================================================================
  // Utility
  // ==========================================================================

  /**
   * Get database stats
   */
  async getStats(): Promise<{
    cacheCount: number
    pendingCount: number
    cacheSize: number
  }> {
    await this.ensureReady()

    const cacheCount = await this.db.cache.count()
    const pendingCount = await this.db.pendingOperations.count()

    return {
      cacheCount,
      pendingCount,
      cacheSize: cacheCount, // Approximate
    }
  }

  /**
   * Check if initialized
   */
  get isInitialized() {
    return this.initialized
  }

  /**
   * Export database for backup
   */
  async exportData(): Promise<{
    cache: CachedItem[]
    pendingOperations: PendingOperation[]
    syncMetadata: SyncMetadata[]
  }> {
    await this.ensureReady()

    return {
      cache: await this.db.cache.toArray(),
      pendingOperations: await this.db.pendingOperations.toArray(),
      syncMetadata: await this.db.syncMetadata.toArray(),
    }
  }

  /**
   * Clear entire database
   */
  async clearAll(): Promise<void> {
    await this.ensureReady()
    await Promise.all([
      this.db.cache.clear(),
      this.db.pendingOperations.clear(),
      this.db.syncMetadata.clear(),
    ])
  }
}

// Export singleton instance
export const indexedDbService = new IndexedDbService()

// Export class for testing
export { IndexedDbService }
