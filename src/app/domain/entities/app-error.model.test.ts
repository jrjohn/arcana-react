// =============================================================================
// Application Error Model Tests
// =============================================================================

import { describe, it, expect } from 'vitest'
import { AppError, ErrorCategory, ErrorSeverity } from './app-error.model'

describe('AppError', () => {
  // ==========================================================================
  // Constructor
  // ==========================================================================
  describe('constructor', () => {
    it('creates error with default values', () => {
      const error = new AppError('Something went wrong')

      expect(error.message).toBe('Something went wrong')
      expect(error.category).toBe(ErrorCategory.UNKNOWN)
      expect(error.severity).toBe(ErrorSeverity.ERROR)
      expect(error.code).toBe('ERR_UNKNOWN')
      expect(error.name).toBe('AppError')
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('creates error with custom category', () => {
      const error = new AppError('Validation error', ErrorCategory.VALIDATION)

      expect(error.category).toBe(ErrorCategory.VALIDATION)
      expect(error.code).toBe('ERR_VALIDATION')
    })

    it('creates error with all options', () => {
      const original = new Error('Original')
      const error = new AppError('Custom error', ErrorCategory.SERVER, {
        severity: ErrorSeverity.CRITICAL,
        code: 'CUSTOM_CODE',
        details: { field: 'name' },
        originalError: original,
      })

      expect(error.severity).toBe(ErrorSeverity.CRITICAL)
      expect(error.code).toBe('CUSTOM_CODE')
      expect(error.details).toEqual({ field: 'name' })
      expect(error.originalError).toBe(original)
    })

    it('is an instance of Error', () => {
      const error = new AppError('test')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
    })
  })

  // ==========================================================================
  // Factory methods
  // ==========================================================================
  describe('validation', () => {
    it('creates validation error', () => {
      const error = AppError.validation('Invalid email', { field: 'email' })

      expect(error.category).toBe(ErrorCategory.VALIDATION)
      expect(error.severity).toBe(ErrorSeverity.WARNING)
      expect(error.code).toBe('ERR_VALIDATION')
      expect(error.message).toBe('Invalid email')
      expect(error.details).toEqual({ field: 'email' })
    })
  })

  describe('network', () => {
    it('creates network error', () => {
      const original = new Error('timeout')
      const error = AppError.network('No connection', original)

      expect(error.category).toBe(ErrorCategory.NETWORK)
      expect(error.severity).toBe(ErrorSeverity.ERROR)
      expect(error.code).toBe('ERR_NETWORK')
      expect(error.originalError).toBe(original)
    })

    it('creates network error without original', () => {
      const error = AppError.network('Offline')

      expect(error.originalError).toBeUndefined()
    })
  })

  describe('authentication', () => {
    it('creates auth error with default message', () => {
      const error = AppError.authentication()

      expect(error.category).toBe(ErrorCategory.AUTHENTICATION)
      expect(error.message).toBe('Authentication required')
      expect(error.severity).toBe(ErrorSeverity.WARNING)
      expect(error.code).toBe('ERR_AUTH')
    })

    it('creates auth error with custom message', () => {
      const error = AppError.authentication('Token expired')

      expect(error.message).toBe('Token expired')
    })
  })

  describe('authorization', () => {
    it('creates authorization error with default message', () => {
      const error = AppError.authorization()

      expect(error.category).toBe(ErrorCategory.AUTHORIZATION)
      expect(error.message).toBe('Access denied')
      expect(error.code).toBe('ERR_FORBIDDEN')
    })

    it('creates authorization error with custom message', () => {
      const error = AppError.authorization('Insufficient permissions')

      expect(error.message).toBe('Insufficient permissions')
    })
  })

  describe('notFound', () => {
    it('creates not found error', () => {
      const error = AppError.notFound('User')

      expect(error.category).toBe(ErrorCategory.NOT_FOUND)
      expect(error.message).toBe('User not found')
      expect(error.code).toBe('ERR_NOT_FOUND')
      expect(error.details).toEqual({ resource: 'User' })
    })
  })

  describe('conflict', () => {
    it('creates conflict error', () => {
      const error = AppError.conflict('Duplicate entry', { field: 'email' })

      expect(error.category).toBe(ErrorCategory.CONFLICT)
      expect(error.message).toBe('Duplicate entry')
      expect(error.code).toBe('ERR_CONFLICT')
      expect(error.details).toEqual({ field: 'email' })
    })
  })

  describe('server', () => {
    it('creates server error with default message', () => {
      const error = AppError.server()

      expect(error.category).toBe(ErrorCategory.SERVER)
      expect(error.message).toBe('Internal server error')
      expect(error.severity).toBe(ErrorSeverity.CRITICAL)
      expect(error.code).toBe('ERR_SERVER')
    })

    it('creates server error with original error', () => {
      const original = new Error('DB crash')
      const error = AppError.server('Database error', original)

      expect(error.originalError).toBe(original)
    })
  })

  // ==========================================================================
  // fromHttpStatus
  // ==========================================================================
  describe('fromHttpStatus', () => {
    it('maps 400 to validation error', () => {
      const error = AppError.fromHttpStatus(400, 'Bad input')
      expect(error.category).toBe(ErrorCategory.VALIDATION)
      expect(error.message).toBe('Bad input')
    })

    it('maps 400 with default message', () => {
      const error = AppError.fromHttpStatus(400)
      expect(error.message).toBe('Bad request')
    })

    it('maps 401 to authentication error', () => {
      const error = AppError.fromHttpStatus(401)
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION)
    })

    it('maps 403 to authorization error', () => {
      const error = AppError.fromHttpStatus(403)
      expect(error.category).toBe(ErrorCategory.AUTHORIZATION)
    })

    it('maps 404 to not found error', () => {
      const error = AppError.fromHttpStatus(404)
      expect(error.category).toBe(ErrorCategory.NOT_FOUND)
    })

    it('maps 404 with custom message', () => {
      const error = AppError.fromHttpStatus(404, 'User')
      expect(error.message).toBe('User not found')
    })

    it('maps 409 to conflict error', () => {
      const error = AppError.fromHttpStatus(409)
      expect(error.category).toBe(ErrorCategory.CONFLICT)
    })

    it('maps 500 to server error', () => {
      const error = AppError.fromHttpStatus(500)
      expect(error.category).toBe(ErrorCategory.SERVER)
    })

    it('maps 502 to server error', () => {
      const error = AppError.fromHttpStatus(502)
      expect(error.category).toBe(ErrorCategory.SERVER)
    })

    it('maps 503 to server error', () => {
      const error = AppError.fromHttpStatus(503)
      expect(error.category).toBe(ErrorCategory.SERVER)
    })

    it('maps unknown status to unknown error', () => {
      const error = AppError.fromHttpStatus(418)
      expect(error.category).toBe(ErrorCategory.UNKNOWN)
    })

    it('uses default message for unknown status', () => {
      const error = AppError.fromHttpStatus(418)
      expect(error.message).toBe('Unknown error')
    })
  })

  // ==========================================================================
  // isRetryable
  // ==========================================================================
  describe('isRetryable', () => {
    it('returns true for network errors', () => {
      const error = AppError.network('timeout')
      expect(error.isRetryable()).toBe(true)
    })

    it('returns true for server errors', () => {
      const error = AppError.server()
      expect(error.isRetryable()).toBe(true)
    })

    it('returns false for validation errors', () => {
      const error = AppError.validation('bad input')
      expect(error.isRetryable()).toBe(false)
    })

    it('returns false for authentication errors', () => {
      const error = AppError.authentication()
      expect(error.isRetryable()).toBe(false)
    })

    it('returns false for not found errors', () => {
      const error = AppError.notFound('User')
      expect(error.isRetryable()).toBe(false)
    })

    it('returns false for unknown errors', () => {
      const error = new AppError('unknown')
      expect(error.isRetryable()).toBe(false)
    })
  })

  // ==========================================================================
  // toJSON
  // ==========================================================================
  describe('toJSON', () => {
    it('serializes to JSON', () => {
      const error = new AppError('Test error', ErrorCategory.VALIDATION, {
        severity: ErrorSeverity.WARNING,
        code: 'TEST',
        details: { key: 'value' },
      })

      const json = error.toJSON()

      expect(json.name).toBe('AppError')
      expect(json.message).toBe('Test error')
      expect(json.category).toBe('VALIDATION')
      expect(json.severity).toBe('WARNING')
      expect(json.code).toBe('TEST')
      expect(json.timestamp).toBeDefined()
      expect(json.details).toEqual({ key: 'value' })
      expect(json.stack).toBeDefined()
    })
  })

  // ==========================================================================
  // ErrorCategory constants
  // ==========================================================================
  describe('ErrorCategory', () => {
    it('has all expected categories', () => {
      expect(ErrorCategory.VALIDATION).toBe('VALIDATION')
      expect(ErrorCategory.NETWORK).toBe('NETWORK')
      expect(ErrorCategory.AUTHENTICATION).toBe('AUTHENTICATION')
      expect(ErrorCategory.AUTHORIZATION).toBe('AUTHORIZATION')
      expect(ErrorCategory.NOT_FOUND).toBe('NOT_FOUND')
      expect(ErrorCategory.CONFLICT).toBe('CONFLICT')
      expect(ErrorCategory.SERVER).toBe('SERVER')
      expect(ErrorCategory.UNKNOWN).toBe('UNKNOWN')
    })
  })

  // ==========================================================================
  // ErrorSeverity constants
  // ==========================================================================
  describe('ErrorSeverity', () => {
    it('has all expected severities', () => {
      expect(ErrorSeverity.INFO).toBe('INFO')
      expect(ErrorSeverity.WARNING).toBe('WARNING')
      expect(ErrorSeverity.ERROR).toBe('ERROR')
      expect(ErrorSeverity.CRITICAL).toBe('CRITICAL')
    })
  })
})
