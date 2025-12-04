// =============================================================================
// Application Error Model
// =============================================================================

/**
 * Error categories for classification
 */
export const ErrorCategory = {
  VALIDATION: 'VALIDATION',
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
} as const

export type ErrorCategory = (typeof ErrorCategory)[keyof typeof ErrorCategory]

/**
 * Severity levels for errors
 */
export const ErrorSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
} as const

export type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity]

/**
 * Application Error class
 * Standardized error handling across the application
 */
export class AppError extends Error {
  readonly category: ErrorCategory
  readonly severity: ErrorSeverity
  readonly code: string
  readonly timestamp: Date
  readonly details?: Record<string, unknown>
  readonly originalError?: Error

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    options?: {
      severity?: ErrorSeverity
      code?: string
      details?: Record<string, unknown>
      originalError?: Error
    }
  ) {
    super(message)
    this.name = 'AppError'
    this.category = category
    this.severity = options?.severity ?? ErrorSeverity.ERROR
    this.code = options?.code ?? `ERR_${category}`
    this.timestamp = new Date()
    this.details = options?.details
    this.originalError = options?.originalError

    // Maintain proper stack trace (V8 engines like Chrome/Node)
    const ErrorConstructor = Error as ErrorConstructor & {
      captureStackTrace?: (target: object, constructor: Function) => void
    }
    if (typeof ErrorConstructor.captureStackTrace === 'function') {
      ErrorConstructor.captureStackTrace(this, AppError)
    }
  }

  /**
   * Create a validation error
   */
  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, ErrorCategory.VALIDATION, {
      severity: ErrorSeverity.WARNING,
      code: 'ERR_VALIDATION',
      details,
    })
  }

  /**
   * Create a network error
   */
  static network(message: string, originalError?: Error): AppError {
    return new AppError(message, ErrorCategory.NETWORK, {
      severity: ErrorSeverity.ERROR,
      code: 'ERR_NETWORK',
      originalError,
    })
  }

  /**
   * Create an authentication error
   */
  static authentication(message: string = 'Authentication required'): AppError {
    return new AppError(message, ErrorCategory.AUTHENTICATION, {
      severity: ErrorSeverity.WARNING,
      code: 'ERR_AUTH',
    })
  }

  /**
   * Create an authorization error
   */
  static authorization(message: string = 'Access denied'): AppError {
    return new AppError(message, ErrorCategory.AUTHORIZATION, {
      severity: ErrorSeverity.WARNING,
      code: 'ERR_FORBIDDEN',
    })
  }

  /**
   * Create a not found error
   */
  static notFound(resource: string): AppError {
    return new AppError(`${resource} not found`, ErrorCategory.NOT_FOUND, {
      severity: ErrorSeverity.WARNING,
      code: 'ERR_NOT_FOUND',
      details: { resource },
    })
  }

  /**
   * Create a conflict error
   */
  static conflict(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, ErrorCategory.CONFLICT, {
      severity: ErrorSeverity.WARNING,
      code: 'ERR_CONFLICT',
      details,
    })
  }

  /**
   * Create a server error
   */
  static server(message: string = 'Internal server error', originalError?: Error): AppError {
    return new AppError(message, ErrorCategory.SERVER, {
      severity: ErrorSeverity.CRITICAL,
      code: 'ERR_SERVER',
      originalError,
    })
  }

  /**
   * Create from HTTP status code
   */
  static fromHttpStatus(status: number, message?: string): AppError {
    switch (status) {
      case 400:
        return AppError.validation(message ?? 'Bad request')
      case 401:
        return AppError.authentication(message)
      case 403:
        return AppError.authorization(message)
      case 404:
        return AppError.notFound(message ?? 'Resource')
      case 409:
        return AppError.conflict(message ?? 'Resource conflict')
      case 500:
      case 502:
      case 503:
        return AppError.server(message)
      default:
        return new AppError(message ?? 'Unknown error', ErrorCategory.UNKNOWN)
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return (
      this.category === ErrorCategory.NETWORK || this.category === ErrorCategory.SERVER
    )
  }

  /**
   * Convert to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      details: this.details,
      stack: this.stack,
    }
  }
}
