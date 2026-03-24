import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from '@core/providers/I18nProvider'
import { AuthProvider } from '@core/providers/AuthProvider'
import { UserListComponent } from './UserListComponent'
import type { UserListOutput } from '../viewmodels/userListViewModel'
import type { User } from '@/app/domain/entities/user.model'

// ---------------------------------------------------------------------------
// Mock the ViewModel
// ---------------------------------------------------------------------------

const mockDispatch = vi.fn().mockResolvedValue(undefined)

const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    firstName: 'Bob',
    lastName: 'Jones',
    email: 'bob@example.com',
    avatar: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const defaultOutput: UserListOutput = {
  users: mockUsers,
  totalPages: 2,
  totalItems: 12,
  currentPage: 1,
  pageSize: 6,
  searchQuery: '',
  isLoading: false,
  isRefreshing: false,
  error: null,
  successMessage: null,
  isOnline: true,
  filteredUsers: mockUsers,
  startItem: 1,
  endItem: 6,
}

let currentOutput = { ...defaultOutput }

vi.mock('../viewmodels/userListViewModel', () => ({
  useUserListViewModel: () => ({
    output: currentOutput,
    dispatch: mockDispatch,
  }),
}))

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>{ui}</AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UserListComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentOutput = { ...defaultOutput }
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
  })

  // --- Rendering ---

  it('renders the page title and subtitle', () => {
    renderWithProviders(<UserListComponent />)
    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('Manage and view all users')).toBeInTheDocument()
  })

  it('renders a "Create New User" link', () => {
    renderWithProviders(<UserListComponent />)
    const link = screen.getByRole('link', { name: /Create New User/i })
    expect(link).toHaveAttribute('href', '/users/new')
  })

  it('renders a search input', () => {
    renderWithProviders(<UserListComponent />)
    expect(screen.getByPlaceholderText(/Search by name or email/i)).toBeInTheDocument()
  })

  it('renders the refresh button', () => {
    renderWithProviders(<UserListComponent />)
    expect(screen.getByText('Refresh')).toBeInTheDocument()
  })

  it('renders user rows in the table', () => {
    renderWithProviders(<UserListComponent />)
    // Desktop table + mobile cards both show names, so use getAllByText
    const aliceElements = screen.getAllByText('Alice Smith')
    expect(aliceElements.length).toBeGreaterThan(0)
    const bobElements = screen.getAllByText('Bob Jones')
    expect(bobElements.length).toBeGreaterThan(0)
  })

  it('renders user emails', () => {
    renderWithProviders(<UserListComponent />)
    // Emails appear in both desktop table and mobile cards
    const aliceEmails = screen.getAllByText('alice@example.com')
    expect(aliceEmails.length).toBeGreaterThan(0)
    const bobEmails = screen.getAllByText('bob@example.com')
    expect(bobEmails.length).toBeGreaterThan(0)
  })

  it('renders avatar image when available', () => {
    renderWithProviders(<UserListComponent />)
    const avatarImgs = screen.getAllByAltText('Alice Smith')
    expect(avatarImgs.length).toBeGreaterThan(0)
    expect(avatarImgs[0]).toHaveAttribute('src', 'https://i.pravatar.cc/150?img=1')
  })

  it('renders initials when avatar is not available', () => {
    renderWithProviders(<UserListComponent />)
    // Bob Jones has no avatar, should display initials "BJ"
    expect(screen.getAllByText('BJ').length).toBeGreaterThan(0)
  })

  it('renders pagination showing item range', () => {
    renderWithProviders(<UserListComponent />)
    expect(screen.getByText(/Showing 1 to 6 of 12 users/)).toBeInTheDocument()
  })

  it('renders pagination page buttons', () => {
    renderWithProviders(<UserListComponent />)
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
  })

  // --- Loading state ---

  it('shows loading spinner when isLoading is true', () => {
    currentOutput = { ...defaultOutput, isLoading: true, filteredUsers: [] }
    renderWithProviders(<UserListComponent />)
    // "Loading..." appears in both visually-hidden span and visible text
    const loadingTexts = screen.getAllByText('Loading...')
    expect(loadingTexts.length).toBeGreaterThan(0)
  })

  // --- Empty state ---

  it('shows empty state when there are no users and no search query', () => {
    currentOutput = { ...defaultOutput, filteredUsers: [], searchQuery: '' }
    renderWithProviders(<UserListComponent />)
    expect(screen.getByText('No users found')).toBeInTheDocument()
    expect(screen.getByText('Get started by creating your first user')).toBeInTheDocument()
  })

  it('shows empty search message when filtered users is empty with search query', () => {
    currentOutput = { ...defaultOutput, filteredUsers: [], searchQuery: 'xyz' }
    renderWithProviders(<UserListComponent />)
    expect(screen.getByText('No users match your search criteria')).toBeInTheDocument()
  })

  it('does not show create button in empty state when search query is active', () => {
    currentOutput = { ...defaultOutput, filteredUsers: [], searchQuery: 'xyz' }
    renderWithProviders(<UserListComponent />)
    // The empty state create button should NOT be visible when searching
    const links = screen.queryAllByRole('link', { name: /Create New User/i })
    // Only the header link should remain (1 total)
    expect(links.length).toBe(1)
  })

  // --- Alerts ---

  it('shows success alert when successMessage is set', () => {
    currentOutput = { ...defaultOutput, successMessage: 'User deleted!' }
    renderWithProviders(<UserListComponent />)
    expect(screen.getByText('User deleted!')).toBeInTheDocument()
  })

  it('shows error alert when error is set', () => {
    currentOutput = { ...defaultOutput, error: 'Network failure' }
    renderWithProviders(<UserListComponent />)
    expect(screen.getByText('Network failure')).toBeInTheDocument()
  })

  // --- Interactions ---

  it('dispatches SET_SEARCH_QUERY on search input change', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserListComponent />)
    const searchInput = screen.getByPlaceholderText(/Search by name or email/i)
    await act(async () => {
      await user.type(searchInput, 'a')
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SEARCH_QUERY', query: 'a' })
  })

  it('dispatches REFRESH_USERS when refresh button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserListComponent />)
    const refreshBtn = screen.getByText('Refresh').closest('button')!
    await act(async () => {
      await user.click(refreshBtn)
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'REFRESH_USERS' })
  })

  it('dispatches DISMISS_ERROR when error alert close button is clicked', async () => {
    currentOutput = { ...defaultOutput, error: 'Oops' }
    const user = userEvent.setup()
    renderWithProviders(<UserListComponent />)
    const closeBtn = screen.getByText('Oops').closest('.alert')!.querySelector('.btn-close')!
    await act(async () => {
      await user.click(closeBtn)
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DISMISS_ERROR' })
  })

  it('dispatches DISMISS_SUCCESS when success alert close button is clicked', async () => {
    currentOutput = { ...defaultOutput, successMessage: 'Done!' }
    const user = userEvent.setup()
    renderWithProviders(<UserListComponent />)
    const closeBtn = screen.getByText('Done!').closest('.alert')!.querySelector('.btn-close')!
    await act(async () => {
      await user.click(closeBtn)
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DISMISS_SUCCESS' })
  })

  it('dispatches CHANGE_PAGE when a page button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserListComponent />)
    const page2 = screen.getByRole('button', { name: '2' })
    await act(async () => {
      await user.click(page2)
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CHANGE_PAGE', page: 2 })
  })

  it('dispatches DELETE_USER after confirm on delete button click', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderWithProviders(<UserListComponent />)

    // Find all delete buttons (desktop table action buttons)
    const deleteBtns = screen.getAllByTitle('Delete')
    await act(async () => {
      await user.click(deleteBtns[0])
    })
    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DELETE_USER', user: mockUsers[0] })
    confirmSpy.mockRestore()
  })

  it('does not dispatch DELETE_USER when confirm is cancelled', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderWithProviders(<UserListComponent />)

    const deleteBtns = screen.getAllByTitle('Delete')
    await act(async () => {
      await user.click(deleteBtns[0])
    })
    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DELETE_USER' })
    )
    confirmSpy.mockRestore()
  })

  it('dispatches NAVIGATE_TO_DETAIL when view button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserListComponent />)
    const viewBtns = screen.getAllByTitle('View')
    await act(async () => {
      await user.click(viewBtns[0])
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'NAVIGATE_TO_DETAIL', id: '1' })
  })

  it('dispatches NAVIGATE_TO_EDIT when edit button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserListComponent />)
    const editBtns = screen.getAllByTitle('Edit')
    await act(async () => {
      await user.click(editBtns[0])
    })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'NAVIGATE_TO_EDIT', id: '1' })
  })

  it('disables refresh button when isRefreshing', () => {
    currentOutput = { ...defaultOutput, isRefreshing: true }
    renderWithProviders(<UserListComponent />)
    const refreshBtn = screen.getByText('Refresh').closest('button')!
    expect(refreshBtn).toBeDisabled()
  })

  it('shows clear search button when searchQuery is set', () => {
    currentOutput = { ...defaultOutput, searchQuery: 'test' }
    const { container } = renderWithProviders(<UserListComponent />)
    const clearBtn = container.querySelector('.clear-search')
    expect(clearBtn).toBeInTheDocument()
  })

  it('disables previous page button when on first page', () => {
    currentOutput = { ...defaultOutput, currentPage: 1 }
    renderWithProviders(<UserListComponent />)
    const prevButtons = screen.getAllByRole('button').filter(
      btn => btn.closest('.page-item.disabled') && btn.classList.contains('page-link')
    )
    expect(prevButtons.length).toBeGreaterThan(0)
  })
})
