// =============================================================================
// User Domain Model
// =============================================================================

/**
 * User Domain Model
 * Represents a user entity in the system
 */
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO for creating a new user
 */
export interface CreateUserDto {
  email: string
  firstName: string
  lastName: string
  avatar?: string
}

/**
 * DTO for updating an existing user
 */
export interface UpdateUserDto {
  email?: string
  firstName?: string
  lastName?: string
  avatar?: string
}

/**
 * Validation errors for user fields
 */
export interface UserValidationErrors {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatar?: string | null
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number
  pageSize: number
}
