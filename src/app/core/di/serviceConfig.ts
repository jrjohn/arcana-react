// =============================================================================
// Service Configuration - DI Registration
// =============================================================================
// Configures and registers all services in the DI container.
// This is the composition root where implementations are bound to interfaces.
// =============================================================================

import { DIContainer, ServiceTokens } from './container'
import { userService } from '@/app/data/services/userServiceImpl'

// =============================================================================
// Service Registration
// =============================================================================

/**
 * Configure all services in the DI container
 * Call this once at application startup
 */
export function configureServices(container: DIContainer): void {
  // Register UserService implementation
  container.register(ServiceTokens.UserService, userService)

  // Future services can be registered here:
  // container.register(ServiceTokens.ProjectService, projectService)
  // container.register(ServiceTokens.AuthService, authService)
}

/**
 * Configure services with mock implementations (for testing)
 */
export function configureTestServices(
  container: DIContainer,
  mocks: Partial<{
    userService: typeof userService
  }> = {}
): void {
  // Use provided mocks or fall back to real implementations
  container.register(ServiceTokens.UserService, mocks.userService ?? userService)
}
