// =============================================================================
// User List ViewModel - UDF Input/Output/Effect Pattern
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
import type { User, PaginatedResponse } from '@/app/domain/entities/user.model'
import { useUserService } from '@/app/core/di'

// =============================================================================
// Input Types (User Actions)
// =============================================================================

export type UserListInput =
  | { type: 'LOAD_USERS'; page?: number }
  | { type: 'REFRESH_USERS' }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'CHANGE_PAGE'; page: number }
  | { type: 'DELETE_USER'; user: User }
  | { type: 'DISMISS_ERROR' }
  | { type: 'DISMISS_SUCCESS' }
  | { type: 'NAVIGATE_TO_CREATE' }
  | { type: 'NAVIGATE_TO_DETAIL'; id: string }
  | { type: 'NAVIGATE_TO_EDIT'; id: string }

// =============================================================================
// Output Types (State)
// =============================================================================

export interface UserListOutput {
  // Core data
  users: User[]
  totalPages: number
  totalItems: number
  currentPage: number
  pageSize: number
  searchQuery: string

  // UI state
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  successMessage: string | null
  isOnline: boolean

  // Computed values
  filteredUsers: User[]
  startItem: number
  endItem: number
}

// =============================================================================
// Effect Types (Side Effects)
// =============================================================================

export type UserListEffect =
  | { type: 'NAVIGATE'; path: string }
  | { type: 'SHOW_TOAST'; message: string; variant: 'success' | 'error' }
  | { type: 'AUTO_DISMISS_SUCCESS'; delay: number }

// =============================================================================
// Internal State (Reducer State)
// =============================================================================

interface UserListState {
  users: User[]
  totalPages: number
  totalItems: number
  currentPage: number
  pageSize: number
  searchQuery: string
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  successMessage: string | null
  isOnline: boolean
  pendingEffect: UserListEffect | null
}

// =============================================================================
// Internal Actions (Reducer Actions)
// =============================================================================

type UserListAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_USERS'; payload: PaginatedResponse<User> }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_EFFECT'; payload: UserListEffect | null }
  | { type: 'CLEAR_EFFECT' }

// =============================================================================
// Reducer (Pure Function)
// =============================================================================

const initialState: UserListState = {
  users: [],
  totalPages: 1,
  totalItems: 0,
  currentPage: 1,
  pageSize: 6,
  searchQuery: '',
  isLoading: true,
  isRefreshing: false,
  error: null,
  successMessage: null,
  isOnline: true,
  pendingEffect: null,
}

function userListReducer(state: UserListState, action: UserListAction): UserListState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null }
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isRefreshing: false }
    case 'SET_SUCCESS':
      return { ...state, successMessage: action.payload }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload }
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload }
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload.data,
        totalPages: action.payload.totalPages,
        totalItems: action.payload.total,
        currentPage: action.payload.page,
        isLoading: false,
        isRefreshing: false,
      }
    case 'REMOVE_USER':
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload),
        totalItems: state.totalItems - 1,
      }
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload }
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

function computeFilteredUsers(users: User[], searchQuery: string): User[] {
  if (!searchQuery) return users
  const query = searchQuery.toLowerCase()
  return users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
  )
}

function computePaginationInfo(currentPage: number, pageSize: number, totalItems: number) {
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(currentPage * pageSize, totalItems)
  return { startItem, endItem }
}

// =============================================================================
// ViewModel Hook
// =============================================================================

export interface UseUserListViewModel {
  output: UserListOutput
  dispatch: (input: UserListInput) => void
}

