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

import { useUserFormViewModel } from './userFormViewModel'

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

describe('useUserFormViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Initial State (Create Mode)
  // ---------------------------------------------------------------------------

  it('should initialize in create mode with empty fields', () => {
    const { result } = renderHook(() => useUserFormViewModel())

    expect(result.current.output.firstName).toBe('')
    expect(result.current.output.lastName).toBe('')
    expect(result.current.output.email).toBe('')
    expect(result.current.output.avatar).toBe('')
    expect(result.current.output.isEditMode).toBe(false)
    expect(result.current.output.isLoading).toBe(false)
    expect(result.current.output.isSubmitting).toBe(false)
    expect(result.current.output.isDirty).toBe(false)
    expect(result.current.output.isValid).toBe(false)
    expect(result.current.output.hasErrors).toBe(false)
    expect(result.current.output.errors).toEqual({})
    expect(result.current.output.submitError).toBeNull()
    expect(result.current.output.successMessage).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Initial State (Edit Mode)
  // ---------------------------------------------------------------------------

  it('should load user data in edit mode', async () => {
    const user = createMockUser()
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user,
    })

    const { result } = renderHook(() => useUserFormViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isEditMode).toBe(true)
    })

    expect(result.current.output.firstName).toBe('John')
    expect(result.current.output.lastName).toBe('Doe')
    expect(result.current.output.email).toBe('john@example.com')
    expect(result.current.output.avatar).toBe('https://example.com/avatar.jpg')
    expect(result.current.output.isDirty).toBe(false)
    expect(result.current.output.isLoading).toBe(false)
  })

  it('should handle load user error in edit mode', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: false,
      error: 'User not found',
    })

    const { result } = renderHook(() => useUserFormViewModel('999'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.submitError).toBe('User not found')
    })

    expect(result.current.output.isLoading).toBe(false)
  })

  it('should use fallback error when load user returns no error text', async () => {
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: false,
    })

    const { result } = renderHook(() => useUserFormViewModel('999'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.submitError).toBe('User not found')
    })
  })

  // ---------------------------------------------------------------------------
  // SET_FIELD
  // ---------------------------------------------------------------------------

  it('should update field value and mark form as dirty', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({
        type: 'SET_FIELD',
        field: 'firstName',
        value: 'Jane',
      })
    })

    expect(result.current.output.firstName).toBe('Jane')
    expect(result.current.output.isDirty).toBe(true)
  })

  it('should clear field-specific error when field is updated', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    // First trigger a validation error
    await act(async () => {
      await result.current.dispatch({ type: 'VALIDATE_FIELD', field: 'firstName' })
    })

    expect(result.current.output.errors.firstName).not.toBeNull()

    // Now update the field, which should clear the error
    await act(async () => {
      await result.current.dispatch({
        type: 'SET_FIELD',
        field: 'firstName',
        value: 'Jane',
      })
    })

    expect(result.current.output.errors.firstName).toBeNull()
  })

  it('should update all form fields independently', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'Jane' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'lastName', value: 'Smith' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'email', value: 'jane@test.com' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'avatar', value: 'https://img.com/a.jpg' })
    })

    expect(result.current.output.firstName).toBe('Jane')
    expect(result.current.output.lastName).toBe('Smith')
    expect(result.current.output.email).toBe('jane@test.com')
    expect(result.current.output.avatar).toBe('https://img.com/a.jpg')
  })

  // ---------------------------------------------------------------------------
  // VALIDATE_FIELD
  // ---------------------------------------------------------------------------

  it('should validate firstName field', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    // Empty firstName should error
    await act(async () => {
      await result.current.dispatch({ type: 'VALIDATE_FIELD', field: 'firstName' })
    })

    expect(result.current.output.errors.firstName).toBe('First name is required')
    expect(result.current.output.hasErrors).toBe(true)
  })

  it('should validate email field', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'email', value: 'invalid' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'VALIDATE_FIELD', field: 'email' })
    })

    expect(result.current.output.errors.email).toBe('Please enter a valid email address')
  })

  it('should validate lastName field', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'lastName', value: 'A' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'VALIDATE_FIELD', field: 'lastName' })
    })

    expect(result.current.output.errors.lastName).toBe('Last name must be at least 2 characters')
  })

  it('should validate avatar field (optional, invalid URL)', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'avatar', value: 'not-a-url' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'VALIDATE_FIELD', field: 'avatar' })
    })

    expect(result.current.output.errors.avatar).toBe('Please enter a valid URL')
  })

  it('should pass validation for valid avatar URL', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'avatar', value: 'https://example.com/img.png' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'VALIDATE_FIELD', field: 'avatar' })
    })

    expect(result.current.output.errors.avatar).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // SUBMIT (Create Mode)
  // ---------------------------------------------------------------------------

  it('should submit form in create mode successfully', async () => {
    const createdUser = createMockUser({ id: '99', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' })
    vi.mocked(mockUserService.create).mockResolvedValue({
      success: true,
      data: createdUser,
    })

    const { result } = renderHook(() => useUserFormViewModel())

    // Fill fields
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'Jane' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'lastName', value: 'Smith' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'email', value: 'jane@test.com' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'SUBMIT' })
    })

    expect(mockUserService.create).toHaveBeenCalledWith({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      avatar: undefined,
    })
    expect(result.current.output.successMessage).toBe('User created successfully')
    expect(result.current.output.isSubmitting).toBe(false)
  })

  it('should not submit if validation fails', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    // Submit with empty fields
    await act(async () => {
      await result.current.dispatch({ type: 'SUBMIT' })
    })

    expect(mockUserService.create).not.toHaveBeenCalled()
    expect(result.current.output.errors.firstName).toBe('First name is required')
    expect(result.current.output.errors.lastName).toBe('Last name is required')
    expect(result.current.output.errors.email).toBe('Email is required')
  })

  it('should handle create error', async () => {
    vi.mocked(mockUserService.create).mockResolvedValue({
      success: false,
      error: 'Email already exists',
    })

    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'Jane' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'lastName', value: 'Smith' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'email', value: 'jane@test.com' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'SUBMIT' })
    })

    expect(result.current.output.submitError).toBe('Email already exists')
    expect(result.current.output.isSubmitting).toBe(false)
  })

  it('should use fallback error message on create failure', async () => {
    vi.mocked(mockUserService.create).mockResolvedValue({
      success: false,
    })

    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'Jane' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'lastName', value: 'Smith' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'email', value: 'jane@test.com' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'SUBMIT' })
    })

    expect(result.current.output.submitError).toBe('Failed to create user')
  })

  // ---------------------------------------------------------------------------
  // SUBMIT (Edit Mode)
  // ---------------------------------------------------------------------------

  it('should submit form in edit mode successfully', async () => {
    const user = createMockUser()
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user,
    })

    const { result } = renderHook(() => useUserFormViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isEditMode).toBe(true)
    })

    const updatedUser = createMockUser({ firstName: 'Updated' })
    vi.mocked(mockUserService.update).mockResolvedValue({
      success: true,
      data: updatedUser,
    })

    // Change a field to make dirty
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'Updated' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'SUBMIT' })
    })

    expect(mockUserService.update).toHaveBeenCalledWith('1', {
      firstName: 'Updated',
      lastName: 'Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg',
    })
    expect(result.current.output.successMessage).toBe('User updated successfully')
  })

  it('should handle update error in edit mode', async () => {
    const user = createMockUser()
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user,
    })

    const { result } = renderHook(() => useUserFormViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isEditMode).toBe(true)
    })

    vi.mocked(mockUserService.update).mockResolvedValue({
      success: false,
      error: 'Server error',
    })

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'Updated' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'SUBMIT' })
    })

    expect(result.current.output.submitError).toBe('Server error')
  })

  it('should use fallback error message on update failure', async () => {
    const user = createMockUser()
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user,
    })

    const { result } = renderHook(() => useUserFormViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isEditMode).toBe(true)
    })

    vi.mocked(mockUserService.update).mockResolvedValue({
      success: false,
    })

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'Updated' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'SUBMIT' })
    })

    expect(result.current.output.submitError).toBe('Failed to update user')
  })

  // ---------------------------------------------------------------------------
  // RESET
  // ---------------------------------------------------------------------------

  it('should reset form in create mode to initial state', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'Jane' })
    })

    expect(result.current.output.isDirty).toBe(true)
    expect(result.current.output.firstName).toBe('Jane')

    await act(async () => {
      await result.current.dispatch({ type: 'RESET' })
    })

    expect(result.current.output.firstName).toBe('')
    expect(result.current.output.lastName).toBe('')
    expect(result.current.output.email).toBe('')
    expect(result.current.output.isDirty).toBe(false)
    expect(result.current.output.errors).toEqual({})
  })

  it('should reset form in edit mode to original user data', async () => {
    const user = createMockUser({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' })
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user,
    })

    const { result } = renderHook(() => useUserFormViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isEditMode).toBe(true)
    })

    // Change field
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'Changed' })
    })

    expect(result.current.output.firstName).toBe('Changed')
    expect(result.current.output.isDirty).toBe(true)

    // Reset
    await act(async () => {
      await result.current.dispatch({ type: 'RESET' })
    })

    expect(result.current.output.firstName).toBe('John')
    expect(result.current.output.lastName).toBe('Doe')
    expect(result.current.output.isDirty).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // DISMISS_ERROR
  // ---------------------------------------------------------------------------

  it('should dismiss submit error', async () => {
    vi.mocked(mockUserService.create).mockResolvedValue({
      success: false,
      error: 'Some error',
    })

    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'Jane' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'lastName', value: 'Doe' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'email', value: 'jane@test.com' })
    })

    await act(async () => {
      await result.current.dispatch({ type: 'SUBMIT' })
    })

    expect(result.current.output.submitError).toBe('Some error')

    await act(async () => {
      await result.current.dispatch({ type: 'DISMISS_ERROR' })
    })

    expect(result.current.output.submitError).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // NAVIGATE_TO_LIST
  // ---------------------------------------------------------------------------

  it('should navigate to user list', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({ type: 'NAVIGATE_TO_LIST' })
    })

    await act(async () => {
      await flushPromises()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/users')
  })

  // ---------------------------------------------------------------------------
  // Computed: isValid
  // ---------------------------------------------------------------------------

  it('should compute isValid correctly', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    // Initially invalid (empty form, not dirty)
    expect(result.current.output.isValid).toBe(false)

    // Fill all required fields
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'Jane' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'lastName', value: 'Smith' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'email', value: 'jane@test.com' })
    })

    // Now should be valid (dirty + no errors + all fields filled)
    expect(result.current.output.isValid).toBe(true)
  })

  it('should not be valid when there are field errors', async () => {
    const { result } = renderHook(() => useUserFormViewModel())

    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'firstName', value: 'J' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'lastName', value: 'Smith' })
    })
    await act(async () => {
      await result.current.dispatch({ type: 'SET_FIELD', field: 'email', value: 'jane@test.com' })
    })

    // Trigger validation for firstName which is too short
    await act(async () => {
      await result.current.dispatch({ type: 'VALIDATE_FIELD', field: 'firstName' })
    })

    expect(result.current.output.isValid).toBe(false)
    expect(result.current.output.hasErrors).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // Edit mode: user without avatar
  // ---------------------------------------------------------------------------

  it('should handle user without avatar in edit mode', async () => {
    const user = createMockUser({ avatar: undefined })
    vi.mocked(mockUserService.getById).mockResolvedValue({
      success: true,
      data: user,
    })

    const { result } = renderHook(() => useUserFormViewModel('1'))

    await act(async () => {
      await flushPromises()
    })

    await waitFor(() => {
      expect(result.current.output.isEditMode).toBe(true)
    })

    expect(result.current.output.avatar).toBe('')
  })
})
