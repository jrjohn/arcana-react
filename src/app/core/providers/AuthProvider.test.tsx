import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthProvider'

// Test component that uses the auth context
function TestComponent() {
  const { currentUser, isAuthenticated, login, logout, updateUser } = useAuth()

  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user-email">{currentUser?.email || 'none'}</div>
      <div data-testid="user-name">{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'none'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updateUser({ firstName: 'Updated' })}>Update</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
    localStorage.removeItem = vi.fn()
  })

  it('should provide default authenticated user (demo mode)', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Default demo user should be logged in
    expect(screen.getByTestId('authenticated')).toHaveTextContent('yes')
    expect(screen.getByTestId('user-email')).toHaveTextContent('admin@arcana.io')
  })

  it('should provide login function', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      await user.click(screen.getByText('Login'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes')
    })
  })

  it('should provide logout function', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      await user.click(screen.getByText('Logout'))
    })

    expect(screen.getByTestId('authenticated')).toHaveTextContent('no')
    expect(screen.getByTestId('user-email')).toHaveTextContent('none')
    expect(localStorage.removeItem).toHaveBeenCalled()
  })

  it('should provide updateUser function', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      await user.click(screen.getByText('Update'))
    })

    expect(screen.getByTestId('user-name')).toHaveTextContent('Updated')
  })

  it('should load stored auth from localStorage', () => {
    const storedUser = {
      id: '2',
      email: 'stored@example.com',
      firstName: 'Stored',
      lastName: 'User',
      role: 'User',
      status: 'online',
    }

    localStorage.getItem = vi.fn((key) => {
      if (key === 'arcana_auth_token') return 'stored-token'
      if (key === 'arcana_current_user') return JSON.stringify(storedUser)
      return null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user-email')).toHaveTextContent('stored@example.com')
  })

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})
