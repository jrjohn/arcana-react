// =============================================================================
// User Form ViewModel - UDF Input/Output/Effect Pattern
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
import type { User, CreateUserDto, UpdateUserDto, UserValidationErrors } from '@/app/domain/entities/user.model'
import { useUserService } from '@/app/core/di'
import { userValidator } from '@/app/domain/validators/userValidator'

// =============================================================================
// Input Types (User Actions)
// =============================================================================

export type UserFormInput =
  | { type: 'SET_FIELD'; field: 'firstName' | 'lastName' | 'email' | 'avatar'; value: string }
  | { type: 'VALIDATE_FIELD'; field: keyof UserValidationErrors }
  | { type: 'SUBMIT' }
  | { type: 'RESET' }
  | { type: 'LOAD_USER'; id: string }
  | { type: 'DISMISS_ERROR' }
  | { type: 'NAVIGATE_TO_LIST' }

// =============================================================================
// Output Types (State)
// =============================================================================

export interface UserFormOutput {
  // Form data
  firstName: string
  lastName: string
  email: string
  avatar: string

  // Form state
  isEditMode: boolean
  isLoading: boolean
  isSubmitting: boolean
  isDirty: boolean
  errors: UserValidationErrors
  submitError: string | null
  successMessage: string | null

  // Computed values
  isValid: boolean
  hasErrors: boolean
}

// =============================================================================
// Effect Types (Side Effects)
// =============================================================================

export type UserFormEffect =
  | { type: 'NAVIGATE'; path: string }
  | { type: 'NAVIGATE_AFTER_DELAY'; path: string; delay: number }

// =============================================================================
// Internal State (Reducer State)
// =============================================================================

interface UserFormState {
  firstName: string
  lastName: string
  email: string
  avatar: string
  originalUser: User | null
  isEditMode: boolean
  isLoading: boolean
  isSubmitting: boolean
  isDirty: boolean
  errors: UserValidationErrors
  submitError: string | null
  successMessage: string | null
  pendingEffect: UserFormEffect | null
}

// =============================================================================
// Internal Actions (Reducer Actions)
// =============================================================================

type UserFormAction =
  | { type: 'SET_FIELD'; field: 'firstName' | 'lastName' | 'email' | 'avatar'; value: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERRORS'; payload: UserValidationErrors }
  | { type: 'SET_FIELD_ERROR'; field: keyof UserValidationErrors; error: string | null }
  | { type: 'SET_SUBMIT_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'LOAD_USER'; payload: User }
  | { type: 'RESET_FORM' }
  | { type: 'SET_EFFECT'; payload: UserFormEffect | null }
  | { type: 'CLEAR_EFFECT' }

// =============================================================================
// Reducer (Pure Function)
// =============================================================================

const initialState: UserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  avatar: '',
  originalUser: null,
  isEditMode: false,
  isLoading: false,
  isSubmitting: false,
  isDirty: false,
  errors: {},
  submitError: null,
  successMessage: null,
  pendingEffect: null,
}

function userFormReducer(state: UserFormState, action: UserFormAction): UserFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        isDirty: true,
        errors: { ...state.errors, [action.field]: null },
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload, submitError: null }
    case 'SET_ERRORS':
      return { ...state, errors: action.payload, isSubmitting: false }
    case 'SET_FIELD_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: action.error } }
    case 'SET_SUBMIT_ERROR':
      return { ...state, submitError: action.payload, isSubmitting: false }
    case 'SET_SUCCESS':
      return { ...state, successMessage: action.payload, isSubmitting: false }
    case 'LOAD_USER':
      return {
        ...state,
        firstName: action.payload.firstName,
        lastName: action.payload.lastName,
        email: action.payload.email,
        avatar: action.payload.avatar || '',
        originalUser: action.payload,
        isEditMode: true,
        isLoading: false,
        isDirty: false,
      }
    case 'RESET_FORM':
      if (state.originalUser) {
        return {
          ...state,
          firstName: state.originalUser.firstName,
          lastName: state.originalUser.lastName,
          email: state.originalUser.email,
          avatar: state.originalUser.avatar || '',
          isDirty: false,
          errors: {},
          submitError: null,
        }
      }
      return { ...initialState }
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

function computeIsValid(state: UserFormState): boolean {
  const hasErrors = userValidator.hasErrors(state.errors)
  return state.isDirty && !hasErrors && !!state.firstName && !!state.lastName && !!state.email
}

function computeHasErrors(errors: UserValidationErrors): boolean {
  return userValidator.hasErrors(errors)
}

