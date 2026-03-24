import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { User, PaginatedResponse } from '@/app/domain/entities/user.model'
import type { ServiceResult, UserService } from '@/app/domain/services/userService'

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

import { useUserListViewModel } from './userListViewModel'

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

function createPaginatedResponse(
  users: User[],
  page = 1,
  total?: number,
  totalPages?: number
): ServiceResult<PaginatedResponse<User>> {
  const t = total ?? users.length
  return {
    success: true,
    data: {
      data: users,
      page,
      pageSize: 6,
      total: t,
      totalPages: totalPages ?? Math.ceil(t / 6),
    },
  }
}

/** Flush microtasks so fire-and-forget promises in useEffect resolve */
function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// =============================================================================
// Tests
// =============================================================================

describe('useUserListViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: getList returns empty
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse([])
    )
    vi.mocked(mockUserService.isOnline).mockReturnValue(true)
  })

  // ---------------------------------------------------------------------------
  // Initial State
  // ---------------------------------------------------------------------------

  it('should initialize with loading state and fetch users on mount', async () => {
    const users = [createMockUser(), createMockUser({ id: '2', firstName: 'Jane' })]
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse(users, 1, 2)
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.users).toHaveLength(2)
    expect(result.current.output.currentPage).toBe(1)
    expect(result.current.output.isOnline).toBe(true)
    expect(mockUserService.getList).toHaveBeenCalledWith(
      { page: 1, pageSize: 6 },
      undefined
    )
  })

  it('should have correct initial output shape', async () => {
    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    const output = result.current.output
    expect(output).toHaveProperty('users')
    expect(output).toHaveProperty('totalPages')
    expect(output).toHaveProperty('totalItems')
    expect(output).toHaveProperty('currentPage')
    expect(output).toHaveProperty('pageSize')
    expect(output).toHaveProperty('searchQuery')
    expect(output).toHaveProperty('isLoading')
    expect(output).toHaveProperty('isRefreshing')
    expect(output).toHaveProperty('error')
    expect(output).toHaveProperty('successMessage')
    expect(output).toHaveProperty('isOnline')
    expect(output).toHaveProperty('filteredUsers')
    expect(output).toHaveProperty('startItem')
    expect(output).toHaveProperty('endItem')
  })

  // ---------------------------------------------------------------------------
  // LOAD_USERS
  // ---------------------------------------------------------------------------

  it('should load users for a specific page', async () => {
    const users = [createMockUser()]
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse(users, 2, 12, 2)
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.dispatch({ type: 'LOAD_USERS', page: 2 })
    })

    expect(result.current.output.currentPage).toBe(2)
  })

  it('should handle load users error', async () => {
    vi.mocked(mockUserService.getList).mockResolvedValue({
      success: false,
      error: 'Network error',
    })

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.error).toBe('Network error')
  })

  it('should use fallback error message when no error text returned', async () => {
    vi.mocked(mockUserService.getList).mockResolvedValue({
      success: false,
    })

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.error).toBe('Failed to load users')
  })

  // ---------------------------------------------------------------------------
  // REFRESH_USERS
  // ---------------------------------------------------------------------------

  it('should refresh users with isRefreshing state', async () => {
    const initialUsers = [createMockUser()]
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse(initialUsers)
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    const refreshedUsers = [
      createMockUser(),
      createMockUser({ id: '2', firstName: 'Jane' }),
    ]
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse(refreshedUsers, 1, 2)
    )

    await act(async () => {
      await result.current.dispatch({ type: 'REFRESH_USERS' })
    })

    expect(result.current.output.users).toHaveLength(2)
    expect(result.current.output.isRefreshing).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // SET_SEARCH_QUERY / CLEAR_SEARCH
  // ---------------------------------------------------------------------------

  it('should set search query', async () => {
    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.dispatch({ type: 'SET_SEARCH_QUERY', query: 'John' })
    })

    expect(result.current.output.searchQuery).toBe('John')
  })

  it('should clear search query', async () => {
    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.dispatch({ type: 'SET_SEARCH_QUERY', query: 'John' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'CLEAR_SEARCH' })
    })

    expect(result.current.output.searchQuery).toBe('')
  })

  it('should filter users by search query (firstName, lastName, email)', async () => {
    const users = [
      createMockUser({ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }),
      createMockUser({ id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }),
      createMockUser({ id: '3', firstName: 'Bob', lastName: 'Johnson', email: 'bob@test.com' }),
    ]
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse(users, 1, 3)
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    // Search by first name
    await act(async () => {
      await result.current.dispatch({ type: 'SET_SEARCH_QUERY', query: 'jane' })
    })

    expect(result.current.output.filteredUsers).toHaveLength(1)
    expect(result.current.output.filteredUsers[0].firstName).toBe('Jane')

    // Search by email
    await act(async () => {
      await result.current.dispatch({ type: 'SET_SEARCH_QUERY', query: 'bob@test' })
    })

    expect(result.current.output.filteredUsers).toHaveLength(1)
    expect(result.current.output.filteredUsers[0].firstName).toBe('Bob')

    // Search by last name
    await act(async () => {
      await result.current.dispatch({ type: 'SET_SEARCH_QUERY', query: 'doe' })
    })

    expect(result.current.output.filteredUsers).toHaveLength(1)
    expect(result.current.output.filteredUsers[0].lastName).toBe('Doe')
  })

  it('should return all users when search query is empty', async () => {
    const users = [
      createMockUser({ id: '1' }),
      createMockUser({ id: '2' }),
    ]
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse(users, 1, 2)
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.filteredUsers).toHaveLength(2)
  })

  // ---------------------------------------------------------------------------
  // CHANGE_PAGE
  // ---------------------------------------------------------------------------

  it('should change page and fetch users', async () => {
    const page1Users = [createMockUser({ id: '1' })]
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse(page1Users, 1, 12, 2)
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.totalPages).toBe(2)

    const page2Users = [createMockUser({ id: '7' })]
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse(page2Users, 2, 12, 2)
    )

    await act(async () => {
      await result.current.dispatch({ type: 'CHANGE_PAGE', page: 2 })
    })

    expect(result.current.output.currentPage).toBe(2)
  })

  it('should not change page if page is out of range', async () => {
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse([createMockUser()], 1, 6, 1)
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    const callCountBefore = vi.mocked(mockUserService.getList).mock.calls.length

    // Page 5 is out of range (totalPages = 1)
    await act(async () => {
      await result.current.dispatch({ type: 'CHANGE_PAGE', page: 5 })
    })

    // getList should not have been called again
    expect(vi.mocked(mockUserService.getList).mock.calls.length).toBe(callCountBefore)
    expect(result.current.output.currentPage).toBe(1)
  })

  it('should not change to page 0 or negative', async () => {
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse([createMockUser()], 1, 6, 1)
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    const callCountBefore = vi.mocked(mockUserService.getList).mock.calls.length

    await act(async () => {
      await result.current.dispatch({ type: 'CHANGE_PAGE', page: 0 })
    })

    expect(vi.mocked(mockUserService.getList).mock.calls.length).toBe(callCountBefore)
  })

  // ---------------------------------------------------------------------------
  // DELETE_USER
  // ---------------------------------------------------------------------------

  it('should delete user and show success message', async () => {
    const user = createMockUser({ id: '1', firstName: 'John', lastName: 'Doe' })
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse([user], 1, 1)
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    vi.mocked(mockUserService.delete).mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.dispatch({ type: 'DELETE_USER', user })
    })

    expect(result.current.output.users).toHaveLength(0)
    expect(result.current.output.totalItems).toBe(0)
    expect(result.current.output.successMessage).toBe(
      'User John Doe deleted successfully'
    )
  })

  it('should handle delete user error', async () => {
    const user = createMockUser()
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse([user])
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    vi.mocked(mockUserService.delete).mockResolvedValue({
      success: false,
      error: 'Cannot delete user',
    })

    await act(async () => {
      await result.current.dispatch({ type: 'DELETE_USER', user })
    })

    expect(result.current.output.error).toBe('Cannot delete user')
    // User should still be in the list
    expect(result.current.output.users).toHaveLength(1)
  })

  it('should use fallback error when delete has no error message', async () => {
    const user = createMockUser()
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse([user])
    )

    const { result } = renderHook(() => useUserListViewModel())

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
      await result.current.dispatch({ type: 'DELETE_USER', user })
    })

    expect(result.current.output.error).toBe('Failed to delete user')
  })

  // ---------------------------------------------------------------------------
  // DISMISS_ERROR / DISMISS_SUCCESS
  // ---------------------------------------------------------------------------

  it('should dismiss error', async () => {
    vi.mocked(mockUserService.getList).mockResolvedValue({
      success: false,
      error: 'Some error',
    })

    const { result } = renderHook(() => useUserListViewModel())

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

  it('should dismiss success message', async () => {
    const user = createMockUser()
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse([user])
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    vi.mocked(mockUserService.delete).mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.dispatch({ type: 'DELETE_USER', user })
    })

    expect(result.current.output.successMessage).not.toBeNull()

    await act(async () => {
      await result.current.dispatch({ type: 'DISMISS_SUCCESS' })
    })

    expect(result.current.output.successMessage).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  it('should navigate to create page', async () => {
    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.dispatch({ type: 'NAVIGATE_TO_CREATE' })
    })

    await act(async () => {
      await flushPromises()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/users/new')
  })

  it('should navigate to detail page', async () => {
    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.dispatch({ type: 'NAVIGATE_TO_DETAIL', id: '42' })
    })

    await act(async () => {
      await flushPromises()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/users/42')
  })

  it('should navigate to edit page', async () => {
    const { result } = renderHook(() => useUserListViewModel())

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
  // Pagination Info Computation
  // ---------------------------------------------------------------------------

  it('should compute correct pagination info', async () => {
    const users = Array.from({ length: 6 }, (_, i) =>
      createMockUser({ id: String(i + 1) })
    )
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse(users, 1, 18, 3)
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.startItem).toBe(1)
    expect(result.current.output.endItem).toBe(6)
    expect(result.current.output.totalItems).toBe(18)
    expect(result.current.output.totalPages).toBe(3)
  })

  it('should compute zero pagination info when no items', async () => {
    vi.mocked(mockUserService.getList).mockResolvedValue(
      createPaginatedResponse([], 1, 0, 1)
    )

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.startItem).toBe(0)
    expect(result.current.output.endItem).toBe(0)
    expect(result.current.output.totalItems).toBe(0)
  })

  // ---------------------------------------------------------------------------
  // Online Status
  // ---------------------------------------------------------------------------

  it('should reflect online status from service', async () => {
    vi.mocked(mockUserService.isOnline).mockReturnValue(false)

    const { result } = renderHook(() => useUserListViewModel())

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isLoading).toBe(false)
    })

    expect(result.current.output.isOnline).toBe(false)
  })
})
