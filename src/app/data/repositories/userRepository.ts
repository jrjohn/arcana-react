// =============================================================================
// User Repository - 4-Layer Caching Architecture
// =============================================================================
// Layer 1: Memory Cache (instant, session-only)
// Layer 2: LRU Cache with TTL (fast, session-only)
// Layer 3: IndexedDB (persistent, survives restarts)
// Layer 4: API (network, source of truth)
// =============================================================================

import { signal, computed } from '@preact/signals-react'
import { Subject, BehaviorSubject } from 'rxjs'

import { APP_CONSTANTS } from '@/app/core/constants/app.constants'
import type { User, CreateUserDto, UpdateUserDto, PaginatedResponse, PaginationParams } from '@/app/domain/entities/user.model'
import { networkStatusService, type NetworkInfo } from '@/app/domain/services/networkStatusService'
import { memoryCacheService } from '../storage/memoryCacheService'
import { lruCacheService } from '../storage/lruCacheService'
import { indexedDbService } from '../storage/indexedDbService'
import { apiService } from '../api/apiService'
import { userMapper, type UserApiDto, type PaginatedApiResponse } from '../mappers/userMapper'

/**
 * Cache keys
 */
const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  USER_LIST: (page: number, pageSize: number, search?: string) =>
    `users:list:${page}:${pageSize}:${search || ''}`,
  ALL_USERS: 'users:all',
}

/**
 * Repository state
 */
interface RepositoryState {
  loading: boolean
  error: string | null
  lastSync: Date | null
}

/**
 * User Repository
 * Implements offline-first 4-layer caching strategy
 */
class UserRepository {
  // Reactive state
  private state = signal<RepositoryState>({
    loading: false,
    error: null,
    lastSync: null,
  })

  // Users cache for reactive updates
  private usersSubject = new BehaviorSubject<User[]>([])
  private userUpdates = new Subject<{ type: 'create' | 'update' | 'delete'; user: User }>()

  // Computed values
  readonly loading = computed(() => this.state.value.loading)
  readonly error = computed(() => this.state.value.error)
  readonly lastSync = computed(() => this.state.value.lastSync)

