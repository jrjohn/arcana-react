import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '@core/providers/I18nProvider'
import { AuthProvider } from '@core/providers/AuthProvider'
import { UserDetailComponent } from './UserDetailComponent'
import type { UserDetailOutput } from '../viewmodels/userDetailViewModel'
import type { User } from '@/app/domain/entities/user.model'

// ---------------------------------------------------------------------------
// Mock the ViewModel
// ---------------------------------------------------------------------------

const mockDispatch = vi.fn().mockResolvedValue(undefined)

const mockUser: User = {
  id: '42',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  avatar: 'https://i.pravatar.cc/150?img=5',
  createdAt: new Date('2025-01-15T10:30:00'),
  updatedAt: new Date('2025-06-20T14:00:00'),
}

const defaultOutput: UserDetailOutput = {
  user: mockUser,
  isLoading: false,
  isDeleting: false,
  error: null,
  successMessage: null,
  fullName: 'Jane Doe',
  initials: 'JD',
}

let currentOutput = { ...defaultOutput }

vi.mock('../viewmodels/userDetailViewModel', () => ({
  useUserDetailViewModel: () => ({
    output: currentOutput,
    dispatch: mockDispatch,
  }),
}))

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function renderWithProviders(ui: React.ReactElement, { route = '/users/42' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <I18nProvider>
        <AuthProvider>
          <Routes>
            <Route path="/users/:id" element={ui} />
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UserDetailComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentOutput = { ...defaultOutput }
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
  })

  // --- Rendering ---

  it('renders user detail page title', () => {
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByText('User Details')).toBeInTheDocument()
    expect(screen.getByText('View user information')).toBeInTheDocument()
  })

  it('renders back button', () => {
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('renders user full name', () => {
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('renders user email', () => {
    renderWithProviders(<UserDetailComponent />)
    // Email appears multiple times in the layout
    const emailElements = screen.getAllByText('jane@example.com')
    expect(emailElements.length).toBeGreaterThan(0)
  })

  it('renders user ID', () => {
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByText('#42')).toBeInTheDocument()
  })

  it('renders first name and last name separately in info grid', () => {
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByText('Jane')).toBeInTheDocument()
    expect(screen.getByText('Doe')).toBeInTheDocument()
  })

  it('renders avatar image when user has avatar', () => {
    renderWithProviders(<UserDetailComponent />)
    const img = screen.getByAltText('Jane Doe')
    expect(img).toHaveAttribute('src', 'https://i.pravatar.cc/150?img=5')
  })

  it('renders initials when user has no avatar', () => {
    currentOutput = {
      ...defaultOutput,
      user: { ...mockUser, avatar: undefined },
      initials: 'JD',
    }
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('shows avatar URL section when user has avatar', () => {
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByText('Avatar URL')).toBeInTheDocument()
    expect(screen.getByText('https://i.pravatar.cc/150?img=5')).toBeInTheDocument()
  })

  it('does not show avatar URL section when user has no avatar', () => {
    currentOutput = {
      ...defaultOutput,
      user: { ...mockUser, avatar: undefined },
    }
    renderWithProviders(<UserDetailComponent />)
    expect(screen.queryByText('Avatar URL')).not.toBeInTheDocument()
  })

  it('renders "Back to List" link', () => {
    renderWithProviders(<UserDetailComponent />)
    const backLink = screen.getByRole('link', { name: /Back to List/ })
    expect(backLink).toHaveAttribute('href', '/users')
  })

  it('renders delete and edit buttons', () => {
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Edit User/ })).toBeInTheDocument()
  })

  it('renders information card in sidebar', () => {
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByText('User Information')).toBeInTheDocument()
  })

  // --- Loading state ---

  it('shows loading spinner when isLoading is true', () => {
    currentOutput = { ...defaultOutput, isLoading: true, user: null }
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('hides user detail card when loading', () => {
    currentOutput = { ...defaultOutput, isLoading: true, user: null }
    renderWithProviders(<UserDetailComponent />)
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
  })

  // --- Alerts ---

  it('shows success alert when successMessage is set', () => {
    currentOutput = { ...defaultOutput, successMessage: 'User deleted!' }
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByText('User deleted!')).toBeInTheDocument()
  })

  it('shows error alert when error is set', () => {
    currentOutput = { ...defaultOutput, error: 'Failed to load user' }
    renderWithProviders(<UserDetailComponent />)
    expect(screen.getByText('Failed to load user')).toBeInTheDocument()
  })

  // --- Interactions ---

  it('dispatches NAVIGATE_TO_LIST when back button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserDetailComponent />)
    const backBtn = screen.getByText('Back').closest('button')!
    await act(async () => {
      await user.click(backBtn)
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'NAVIGATE_TO_LIST' })
  })

  it('dispatches NAVIGATE_TO_EDIT when edit button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserDetailComponent />)
    const editBtn = screen.getByRole('button', { name: /Edit User/ })
    await act(async () => {
      await user.click(editBtn)
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'NAVIGATE_TO_EDIT', id: '42' })
  })

  it('dispatches DELETE_USER after confirm on delete button click', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderWithProviders(<UserDetailComponent />)
    const deleteBtn = screen.getByRole('button', { name: /Delete/ })
    await act(async () => {
      await user.click(deleteBtn)
    })
    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DELETE_USER' })
    confirmSpy.mockRestore()
  })

  it('does not dispatch DELETE_USER when confirm is cancelled', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderWithProviders(<UserDetailComponent />)
    const deleteBtn = screen.getByRole('button', { name: /Delete/ })
    await act(async () => {
      await user.click(deleteBtn)
    })
    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'DELETE_USER' })
    confirmSpy.mockRestore()
  })

  it('dispatches DISMISS_ERROR when error close button is clicked', async () => {
    currentOutput = { ...defaultOutput, error: 'Something broke' }
    const user = userEvent.setup()
    renderWithProviders(<UserDetailComponent />)
    const closeBtn = screen.getByText('Something broke').closest('.alert')!.querySelector('.btn-close')!
    await act(async () => {
      await user.click(closeBtn)
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DISMISS_ERROR' })
  })

  // --- Delete button states ---

  it('shows deleting state on delete button', () => {
    currentOutput = { ...defaultOutput, isDeleting: true }
    renderWithProviders(<UserDetailComponent />)
    // The key 'common.deleting' renders as the key itself (fallback) since t() returns the key
    expect(screen.getByText('common.deleting')).toBeInTheDocument()
  })

  it('disables delete button while deleting', () => {
    currentOutput = { ...defaultOutput, isDeleting: true }
    renderWithProviders(<UserDetailComponent />)
    const deleteBtn = screen.getByText('common.deleting').closest('button')!
    expect(deleteBtn).toBeDisabled()
  })

  // --- No user ---

  it('does not render user card when user is null and not loading', () => {
    currentOutput = { ...defaultOutput, isLoading: false, user: null }
    renderWithProviders(<UserDetailComponent />)
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
    expect(screen.queryByText('#42')).not.toBeInTheDocument()
  })
})
