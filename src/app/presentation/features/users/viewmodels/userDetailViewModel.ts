// =============================================================================
// User Detail ViewModel - UDF Input/Output/Effect Pattern
// =============================================================================
// Implements strict Unidirectional Data Flow:
// - Input: Discriminated union of all possible user actions
// - Output: Immutable state derived from reducer
// - Effect: Side effects triggered by state changes (navigation, toasts, etc.)
//
// Data Flow: UI -> Input -> Reducer -> Output -> UI
//            Effect handles side effects outside the main flow
// =============================================================================

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '@/app/domain/entities/user.model'
import { useUserService } from '@/app/core/di'

// =============================================================================
// Input Types (User Actions)
// =============================================================================

export type UserDetailInput =
  | { type: 'LOAD_USER'; id: string }
  | { type: 'DELETE_USER' }
  | { type: 'DISMISS_ERROR' }
  | { type: 'NAVIGATE_TO_LIST' }
  | { type: 'NAVIGATE_TO_EDIT'; id: string }

// =============================================================================
// Output Types (State)
// =============================================================================

export interface UserDetailOutput {
  // Core data
  user: User | null

  // UI state
  isLoading: boolean
  isDeleting: boolean
  error: string | null
  successMessage: string | null

  // Computed values
  fullName: string
  initials: string
}

// =============================================================================
// Effect Types (Side Effects)
// =============================================================================

export type UserDetailEffect =
  | { type: 'NAVIGATE'; path: string }
  | { type: 'NAVIGATE_AFTER_DELAY'; path: string; delay: number }

// =============================================================================
// Internal State (Reducer State)
// =============================================================================

interface UserDetailState {
  user: User | null
  isLoading: boolean
  isDeleting: boolean
  error: string | null
  successMessage: string | null
  pendingEffect: UserDetailEffect | null
}

// =============================================================================
// Internal Actions (Reducer Actions)
// =============================================================================

type UserDetailAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DELETING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_EFFECT'; payload: UserDetailEffect | null }
  | { type: 'CLEAR_EFFECT' }

// =============================================================================
// Reducer (Pure Function)
// =============================================================================

const initialState: UserDetailState = {
  user: null,
  isLoading: true,
  isDeleting: false,
  error: null,
  successMessage: null,
  pendingEffect: null,
}

function userDetailReducer(state: UserDetailState, action: UserDetailAction): UserDetailState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null }
    case 'SET_DELETING':
      return { ...state, isDeleting: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isDeleting: false }
    case 'SET_SUCCESS':
      return { ...state, successMessage: action.payload }
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false }
    case 'SET_EFFECT':
      return { ...state, pendingEffect: action.payload }
    case 'CLEAR_EFFECT':
      return { ...state, pendingEffect: null }
    default:
      return state
  }
}

// =============================================================================
// Computed Values (Derived from State)
// =============================================================================

function computeFullName(user: User | null): string {
  return user ? `${user.firstName} ${user.lastName}` : ''
}

function computeInitials(user: User | null): string {
  return user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : ''
}

// =============================================================================
// ViewModel Hook
// =============================================================================

export interface UseUserDetailViewModel {
  output: UserDetailOutput
  dispatch: (input: UserDetailInput) => void
}

export function useUserDetailViewModel(userId: string): UseUserDetailViewModel {
  const navigate = useNavigate()
  const userService = useUserService()
  const [state, internalDispatch] = useReducer(userDetailReducer, initialState)
  const isInitialMount = useRef(true)

  // ==========================================================================
  // Effect Handler (Processes Side Effects)
  // ==========================================================================

  useEffect(() => {
    if (!state.pendingEffect) return

    const effect = state.pendingEffect

    switch (effect.type) {
      case 'NAVIGATE':
        navigate(effect.path)
        break
      case 'NAVIGATE_AFTER_DELAY':
        setTimeout(() => {
          navigate(effect.path)
        }, effect.delay)
        break
    }

    internalDispatch({ type: 'CLEAR_EFFECT' })
  }, [state.pendingEffect, navigate])

  // ==========================================================================
  // Input Handler (Processes User Actions)
  // ==========================================================================

  const dispatch = useCallback(
    async (input: UserDetailInput) => {
      switch (input.type) {
        case 'LOAD_USER': {
          internalDispatch({ type: 'SET_LOADING', payload: true })

          const result = await userService.getById(input.id)

          if (result.success && result.data) {
            internalDispatch({ type: 'SET_USER', payload: result.data })
          } else {
            internalDispatch({ type: 'SET_ERROR', payload: result.error || 'User not found' })
          }
          break
        }

        case 'DELETE_USER': {
          if (!state.user) return

          internalDispatch({ type: 'SET_DELETING', payload: true })

          const result = await userService.delete(state.user.id)

          if (result.success) {
            internalDispatch({
              type: 'SET_SUCCESS',
              payload: `User ${state.user.firstName} ${state.user.lastName} deleted successfully`,
            })
            internalDispatch({
              type: 'SET_EFFECT',
              payload: { type: 'NAVIGATE_AFTER_DELAY', path: '/users', delay: 1500 },
            })
          } else {
            internalDispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to delete user' })
            internalDispatch({ type: 'SET_DELETING', payload: false })
          }
          break
        }

        case 'DISMISS_ERROR':
          internalDispatch({ type: 'SET_ERROR', payload: null })
          break

        case 'NAVIGATE_TO_LIST':
          internalDispatch({ type: 'SET_EFFECT', payload: { type: 'NAVIGATE', path: '/users' } })
          break

        case 'NAVIGATE_TO_EDIT':
          internalDispatch({ type: 'SET_EFFECT', payload: { type: 'NAVIGATE', path: `/users/${input.id}/edit` } })
          break
      }
    },
    [state.user, userService]
  )

  // ==========================================================================
  // Initial Load
  // ==========================================================================

  useEffect(() => {
    if (isInitialMount.current && userId) {
      isInitialMount.current = false
      dispatch({ type: 'LOAD_USER', id: userId })
    }
  }, [userId, dispatch, userService])

  // ==========================================================================
  // Computed Output
  // ==========================================================================

  const output: UserDetailOutput = {
    user: state.user,
    isLoading: state.isLoading,
    isDeleting: state.isDeleting,
    error: state.error,
    successMessage: state.successMessage,
    fullName: computeFullName(state.user),
    initials: computeInitials(state.user),
  }

  return { output, dispatch }
}
