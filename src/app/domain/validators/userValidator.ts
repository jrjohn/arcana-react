// =============================================================================
// User Validator
// =============================================================================

import { APP_CONSTANTS } from '@/app/core/constants/app.constants'
import type { User, CreateUserDto, UpdateUserDto, UserValidationErrors } from '../entities/user.model'

/**
 * User field validation
 */
export const userValidator = {
  /**
   * Validate first name
   */
  validateFirstName(value: string | undefined | null): string | null {
    if (!value || value.trim().length === 0) {
      return 'First name is required'
    }
    if (value.trim().length < 2) {
      return 'First name must be at least 2 characters'
    }
    if (value.trim().length > 50) {
      return 'First name must be less than 50 characters'
    }
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value.trim())) {
      return 'First name contains invalid characters'
    }
    return null
  },

  /**
   * Validate last name
   */
  validateLastName(value: string | undefined | null): string | null {
    if (!value || value.trim().length === 0) {
      return 'Last name is required'
    }
    if (value.trim().length < 2) {
      return 'Last name must be at least 2 characters'
    }
    if (value.trim().length > 50) {
      return 'Last name must be less than 50 characters'
    }
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value.trim())) {
      return 'Last name contains invalid characters'
    }
    return null
  },

  /**
   * Validate email
   */
  validateEmail(value: string | undefined | null): string | null {
    if (!value || value.trim().length === 0) {
      return 'Email is required'
    }
    if (!APP_CONSTANTS.VALIDATION.EMAIL_PATTERN.test(value.trim())) {
      return 'Please enter a valid email address'
    }
    return null
  },

  /**
   * Validate avatar URL
   */
  validateAvatar(value: string | undefined | null): string | null {
    if (!value || value.trim().length === 0) {
      return null // Avatar is optional
    }
    if (!APP_CONSTANTS.VALIDATION.URL_PATTERN.test(value.trim())) {
      return 'Please enter a valid URL'
    }
    return null
  },

  /**
   * Validate entire user for creation
   */
  validateCreate(dto: CreateUserDto): UserValidationErrors {
    return {
      firstName: this.validateFirstName(dto.firstName),
      lastName: this.validateLastName(dto.lastName),
      email: this.validateEmail(dto.email),
      avatar: this.validateAvatar(dto.avatar),
    }
  },

  /**
   * Validate entire user for update
   */
  validateUpdate(dto: UpdateUserDto): UserValidationErrors {
    const errors: UserValidationErrors = {}

    if (dto.firstName !== undefined) {
      errors.firstName = this.validateFirstName(dto.firstName)
    }
    if (dto.lastName !== undefined) {
      errors.lastName = this.validateLastName(dto.lastName)
    }
    if (dto.email !== undefined) {
      errors.email = this.validateEmail(dto.email)
    }
    if (dto.avatar !== undefined) {
      errors.avatar = this.validateAvatar(dto.avatar)
    }

    return errors
  },

  /**
   * Check if validation errors object has any errors
   */
  hasErrors(errors: UserValidationErrors): boolean {
    return Object.values(errors).some((error) => error !== null && error !== undefined)
  },

  /**
   * Get first error message from validation errors
   */
  getFirstError(errors: UserValidationErrors): string | null {
    const firstError = Object.values(errors).find(
      (error) => error !== null && error !== undefined
    )
    return firstError ?? null
  },

  /**
   * Validate a single field by name
   */
  validateField(
    fieldName: keyof UserValidationErrors,
    value: string | undefined | null
  ): string | null {
    switch (fieldName) {
      case 'firstName':
        return this.validateFirstName(value)
      case 'lastName':
        return this.validateLastName(value)
      case 'email':
        return this.validateEmail(value)
      case 'avatar':
        return this.validateAvatar(value)
      default:
        return null
    }
  },
}

/**
 * Type guard to check if object is a valid User
 */
export function isValidUser(obj: unknown): obj is User {
  if (!obj || typeof obj !== 'object') {
    return false
  }

  const user = obj as Record<string, unknown>

  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.firstName === 'string' &&
    typeof user.lastName === 'string' &&
    (user.avatar === undefined || typeof user.avatar === 'string') &&
    user.createdAt instanceof Date &&
    user.updatedAt instanceof Date
  )
}