  constructor() {
    // Subscribe to network changes to sync when coming online
    networkStatusService.onChange$.subscribe((info: NetworkInfo) => {
      if (info.isOnline) {
        this.syncPendingOperations()
      }
    })
  }

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  /**
   * Get user by ID (4-layer lookup)
   */
  async getById(id: string): Promise<User | null> {
    const cacheKey = CACHE_KEYS.USER(id)

    // Layer 1: Memory Cache
    const memoryResult = memoryCacheService.get<User>(cacheKey)
    if (memoryResult) {
      console.log('[Cache L1] Memory hit:', id)
      return memoryResult
    }

    // Layer 2: LRU Cache
    const lruResult = lruCacheService.get<User>(cacheKey)
    if (lruResult) {
      console.log('[Cache L2] LRU hit:', id)
      memoryCacheService.set(cacheKey, lruResult)
      return lruResult
    }

    // Layer 3: IndexedDB
    const indexedDbResult = await indexedDbService.getCache<User>(cacheKey)
    if (indexedDbResult) {
      console.log('[Cache L3] IndexedDB hit:', id)
      lruCacheService.set(cacheKey, indexedDbResult)
      memoryCacheService.set(cacheKey, indexedDbResult)
      return indexedDbResult
    }

    // Layer 4: API
    if (!networkStatusService.isCurrentlyOnline()) {
      console.log('[Cache] Offline - no data available')
      return null
    }

    try {
      console.log('[Cache L4] API fetch:', id)
      this.setLoading(true)

      const response = await apiService.get<UserApiDto>(`/users/${id}`)
      const user = userMapper.toDomain(response.data)

      // Populate all cache layers
      await this.cacheUser(user)

      return user
    } catch (error) {
      this.setError((error as Error).message)
      return null
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Get paginated users list
   */
  async getList(params: PaginationParams, search?: string): Promise<PaginatedResponse<User>> {
    const cacheKey = CACHE_KEYS.USER_LIST(params.page, params.pageSize, search)

    // Check LRU cache first (skip memory for lists)
    const cachedResult = lruCacheService.get<PaginatedResponse<User>>(cacheKey)
    if (cachedResult) {
      console.log('[Cache L2] List hit')
      return cachedResult
    }

    // Check IndexedDB
    const indexedDbResult = await indexedDbService.getCache<PaginatedResponse<User>>(cacheKey)
    if (indexedDbResult) {
      console.log('[Cache L3] List hit')
      lruCacheService.set(cacheKey, indexedDbResult)
      return indexedDbResult
    }

    // Fetch from API
    if (!networkStatusService.isCurrentlyOnline()) {
      return this.getOfflineList(params, search)
    }

    try {
      this.setLoading(true)

      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        per_page: params.pageSize.toString(),
      })

      if (search) {
        queryParams.append('search', search)
      }

      const response = await apiService.get<PaginatedApiResponse<UserApiDto>>(
        `/users?${queryParams.toString()}`
      )

      const result = userMapper.toPaginatedDomain(response.data)

      // Cache the result
      lruCacheService.set(cacheKey, result, APP_CONSTANTS.CACHE.LIST_TTL)
      await indexedDbService.setCache(cacheKey, result, APP_CONSTANTS.CACHE.LIST_TTL)

      // Cache individual users
      for (const user of result.data) {
        await this.cacheUser(user)
      }

      this.state.value = { ...this.state.value, lastSync: new Date() }
      this.usersSubject.next(result.data)

      return result
    } catch (error) {
      this.setError((error as Error).message)
      return this.getOfflineList(params, search)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Create new user
   */
  async create(dto: CreateUserDto): Promise<User> {
    if (!networkStatusService.isCurrentlyOnline()) {
      return this.createOffline(dto)
    }

    try {
      this.setLoading(true)

      const response = await apiService.post<UserApiDto>(
        '/users',
        userMapper.toCreateApiDto(dto)
      )

      const user = userMapper.toDomain(response.data)

      // Cache and notify
      await this.cacheUser(user)
      this.invalidateListCache()
      this.userUpdates.next({ type: 'create', user })

      return user
    } catch (error) {
      // Fall back to offline creation
      if ((error as Error).message.includes('network')) {
        return this.createOffline(dto)
      }
      throw error
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Update existing user
   */
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const existingUser = await this.getById(id)
    if (!existingUser) {
      throw new Error('User not found')
    }

    if (!networkStatusService.isCurrentlyOnline()) {
      return this.updateOffline(existingUser, dto)
    }

    try {
      this.setLoading(true)

      const response = await apiService.put<UserApiDto>(
        `/users/${id}`,
        userMapper.toUpdateApiDto(dto)
      )

      const user = userMapper.toDomain(response.data)

      // Update cache and notify
      await this.cacheUser(user)
      this.invalidateListCache()
      this.userUpdates.next({ type: 'update', user })

      return user
    } catch (error) {
      // Fall back to offline update
      if ((error as Error).message.includes('network')) {
        return this.updateOffline(existingUser, dto)
      }
      throw error
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    const existingUser = await this.getById(id)
    if (!existingUser) {
      throw new Error('User not found')
    }

    if (!networkStatusService.isCurrentlyOnline()) {
      await this.deleteOffline(id, existingUser)
      return
    }

    try {
      this.setLoading(true)

      await apiService.delete(`/users/${id}`)

      // Remove from cache
      await this.removeFromCache(id)
      this.invalidateListCache()
      this.userUpdates.next({ type: 'delete', user: existingUser })
    } catch (error) {
      // Fall back to offline deletion
      if ((error as Error).message.includes('network')) {
        await this.deleteOffline(id, existingUser)
        return
      }
      throw error
    } finally {
      this.setLoading(false)
    }
  }

  // ==========================================================================
  // Offline Operations
  // ==========================================================================

  /**
   * Create user offline
   */
  private async createOffline(dto: CreateUserDto): Promise<User> {
    const user = userMapper.createOfflineUser(dto)

    // Cache the offline user
    await this.cacheUser(user)

    // Queue for sync
    await indexedDbService.addPendingOperation({
      type: 'create',
      entity: 'user',
      entityId: user.id,
      payload: dto,
      maxRetries: 3,
    })

    this.userUpdates.next({ type: 'create', user })

    return user
  }

  /**
   * Update user offline
   */
  private async updateOffline(existingUser: User, dto: UpdateUserDto): Promise<User> {
    const updatedUser = userMapper.applyUpdate(existingUser, dto)

    // Update cache
    await this.cacheUser(updatedUser)

    // Queue for sync
    await indexedDbService.addPendingOperation({
      type: 'update',
      entity: 'user',
      entityId: existingUser.id,
      payload: dto,
      maxRetries: 3,
    })

    this.userUpdates.next({ type: 'update', user: updatedUser })

    return updatedUser
  }

  /**
   * Delete user offline
   */
  private async deleteOffline(id: string, user: User): Promise<void> {
    // Remove from cache
    await this.removeFromCache(id)

    // Queue for sync
    await indexedDbService.addPendingOperation({
      type: 'delete',
      entity: 'user',
      entityId: id,
      payload: null,
      maxRetries: 3,
    })

    this.userUpdates.next({ type: 'delete', user })
  }

  /**
   * Get list from offline cache
   */
  private async getOfflineList(
    params: PaginationParams,
    search?: string
  ): Promise<PaginatedResponse<User>> {
    // Try to get all cached users
    const allCachedKey = CACHE_KEYS.ALL_USERS
    let allUsers = await indexedDbService.getCache<User[]>(allCachedKey)

    if (!allUsers) {
      allUsers = []
    }

    // Filter by search
    let filtered = allUsers
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = allUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      )
    }

    // Paginate
    const start = (params.page - 1) * params.pageSize
    const end = start + params.pageSize
    const paginated = filtered.slice(start, end)

    return {
      data: paginated,
      page: params.page,
      pageSize: params.pageSize,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / params.pageSize),
    }
  }

  // ==========================================================================
  // Sync Operations
  // ==========================================================================

  /**
   * Sync pending operations when online
   */
  async syncPendingOperations(): Promise<void> {
    if (!networkStatusService.isCurrentlyOnline()) return

    const pending = await indexedDbService.getPendingOperationsByEntity('user')

    for (const op of pending) {
      try {
        await indexedDbService.updatePendingOperation(op.id!, { status: 'processing' })

        switch (op.type) {
          case 'create':
            await this.syncCreate(op)
            break
          case 'update':
            await this.syncUpdate(op)
            break
          case 'delete':
            await this.syncDelete(op)
            break
        }

        await indexedDbService.deletePendingOperation(op.id!)
      } catch (error) {
        const retries = op.retries + 1
        if (retries >= op.maxRetries) {
          await indexedDbService.updatePendingOperation(op.id!, {
            status: 'failed',
            error: (error as Error).message,
          })
        } else {
          await indexedDbService.updatePendingOperation(op.id!, {
            status: 'pending',
            retries,
          })
        }
      }
    }
  }

  private async syncCreate(op: { entityId: string; payload: unknown }): Promise<void> {
    const dto = op.payload as CreateUserDto
    const response = await apiService.post<UserApiDto>('/users', userMapper.toCreateApiDto(dto))
    const user = userMapper.toDomain(response.data)

    // Remove offline user and cache real user
    await this.removeFromCache(op.entityId)
    await this.cacheUser(user)
  }

  private async syncUpdate(op: { entityId: string; payload: unknown }): Promise<void> {
    const dto = op.payload as UpdateUserDto
    const response = await apiService.put<UserApiDto>(
      `/users/${op.entityId}`,
      userMapper.toUpdateApiDto(dto)
    )
    const user = userMapper.toDomain(response.data)
    await this.cacheUser(user)
  }

  private async syncDelete(op: { entityId: string }): Promise<void> {
    await apiService.delete(`/users/${op.entityId}`)
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Cache user in all layers
   */
  private async cacheUser(user: User): Promise<void> {
    const cacheKey = CACHE_KEYS.USER(user.id)

    memoryCacheService.set(cacheKey, user)
    lruCacheService.set(cacheKey, user, APP_CONSTANTS.CACHE.DEFAULT_TTL)
    await indexedDbService.setCache(cacheKey, user, APP_CONSTANTS.CACHE.LONG_TTL)
  }

  /**
   * Remove user from all cache layers
   */
  private async removeFromCache(id: string): Promise<void> {
    const cacheKey = CACHE_KEYS.USER(id)

    memoryCacheService.delete(cacheKey)
    lruCacheService.delete(cacheKey)
    await indexedDbService.deleteCache(cacheKey)
  }

  /**
   * Invalidate list cache
   */
  private invalidateListCache(): void {
    memoryCacheService.clearByPrefix('users:list')
    lruCacheService.clearByPrefix('users:list')
  }

  /**
   * Clear all user cache
   */
  async clearCache(): Promise<void> {
    memoryCacheService.clearByPrefix('user')
    lruCacheService.clearByPrefix('user')
    await indexedDbService.clearCacheByPrefix('user')
  }

  // ==========================================================================
  // State Management
  // ==========================================================================

  private setLoading(loading: boolean): void {
    this.state.value = { ...this.state.value, loading }
  }

  private setError(error: string | null): void {
    this.state.value = { ...this.state.value, error }
  }

  /**
   * Observable for user updates
   */
  get updates$() {
    return this.userUpdates.asObservable()
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return {
      memory: memoryCacheService.stats,
      lru: lruCacheService.stats,
      indexedDb: await indexedDbService.getStats(),
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository()
