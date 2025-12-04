// =============================================================================
// Domain Layer Exports
// =============================================================================

// Entities
export type {
  User,
  CreateUserDto,
  UpdateUserDto,
  UserValidationErrors,
  PaginatedResponse,
  PaginationParams,
} from './entities/user.model'

export {
  AppError,
  ErrorCategory,
  ErrorSeverity,
} from './entities/app-error.model'

// Validators
export { userValidator, isValidUser } from './validators/userValidator'

// Services
export { sanitizationService } from './services/sanitizationService'
export {
  networkStatusService,
  NetworkStatus,
} from './services/networkStatusService'
export type { NetworkInfo, ConnectionQuality } from './services/networkStatusService'
