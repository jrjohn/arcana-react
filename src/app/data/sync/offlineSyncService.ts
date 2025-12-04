// =============================================================================
// Offline Sync Service
// =============================================================================

import { signal, computed } from '@preact/signals-react'
import { Subject, interval, type Subscription } from 'rxjs'
import { filter } from 'rxjs/operators'

import { networkStatusService, type NetworkInfo } from '@/app/domain/services/networkStatusService'
import { indexedDbService, type PendingOperation } from '../storage/indexedDbService'

/**
 * Sync status
 */
export const SyncStatus = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus]

/**
 * Sync event
 */
export interface SyncEvent {
  type: 'start' | 'complete' | 'error' | 'operation_synced' | 'operation_failed'
  operation?: PendingOperation
  error?: Error
  timestamp: Date
}

/**
 * Sync statistics
 */
export interface SyncStats {
  pendingCount: number
  syncedCount: number
  failedCount: number
  lastSyncTime: Date | null
}

/**
 * Offline Sync Service
 * Handles synchronization of pending operations when coming back online
 */
class OfflineSyncService {
  // Reactive state
  private status = signal<SyncStatus>(SyncStatus.IDLE)
  private pendingCount = signal(0)
  private syncedCount = signal(0)
  private failedCount = signal(0)
  private lastSyncTime = signal<Date | null>(null)

  // Event subject
  private syncEvents = new Subject<SyncEvent>()

  // Sync handlers by entity type
  private handlers = new Map<
    string,
    {
      create: (op: PendingOperation) => Promise<void>
      update: (op: PendingOperation) => Promise<void>
      delete: (op: PendingOperation) => Promise<void>
    }
  >()

  // Subscriptions
  private subscriptions: Subscription[] = []

  // Computed values
  readonly currentStatus = computed(() => this.status.value)
  readonly isSyncing = computed(() => this.status.value === SyncStatus.SYNCING)
  readonly hasPending = computed(() => this.pendingCount.value > 0)

  constructor() {
    this.initialize()
  }

  /**
   * Initialize sync service
   */
  private initialize(): void {
    // Listen for network status changes
    const networkSub = networkStatusService.onChange$.subscribe((info: NetworkInfo) => {
      if (info.isOnline) {
        console.log('[Sync] Network online - starting sync')
        this.sync()
      }
    })
    this.subscriptions.push(networkSub)

    // Periodic sync check (every 30 seconds when online)
    const periodicSub = interval(30000)
      .pipe(filter(() => networkStatusService.isCurrentlyOnline() && this.hasPending.value))
      .subscribe(() => {
        console.log('[Sync] Periodic sync check')
        this.sync()
      })
    this.subscriptions.push(periodicSub)

    // Update pending count on init
    this.updatePendingCount()
  }

  /**
   * Register sync handler for an entity type
   */
  registerHandler(
    entity: string,
    handlers: {
      create: (op: PendingOperation) => Promise<void>
      update: (op: PendingOperation) => Promise<void>
      delete: (op: PendingOperation) => Promise<void>
    }
  ): void {
    this.handlers.set(entity, handlers)
  }

  /**
   * Start synchronization
   */
  async sync(): Promise<void> {
    if (this.status.value === SyncStatus.SYNCING) {
      console.log('[Sync] Already syncing, skipping')
      return
    }

    if (!networkStatusService.isCurrentlyOnline()) {
      console.log('[Sync] Offline, cannot sync')
      return
    }

    try {
      this.status.value = SyncStatus.SYNCING
      this.emitEvent({ type: 'start', timestamp: new Date() })

      const operations = await indexedDbService.getPendingOperations()
      console.log(`[Sync] Found ${operations.length} pending operations`)

      for (const op of operations) {
        await this.syncOperation(op)
      }

      this.status.value = SyncStatus.SUCCESS
      this.lastSyncTime.value = new Date()
      this.emitEvent({ type: 'complete', timestamp: new Date() })
    } catch (error) {
      console.error('[Sync] Sync failed:', error)
      this.status.value = SyncStatus.FAILED
      this.emitEvent({ type: 'error', error: error as Error, timestamp: new Date() })
    } finally {
      await this.updatePendingCount()
    }
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(op: PendingOperation): Promise<void> {
    const handler = this.handlers.get(op.entity)

    if (!handler) {
      console.warn(`[Sync] No handler for entity: ${op.entity}`)
      return
    }

    try {
      // Mark as processing
      await indexedDbService.updatePendingOperation(op.id!, { status: 'processing' })

      // Execute handler
      switch (op.type) {
        case 'create':
          await handler.create(op)
          break
        case 'update':
          await handler.update(op)
          break
        case 'delete':
          await handler.delete(op)
          break
      }

      // Remove completed operation
      await indexedDbService.deletePendingOperation(op.id!)
      this.syncedCount.value++

      this.emitEvent({
        type: 'operation_synced',
        operation: op,
        timestamp: new Date(),
      })
    } catch (error) {
      console.error(`[Sync] Operation failed:`, op, error)

      const retries = op.retries + 1
      if (retries >= op.maxRetries) {
        // Mark as failed
        await indexedDbService.updatePendingOperation(op.id!, {
          status: 'failed',
          retries,
          error: (error as Error).message,
        })
        this.failedCount.value++

        this.emitEvent({
          type: 'operation_failed',
          operation: op,
          error: error as Error,
          timestamp: new Date(),
        })
      } else {
        // Retry later
        await indexedDbService.updatePendingOperation(op.id!, {
          status: 'pending',
          retries,
        })
      }
    }
  }

  /**
   * Update pending count
   */
  private async updatePendingCount(): Promise<void> {
    this.pendingCount.value = await indexedDbService.getPendingCount()
  }

  /**
   * Emit sync event
   */
  private emitEvent(event: SyncEvent): void {
    this.syncEvents.next(event)
  }

  /**
   * Get sync statistics
   */
  getStats(): SyncStats {
    return {
      pendingCount: this.pendingCount.value,
      syncedCount: this.syncedCount.value,
      failedCount: this.failedCount.value,
      lastSyncTime: this.lastSyncTime.value,
    }
  }

  /**
   * Observable for sync events
   */
  get events$() {
    return this.syncEvents.asObservable()
  }

  /**
   * Force sync immediately
   */
  forceSync(): Promise<void> {
    return this.sync()
  }

  /**
   * Clear failed operations
   */
  async clearFailed(): Promise<void> {
    await indexedDbService.cleanupOldOperations(0) // Clear all non-pending
    this.failedCount.value = 0
  }

  /**
   * Reset sync statistics
   */
  resetStats(): void {
    this.syncedCount.value = 0
    this.failedCount.value = 0
    this.status.value = SyncStatus.IDLE
  }

  /**
   * Cleanup subscriptions
   */
  destroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
    this.subscriptions = []
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService()
