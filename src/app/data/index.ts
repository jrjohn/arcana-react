// =============================================================================
// Data Layer Exports
// =============================================================================

// API
export { apiService } from './api/apiService'
export type { ApiResponse, ApiErrorEvent } from './api/apiService'

// Mappers
export { userMapper } from './mappers/userMapper'
export type { UserApiDto, PaginatedApiResponse } from './mappers/userMapper'

// Repositories
export { userRepository } from './repositories/userRepository'

// Storage
export { memoryCacheService, MemoryCacheService } from './storage/memoryCacheService'
export { lruCacheService, LRUCacheService } from './storage/lruCacheService'
export { indexedDbService, IndexedDbService } from './storage/indexedDbService'
export type { CachedItem, PendingOperation, SyncMetadata } from './storage/indexedDbService'

// Sync
export { offlineSyncService, SyncStatus } from './sync/offlineSyncService'
export type { SyncEvent, SyncStats } from './sync/offlineSyncService'
