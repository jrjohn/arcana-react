// =============================================================================
// User Mapper - DTO <-> Domain Model Conversion
// =============================================================================

import type { User, CreateUserDto, UpdateUserDto, PaginatedResponse } from '@/app/domain/entities/user.model'

/**
 * User DTO from API (snake_case from backend)
 */
export interface UserApiDto {
  id: string
  email: string
  first_name: string
  last_name: string
  avatar?: string
  created_at: string
  updated_at: string
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> {
  data: T[]
  page: number
  per_page: number
  total: number
  total_pages: number
}

/**
 * User Mapper
 * Converts between API DTOs and domain models
 */
export const userMapper = {
  /**
   * Map API DTO to Domain Model
   */
  toDomain(dto: UserApiDto): User {
    return {
      id: dto.id,
      email: dto.email,
      firstName: dto.first_name,
      lastName: dto.last_name,
      avatar: dto.avatar,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    }
  },

  /**
   * Map array of API DTOs to Domain Models
   */
  toDomainList(dtos: UserApiDto[]): User[] {
    return dtos.map((dto) => this.toDomain(dto))
  },

  /**
   * Map Domain Model to API DTO
   */
  toApiDto(user: User): UserApiDto {
    return {
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      avatar: user.avatar,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    }
  },

  /**
   * Map CreateUserDto to API format
   */
  toCreateApiDto(dto: CreateUserDto): Record<string, unknown> {
    return {
      email: dto.email,
      first_name: dto.firstName,
      last_name: dto.lastName,
      avatar: dto.avatar,
    }
  },

  /**
   * Map UpdateUserDto to API format
   */
  toUpdateApiDto(dto: UpdateUserDto): Record<string, unknown> {
    const apiDto: Record<string, unknown> = {}

    if (dto.email !== undefined) apiDto.email = dto.email
    if (dto.firstName !== undefined) apiDto.first_name = dto.firstName
    if (dto.lastName !== undefined) apiDto.last_name = dto.lastName
    if (dto.avatar !== undefined) apiDto.avatar = dto.avatar

    return apiDto
  },

  /**
   * Map paginated API response to domain
   */
  toPaginatedDomain(response: PaginatedApiResponse<UserApiDto>): PaginatedResponse<User> {
    return {
      data: this.toDomainList(response.data),
      page: response.page,
      pageSize: response.per_page,
      total: response.total,
      totalPages: response.total_pages,
    }
  },

  /**
   * Create a mock user for offline creation
   */
  createOfflineUser(dto: CreateUserDto): User {
    const now = new Date()
    return {
      id: `offline_${crypto.randomUUID()}`,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      avatar: dto.avatar,
      createdAt: now,
      updatedAt: now,
    }
  },

  /**
   * Apply update to existing user
   */
  applyUpdate(user: User, dto: UpdateUserDto): User {
    return {
      ...user,
      email: dto.email ?? user.email,
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      avatar: dto.avatar !== undefined ? dto.avatar : user.avatar,
      updatedAt: new Date(),
    }
  },

  /**
   * Check if user was created offline
   */
  isOfflineUser(user: User): boolean {
    return user.id.startsWith('offline_')
  },

  /**
   * Get display name
   */
  getDisplayName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim()
  },

  /**
   * Get initials
   */
  getInitials(user: User): string {
    const first = user.firstName?.charAt(0).toUpperCase() || ''
    const last = user.lastName?.charAt(0).toUpperCase() || ''
    return `${first}${last}`
  },
}
