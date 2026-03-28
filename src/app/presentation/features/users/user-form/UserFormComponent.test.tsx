import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '@core/providers/I18nProvider'
import { AuthProvider } from '@core/providers/AuthProvider'
import { UserFormComponent } from './UserFormComponent'
import type { UserFormOutput } from '../viewmodels/userFormViewModel'

// ---------------------------------------------------------------------------
// Mock the ViewModel
// ---------------------------------------------------------------------------

const mockDispatch = vi.fn().mockResolvedValue(undefined)

const defaultOutput: UserFormOutput = {
  firstName: '',
  lastName: '',
  email: '',
  avatar: '',
  isEditMode: false,
  isLoading: false,
  isSubmitting: false,
  isDirty: false,
  errors: {},
  submitError: null,
  successMessage: null,
  isValid: false,
  hasErrors: false,
}

let currentOutput = { ...defaultOutput }

vi.mock('../viewmodels/userFormViewModel', () => ({
  useUserFormViewModel: () => ({
    output: currentOutput,
    dispatch: mockDispatch,
  }),
}))

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function renderWithProviders(ui: React.ReactElement, { route = '/users/new' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <I18nProvider>
        <AuthProvider>
          <Routes>
            <Route path="/users/new" element={ui} />
            <Route path="/users/:id/edit" element={ui} />
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UserFormComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentOutput = { ...defaultOutput }
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
  })

  // --- Create mode rendering ---

  it('renders create mode title when not in edit mode', () => {
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByRole('heading', { name: 'Create User' })).toBeInTheDocument()
    expect(screen.getByText('Fill in the form to create a new user')).toBeInTheDocument()
  })

  it('renders edit mode title when in edit mode', () => {
    currentOutput = { ...defaultOutput, isEditMode: true }
    renderWithProviders(<UserFormComponent />, { route: '/users/1/edit' })
    expect(screen.getByText('Edit User')).toBeInTheDocument()
    expect(screen.getByText('Update user information')).toBeInTheDocument()
  })

  it('renders back button', () => {
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('renders all form fields', () => {
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Avatar URL/)).toBeInTheDocument()
  })

  it('renders required indicators on mandatory fields', () => {
    renderWithProviders(<UserFormComponent />)
    const requiredStars = screen.getAllByText('*')
    expect(requiredStars.length).toBe(3) // firstName, lastName, email
  })

  it('renders the help card', () => {
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByText('Field Requirements')).toBeInTheDocument()
    expect(screen.getByText(/First and last names must be at least 2 characters/)).toBeInTheDocument()
    expect(screen.getByText(/Email must be a valid email address format/)).toBeInTheDocument()
  })

  it('renders cancel link pointing to /users', () => {
    renderWithProviders(<UserFormComponent />)
    const cancelLink = screen.getByRole('link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute('href', '/users')
  })

  // --- Loading state ---

  it('shows loading spinner when isLoading is true', () => {
    currentOutput = { ...defaultOutput, isLoading: true }
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('hides the form when loading', () => {
    currentOutput = { ...defaultOutput, isLoading: true }
    renderWithProviders(<UserFormComponent />)
    expect(screen.queryByLabelText(/First Name/)).not.toBeInTheDocument()
  })

  // --- Alerts ---

  it('shows success alert when successMessage is set', () => {
    currentOutput = { ...defaultOutput, successMessage: 'User created successfully' }
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByText('User created successfully')).toBeInTheDocument()
  })

  it('shows error alert when submitError is set', () => {
    currentOutput = { ...defaultOutput, submitError: 'Failed to save user' }
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByText('Failed to save user')).toBeInTheDocument()
  })

  // --- Validation errors ---

  it('shows validation error for firstName', () => {
    currentOutput = { ...defaultOutput, errors: { firstName: 'First name is required' } }
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByText('First name is required')).toBeInTheDocument()
    expect(screen.getByLabelText(/First Name/).closest('input')).toHaveClass('is-invalid')
  })

  it('shows validation error for email', () => {
    currentOutput = { ...defaultOutput, errors: { email: 'Invalid email' } }
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
  })

  it('shows validation error for avatar', () => {
    currentOutput = { ...defaultOutput, errors: { avatar: 'Invalid URL' } }
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByText('Invalid URL')).toBeInTheDocument()
  })

  // --- Button states ---

  it('disables submit button when form is invalid', () => {
    currentOutput = { ...defaultOutput, isValid: false }
    renderWithProviders(<UserFormComponent />)
    const submitBtn = screen.getByRole('button', { name: /Create User/ })
    expect(submitBtn).toBeDisabled()
  })

  it('enables submit button when form is valid', () => {
    currentOutput = { ...defaultOutput, isValid: true }
    renderWithProviders(<UserFormComponent />)
    const submitBtn = screen.getByRole('button', { name: /Create User/ })
    expect(submitBtn).not.toBeDisabled()
  })

  it('shows "Update User" on submit button in edit mode', () => {
    currentOutput = { ...defaultOutput, isEditMode: true, isValid: true }
    renderWithProviders(<UserFormComponent />, { route: '/users/1/edit' })
    expect(screen.getByRole('button', { name: /Update User/ })).toBeInTheDocument()
  })

  it('shows saving state on submit button while submitting', () => {
    currentOutput = { ...defaultOutput, isSubmitting: true, isValid: true }
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('disables reset button when form is not dirty', () => {
    currentOutput = { ...defaultOutput, isDirty: false }
    renderWithProviders(<UserFormComponent />)
    // The translation key 'user.form.button.reset' falls back to the key itself
    const resetBtn = screen.getByRole('button', { name: /user\.form\.button\.reset/ })
    expect(resetBtn).toBeDisabled()
  })

  it('enables reset button when form is dirty', () => {
    currentOutput = { ...defaultOutput, isDirty: true }
    renderWithProviders(<UserFormComponent />)
    const resetBtn = screen.getByRole('button', { name: /user\.form\.button\.reset/ })
    expect(resetBtn).not.toBeDisabled()
  })

  // --- Interactions ---

  it('dispatches SET_FIELD when firstName changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserFormComponent />)
    const input = screen.getByPlaceholderText('Enter first name')
    await act(async () => {
      await user.type(input, 'J')
    })
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD',
      field: 'firstName',
      value: 'J',
    })
  })

  it('dispatches VALIDATE_FIELD on blur', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserFormComponent />)
    const input = screen.getByPlaceholderText('Enter first name')
    await act(async () => {
      await user.click(input)
      await user.tab()
    })
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'VALIDATE_FIELD',
      field: 'firstName',
    })
  })

  it('dispatches SUBMIT on form submit', async () => {
    currentOutput = { ...defaultOutput, isValid: true }
    const user = userEvent.setup()
    renderWithProviders(<UserFormComponent />)
    const submitBtn = screen.getByRole('button', { name: /Create User/ })
    await act(async () => {
      await user.click(submitBtn)
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SUBMIT' })
  })

  it('dispatches RESET when reset button is clicked', async () => {
    currentOutput = { ...defaultOutput, isDirty: true }
    const user = userEvent.setup()
    renderWithProviders(<UserFormComponent />)
    const resetBtn = screen.getByRole('button', { name: /user\.form\.button\.reset/ })
    await act(async () => {
      await user.click(resetBtn)
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET' })
  })

  it('dispatches NAVIGATE_TO_LIST when back button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserFormComponent />)
    const backBtn = screen.getByText('Back').closest('button')!
    await act(async () => {
      await user.click(backBtn)
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'NAVIGATE_TO_LIST' })
  })

  it('dispatches DISMISS_ERROR when error close button is clicked', async () => {
    currentOutput = { ...defaultOutput, submitError: 'Some error' }
    const user = userEvent.setup()
    renderWithProviders(<UserFormComponent />)
    const closeBtn = screen.getByText('Some error').closest('.alert')!.querySelector('.btn-close')!
    await act(async () => {
      await user.click(closeBtn)
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DISMISS_ERROR' })
  })

  // --- Avatar preview ---

  it('shows avatar preview image when avatar URL is provided', () => {
    currentOutput = { ...defaultOutput, avatar: 'https://example.com/photo.jpg' }
    renderWithProviders(<UserFormComponent />)
    const img = screen.getByAltText('Avatar preview')
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('shows initials preview when no avatar URL', () => {
    currentOutput = { ...defaultOutput, firstName: 'J', lastName: 'D' }
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('shows "?" as initials when name fields are empty', () => {
    currentOutput = { ...defaultOutput, firstName: '', lastName: '' }
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  // --- Form field disabling during submission ---

  it('disables form fields while submitting', () => {
    currentOutput = { ...defaultOutput, isSubmitting: true }
    renderWithProviders(<UserFormComponent />)
    expect(screen.getByPlaceholderText('Enter first name')).toBeDisabled()
    expect(screen.getByPlaceholderText('Enter last name')).toBeDisabled()
    expect(screen.getByPlaceholderText('Enter email address')).toBeDisabled()
  })
})
