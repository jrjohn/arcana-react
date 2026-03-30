// =============================================================================
// User Service Implementation - Data Layer
// =============================================================================
// Implements the UserService interface using the UserRepository.
// Handles business logic and error transformation.
// =============================================================================

import type { UserService, ServiceResult } from '@/app/domain/services/userService'
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  PaginatedResponse,
  PaginationParams,
} from '@/app/domain/entities/user.model'
import { userRepository } from '@/app/data/repositories/userRepository'
import { networkStatusService } from '@/app/domain/services/networkStatusService'

/**
 * User Service Implementation
 * Bridges the domain layer with the data layer
 */
class UserServiceImpl implements UserService {
  /**
   * Get a single user by ID
   */
  async getById(id: string): Promise<ServiceResult<User>> {
    try {
      const user = await userRepository.getById(id)

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        }
      }

      return {
        success: true,
        data: user,
      }
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Get paginated list of users
   */
  async getList(
    params: PaginationParams,
    search?: string
  ): Promise<ServiceResult<PaginatedResponse<User>>> {
    try {
      const result = await userRepository.getList(params, search)

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Create a new user
   */
  async create(dto: CreateUserDto): Promise<ServiceResult<User>> {
    try {
      const user = await userRepository.create(dto)

      return {
        success: true,
        data: user,
      }
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Update an existing user
   */
  async update(id: string, dto: UpdateUserDto): Promise<ServiceResult<User>> {
    try {
      const user = await userRepository.update(id, dto)

      return {
        success: true,
        data: user,
      }
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      await userRepository.delete(id)

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Check if the service is online
   */
  isOnline(): boolean {
    return networkStatusService.isCurrentlyOnline()
  }

  /**
   * Sync pending offline operations
   */
  async syncPendingOperations(): Promise<void> {
    await userRepository.syncPendingOperations()
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await userRepository.clearCache()
  }

  /**
   * Format error message
   */
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    return 'An unknown error occurred'
  }
}

// Export singleton instance
export const userService: UserService = new UserServiceImpl()