// =============================================================================
// ViewModel Hook
// =============================================================================

export interface UseUserFormViewModel {
  output: UserFormOutput
  dispatch: (input: UserFormInput) => void
}

export function useUserFormViewModel(userId?: string): UseUserFormViewModel {
  const navigate = useNavigate()
  const userService = useUserService()
  const [state, internalDispatch] = useReducer(userFormReducer, initialState)
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
    async (input: UserFormInput) => {
      switch (input.type) {
        case 'SET_FIELD':
          internalDispatch({ type: 'SET_FIELD', field: input.field, value: input.value })
          break

        case 'VALIDATE_FIELD': {
          const value =
            input.field === 'firstName'
              ? state.firstName
              : input.field === 'lastName'
                ? state.lastName
                : input.field === 'email'
                  ? state.email
                  : state.avatar

          const error = userValidator.validateField(input.field, value)
          internalDispatch({ type: 'SET_FIELD_ERROR', field: input.field, error })
          break
        }

        case 'SUBMIT': {
          // Validate form
          const errors = state.isEditMode
            ? userValidator.validateUpdate({
                firstName: state.firstName,
                lastName: state.lastName,
                email: state.email,
                avatar: state.avatar || undefined,
              })
            : userValidator.validateCreate({
                firstName: state.firstName,
                lastName: state.lastName,
                email: state.email,
              })

          if (userValidator.hasErrors(errors)) {
            internalDispatch({ type: 'SET_ERRORS', payload: errors })
            return
          }

          internalDispatch({ type: 'SET_SUBMITTING', payload: true })

          if (state.isEditMode && state.originalUser) {
            // Update existing user
            const dto: UpdateUserDto = {
              firstName: state.firstName,
              lastName: state.lastName,
              email: state.email,
              avatar: state.avatar || undefined,
            }

            const result = await userService.update(state.originalUser.id, dto)

            if (result.success && result.data) {
              internalDispatch({ type: 'SET_SUCCESS', payload: 'User updated successfully' })
              internalDispatch({
                type: 'SET_EFFECT',
                payload: { type: 'NAVIGATE_AFTER_DELAY', path: `/users/${result.data.id}`, delay: 1500 },
              })
            } else {
              internalDispatch({ type: 'SET_SUBMIT_ERROR', payload: result.error || 'Failed to update user' })
            }
          } else {
            // Create new user
            const dto: CreateUserDto = {
              firstName: state.firstName,
              lastName: state.lastName,
              email: state.email,
              avatar: state.avatar || undefined,
            }

            const result = await userService.create(dto)

            if (result.success && result.data) {
              internalDispatch({ type: 'SET_SUCCESS', payload: 'User created successfully' })
              internalDispatch({
                type: 'SET_EFFECT',
                payload: { type: 'NAVIGATE_AFTER_DELAY', path: `/users/${result.data.id}`, delay: 1500 },
              })
            } else {
              internalDispatch({ type: 'SET_SUBMIT_ERROR', payload: result.error || 'Failed to create user' })
            }
          }
          break
        }

        case 'RESET':
          internalDispatch({ type: 'RESET_FORM' })
          break

        case 'LOAD_USER': {
          internalDispatch({ type: 'SET_LOADING', payload: true })

          const result = await userService.getById(input.id)

          if (result.success && result.data) {
            internalDispatch({ type: 'LOAD_USER', payload: result.data })
          } else {
            internalDispatch({ type: 'SET_SUBMIT_ERROR', payload: result.error || 'User not found' })
            internalDispatch({ type: 'SET_LOADING', payload: false })
          }
          break
        }

        case 'DISMISS_ERROR':
          internalDispatch({ type: 'SET_SUBMIT_ERROR', payload: null })
          break

        case 'NAVIGATE_TO_LIST':
          internalDispatch({ type: 'SET_EFFECT', payload: { type: 'NAVIGATE', path: '/users' } })
          break
      }
    },
    [state.firstName, state.lastName, state.email, state.avatar, state.isEditMode, state.originalUser, userService]
  )

  // ==========================================================================
  // Initial Load (Edit Mode)
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

  const output: UserFormOutput = {
    firstName: state.firstName,
    lastName: state.lastName,
    email: state.email,
    avatar: state.avatar,
    isEditMode: state.isEditMode,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    isDirty: state.isDirty,
    errors: state.errors,
    submitError: state.submitError,
    successMessage: state.successMessage,
    isValid: computeIsValid(state),
    hasErrors: computeHasErrors(state.errors),
  }

  return { output, dispatch }
}