export function useUserListViewModel(): UseUserListViewModel {
  const navigate = useNavigate()
  const userService = useUserService()
  const [state, internalDispatch] = useReducer(userListReducer, initialState)
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
      case 'AUTO_DISMISS_SUCCESS':
        setTimeout(() => {
          internalDispatch({ type: 'SET_SUCCESS', payload: null })
        }, effect.delay)
        break
      // SHOW_TOAST would integrate with a toast library
    }

    internalDispatch({ type: 'CLEAR_EFFECT' })
  }, [state.pendingEffect, navigate])

  // ==========================================================================
  // Input Handler (Processes User Actions)
  // ==========================================================================

  const dispatch = useCallback(
    async (input: UserListInput) => {
      switch (input.type) {
        case 'LOAD_USERS': {
          const page = input.page ?? state.currentPage
          internalDispatch({ type: 'SET_LOADING', payload: true })

          const result = await userService.getList(
            { page, pageSize: state.pageSize },
            state.searchQuery || undefined
          )

          if (result.success && result.data) {
            internalDispatch({ type: 'SET_USERS', payload: result.data })
          } else {
            internalDispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to load users' })
          }
          break
        }

        case 'REFRESH_USERS': {
          internalDispatch({ type: 'SET_REFRESHING', payload: true })

          const result = await userService.getList(
            { page: state.currentPage, pageSize: state.pageSize },
            state.searchQuery || undefined
          )

          if (result.success && result.data) {
            internalDispatch({ type: 'SET_USERS', payload: result.data })
          } else {
            internalDispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to refresh users' })
          }
          break
        }

        case 'SET_SEARCH_QUERY':
          internalDispatch({ type: 'SET_SEARCH', payload: input.query })
          break

        case 'CLEAR_SEARCH':
          internalDispatch({ type: 'SET_SEARCH', payload: '' })
          break

        case 'CHANGE_PAGE':
          if (input.page >= 1 && input.page <= state.totalPages) {
            internalDispatch({ type: 'SET_PAGE', payload: input.page })
            // Trigger load for new page
            internalDispatch({ type: 'SET_LOADING', payload: true })
            const result = await userService.getList(
              { page: input.page, pageSize: state.pageSize },
              state.searchQuery || undefined
            )
            if (result.success && result.data) {
              internalDispatch({ type: 'SET_USERS', payload: result.data })
            } else {
              internalDispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to load users' })
            }
          }
          break

        case 'DELETE_USER': {
          const result = await userService.delete(input.user.id)

          if (result.success) {
            internalDispatch({ type: 'REMOVE_USER', payload: input.user.id })
            internalDispatch({
              type: 'SET_SUCCESS',
              payload: `User ${input.user.firstName} ${input.user.lastName} deleted successfully`,
            })
            internalDispatch({
              type: 'SET_EFFECT',
              payload: { type: 'AUTO_DISMISS_SUCCESS', delay: 5000 },
            })
          } else {
            internalDispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to delete user' })
          }
          break
        }

        case 'DISMISS_ERROR':
          internalDispatch({ type: 'SET_ERROR', payload: null })
          break

        case 'DISMISS_SUCCESS':
          internalDispatch({ type: 'SET_SUCCESS', payload: null })
          break

        case 'NAVIGATE_TO_CREATE':
          internalDispatch({ type: 'SET_EFFECT', payload: { type: 'NAVIGATE', path: '/users/new' } })
          break

        case 'NAVIGATE_TO_DETAIL':
          internalDispatch({ type: 'SET_EFFECT', payload: { type: 'NAVIGATE', path: `/users/${input.id}` } })
          break

        case 'NAVIGATE_TO_EDIT':
          internalDispatch({ type: 'SET_EFFECT', payload: { type: 'NAVIGATE', path: `/users/${input.id}/edit` } })
          break
      }
    },
    [state.currentPage, state.pageSize, state.searchQuery, state.totalPages, userService]
  )

  // ==========================================================================
  // Initial Load & Online Status
  // ==========================================================================

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      dispatch({ type: 'LOAD_USERS', page: 1 })
      internalDispatch({ type: 'SET_ONLINE', payload: userService.isOnline() })
    }
  }, [dispatch, userService])

  // ==========================================================================
  // Computed Output
  // ==========================================================================

  const filteredUsers = computeFilteredUsers(state.users, state.searchQuery)
  const { startItem, endItem } = computePaginationInfo(
    state.currentPage,
    state.pageSize,
    state.totalItems
  )

  const output: UserListOutput = {
    users: state.users,
    totalPages: state.totalPages,
    totalItems: state.totalItems,
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    searchQuery: state.searchQuery,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    successMessage: state.successMessage,
    isOnline: state.isOnline,
    filteredUsers,
    startItem,
    endItem,
  }

  return { output, dispatch }
}
