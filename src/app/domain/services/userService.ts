// =============================================================================
// User Service Interface - Domain Layer
// =============================================================================
// Defines the contract for user-related business operations.
// Implementation details are hidden from the presentation layer.
// =============================================================================

import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  PaginatedResponse,
  PaginationParams,
} from '@/app/domain/entities/user.model'

/**
 * Result wrapper for service operations
 * Provides consistent error handling across all service methods
 */
export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * User Service Interface
 * Abstracts all user-related business logic
 */
export interface UserService {
  /**
   * Get a single user by ID
   */
  getById(id: string): Promise<ServiceResult<User>>

  /**
   * Get paginated list of users
   */
  getList(params: PaginationParams, search?: string): Promise<ServiceResult<PaginatedResponse<User>>>

  /**
   * Create a new user
   */
  create(dto: CreateUserDto): Promise<ServiceResult<User>>

  /**
   * Update an existing user
   */
  update(id: string, dto: UpdateUserDto): Promise<ServiceResult<User>>

  /**
   * Delete a user
   */
  delete(id: string): Promise<ServiceResult<void>>

  /**
   * Check if the service is online
   */
  isOnline(): boolean

  /**
   * Sync pending offline operations
   */
  syncPendingOperations(): Promise<void>

  /**
   * Clear all cached data
   */
  clearCache(): Promise<void>
}
