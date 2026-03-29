// =============================================================================
// DI Provider Tests
// =============================================================================

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DIProvider, useDIContainer, useService, useUserService } from './DIProvider'
import { DIContainer, ServiceTokens } from './container'
import type { UserService } from '@/app/domain/services/userService'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockUserService(): UserService {
  return {
    getById: async () => ({ success: true, data: undefined }),
    getList: async () => ({
      success: true,
      data: { data: [], page: 1, pageSize: 10, total: 0, totalPages: 0 },
    }),
    create: async () => ({ success: true, data: undefined }),
    update: async () => ({ success: true, data: undefined }),
    delete: async () => ({ success: true }),
    isOnline: () => true,
    syncPendingOperations: async () => {},
    clearCache: async () => {},
  } as unknown as UserService
}

function makeContainer(service?: UserService): DIContainer {
  const c = new DIContainer()
  c.register(ServiceTokens.UserService, service ?? createMockUserService())
  return c
}

// ---------------------------------------------------------------------------
// Hook consumer helpers
// ---------------------------------------------------------------------------

function ContainerConsumer() {
  const container = useDIContainer()
  return <div data-testid="container">{container ? 'has-container' : 'no-container'}</div>
}

function ServiceConsumer() {
  const svc = useService(ServiceTokens.UserService)
  return <div data-testid="service">{svc ? 'has-service' : 'no-service'}</div>
}

function UserServiceConsumer() {
  const svc = useUserService()
  return <div data-testid="user-service">{svc ? 'has-user-service' : 'none'}</div>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DIProvider', () => {
  it('renders children inside provider', () => {
    render(
      <DIProvider container={makeContainer()}>
        <span data-testid="child">hello</span>
      </DIProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('provides the container to descendants via useDIContainer', () => {
    render(
      <DIProvider container={makeContainer()}>
        <ContainerConsumer />
      </DIProvider>
    )
    expect(screen.getByTestId('container')).toHaveTextContent('has-container')
  })

  it('provides the service to descendants via useService', () => {
    render(
      <DIProvider container={makeContainer()}>
        <ServiceConsumer />
      </DIProvider>
    )
    expect(screen.getByTestId('service')).toHaveTextContent('has-service')
  })

  it('provides the UserService via useUserService convenience hook', () => {
    render(
      <DIProvider container={makeContainer()}>
        <UserServiceConsumer />
      </DIProvider>
    )
    expect(screen.getByTestId('user-service')).toHaveTextContent('has-user-service')
  })

  it('memoizes the same container across renders', () => {
    const container = makeContainer()
    const { rerender } = render(
      <DIProvider container={container}>
        <ContainerConsumer />
      </DIProvider>
    )
    // Re-render with same container — should not cause issues
    rerender(
      <DIProvider container={container}>
        <ContainerConsumer />
      </DIProvider>
    )
    expect(screen.getByTestId('container')).toHaveTextContent('has-container')
  })
})

describe('useDIContainer - error case', () => {
  it('throws when used outside DIProvider', () => {
    // Suppress console.error from React error boundary
    const originalError = console.error
    console.error = () => {}

    function BadConsumer() {
      useDIContainer()
      return null
    }

    expect(() => render(<BadConsumer />)).toThrow(
      'useDIContainer must be used within a DIProvider'
    )

    console.error = originalError
  })
})
