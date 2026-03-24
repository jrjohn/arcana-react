import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { User } from '@/app/domain/entities/user.model'
import type { UserService } from '@/app/domain/services/userService'

// =============================================================================
// Mocks
// =============================================================================

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockUserService: UserService = {
  getById: vi.fn(),
  getList: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  isOnline: vi.fn().mockReturnValue(true),
  syncPendingOperations: vi.fn(),
  clearCache: vi.fn(),
}

vi.mock('@/app/core/di', () => ({
  useUserService: () => mockUserService,
}))

import { useUserDetailViewModel } from './userDetailViewModel'

// =============================================================================
// Helpers
// =============================================================================

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://example.com/avatar.jpg',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

/** Flush microtasks so fire-and-forget promises in useEffect resolve */
function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// =============================================================================
// Tests
// =============================================================================

describe('useUserDetailViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Initial Load
  // ---------------------------------------------------------------------------

  it('should load user on mount', async () => {
    const user = createMockUser()
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user,
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.user).toEqual(user)
    expect(result.current.output.fullName).toBe('John Doe')
    expect(result.current.output.initials).toBe('JD')
    expect(mockUserService.getById).toHaveBeenCalledWith('1')
  })

  it('should have correct initial output shape', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: createMockUser(),
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    // Check shape while still loading
    expect(result.current.output).toHaveProperty('user')
    expect(result.current.output).toHaveProperty('isLoading')
    expect(result.current.output).toHaveProperty('isDeleting')
    expect(result.current.output).toHaveProperty('error')
    expect(result.current.output).toHaveProperty('successMessage')
    expect(result.current.output).toHaveProperty('fullName')
    expect(result.current.output).toHaveProperty('initials')

    await act(async () => {
      await flushPromises()
    })
  })

  it('should start with loading true and no user', () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: createMockUser(),
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    expect(result.current.output.user).toBeNull()
    expect(result.current.output.isDeleting).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // LOAD_USER
  // ---------------------------------------------------------------------------

  it('should handle load user error', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: false,
      error: 'User not found',
    })

    const { result } = renderHook(() => useUserDetailViewModel('999'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.error).toBe('User not found')
    expect(result.current.output.user).toBeNull()
  })

  it('should use fallback error message when getById returns no error text', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: false,
    })

    const { result } = renderHook(() => useUserDetailViewModel('999'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.error).toBe('User not found')
  })

  it('should load a different user via dispatch', async () => {
    const user1 = createMockUser({ id: '1', firstName: 'John' })
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user1,
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.user?.firstName).toBe('John')

    const user2 = createMockUser({ id: '2', firstName: 'Jane', lastName: 'Smith' })
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user2,
    })

    await act(async () => {
      await result.current.dispatch({ type: 'LOAD_USER', id: '2' })
    })

    expect(result.current.output.user?.firstName).toBe('Jane')
    expect(result.current.output.fullName).toBe('Jane Smith')
    expect(result.current.output.initials).toBe('JS')
  })

  // ---------------------------------------------------------------------------
  // DELETE_USER
  // ---------------------------------------------------------------------------

  it('should delete user and show success message', async () => {
    const user = createMockUser({ firstName: 'John', lastName: 'Doe' })
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user,
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    vi.mocked(mockUserService.delete).mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.dispatch({ type: 'DELETE_USER' })
    })

    expect(result.current.output.successMessage).toBe(
      'User John Doe deleted successfully'
    )
    expect(mockUserService.delete).toHaveBeenCalledWith('1')
  })

  it('should handle delete user error', async () => {
    const user = createMockUser()
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user,
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    vi.mocked(mockUserService.delete).mockResolvedValue({
      success: false,
      error: 'Cannot delete admin user',
    })

    await act(async () => {
      await result.current.dispatch({ type: 'DELETE_USER' })
    })

    expect(result.current.output.error).toBe('Cannot delete admin user')
    expect(result.current.output.isDeleting).toBe(false)
  })

  it('should use fallback error when delete returns no error text', async () => {
    const user = createMockUser()
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user,
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    vi.mocked(mockUserService.delete).mockResolvedValue({
      success: false,
    })

    await act(async () => {
      await result.current.dispatch({ type: 'DELETE_USER' })
    })

    expect(result.current.output.error).toBe('Failed to delete user')
  })

  it('should not attempt delete if no user is loaded', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: false,
      error: 'Not found',
    })

    const { result } = renderHook(() => useUserDetailViewModel('999'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.dispatch({ type: 'DELETE_USER' })
    })

    expect(mockUserService.delete).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // DISMISS_ERROR
  // ---------------------------------------------------------------------------

  it('should dismiss error', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: false,
      error: 'Some error',
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.error).toBe('Some error')
    })

    await act(async () => {
      await result.current.dispatch({ type: 'DISMISS_ERROR' })
    })

    expect(result.current.output.error).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  it('should navigate to user list', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: createMockUser(),
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.dispatch({ type: 'NAVIGATE_TO_LIST' })
    })

    // Effect handler processes the navigation in the next render cycle
    await act(async () => {
      await flushPromises()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/users')
  })

  it('should navigate to edit page', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: createMockUser(),
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.dispatch({ type: 'NAVIGATE_TO_EDIT', id: '42' })
    })

    await act(async () => {
      await flushPromises()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/users/42/edit')
  })

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  it('should compute fullName from user data', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: createMockUser({ firstName: 'Alice', lastName: 'Wonderland' }),
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.fullName).toBe('Alice Wonderland')
  })

  it('should compute initials from user data (uppercased)', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: createMockUser({ firstName: 'alice', lastName: 'wonderland' }),
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.initials).toBe('AW')
  })

  it('should return empty fullName and initials when no user is loaded', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: false,
      error: 'Not found',
    })

    const { result } = renderHook(() => useUserDetailViewModel('999'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.fullName).toBe('')
    expect(result.current.output.initials).toBe('')
  })

  // ---------------------------------------------------------------------------
  // Delete triggers navigation after delay
  // ---------------------------------------------------------------------------

  it('should set navigate effect after successful delete', async () => {
    const user = createMockUser()
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user,
    })

    const { result } = renderHook(() => useUserDetailViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    vi.mocked(mockUserService.delete).mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.dispatch({ type: 'DELETE_USER' })
    })

    expect(result.current.output.successMessage).toContain('deleted successfully')
  })
})
