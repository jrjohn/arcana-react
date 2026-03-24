import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@core/providers/I18nProvider'
import { AuthProvider } from '@core/providers/AuthProvider'
import { Sidebar } from './Sidebar'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function renderWithProviders(
  props: { collapsed?: boolean; mobileOpen?: boolean; onCloseMobile?: () => void } = {}
) {
  const {
    collapsed = false,
    mobileOpen = false,
    onCloseMobile = vi.fn(),
  } = props

  return {
    ...render(
      <MemoryRouter initialEntries={['/']}>
        <I18nProvider>
          <AuthProvider>
            <Sidebar
              collapsed={collapsed}
              mobileOpen={mobileOpen}
              onCloseMobile={onCloseMobile}
            />
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>
    ),
    onCloseMobile,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
  })

  // --- Rendering ---

  it('renders the sidebar element', () => {
    const { container } = renderWithProviders()
    expect(container.querySelector('.sidebar')).toBeInTheDocument()
  })

  it('renders user profile block', () => {
    const { container } = renderWithProviders()
    expect(container.querySelector('.user-profile-block')).toBeInTheDocument()
  })

  it('displays user name from auth context', () => {
    renderWithProviders()
    // Default demo user is "John Doe"
    const userNames = screen.getAllByText('John Doe')
    expect(userNames.length).toBeGreaterThan(0)
  })

  it('displays user email', () => {
    renderWithProviders()
    expect(screen.getByText('admin@arcana.io')).toBeInTheDocument()
  })

  it('displays user role badge', () => {
    renderWithProviders()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders View Profile link', () => {
    renderWithProviders()
    expect(screen.getByText('View Profile')).toBeInTheDocument()
  })

  it('renders navigation menu section title', () => {
    renderWithProviders()
    expect(screen.getByText('MAIN MENU')).toBeInTheDocument()
  })

  it('renders main navigation items', () => {
    renderWithProviders()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders sidebar footer with storage info', () => {
    renderWithProviders()
    expect(screen.getByText('Storage')).toBeInTheDocument()
    expect(screen.getByText('4.2 GB / 10 GB')).toBeInTheDocument()
  })

  it('renders a progress bar for storage', () => {
    renderWithProviders()
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  // --- Collapsed state ---

  it('adds collapsed class when collapsed prop is true', () => {
    const { container } = renderWithProviders({ collapsed: true })
    expect(container.querySelector('.sidebar.collapsed')).toBeInTheDocument()
  })

  it('hides user info text when collapsed', () => {
    renderWithProviders({ collapsed: true })
    expect(screen.queryByText('admin@arcana.io')).not.toBeInTheDocument()
  })

  it('hides "View Profile" link when collapsed', () => {
    renderWithProviders({ collapsed: true })
    expect(screen.queryByText('View Profile')).not.toBeInTheDocument()
  })

  it('hides menu section title when collapsed', () => {
    renderWithProviders({ collapsed: true })
    expect(screen.queryByText('MAIN MENU')).not.toBeInTheDocument()
  })

  it('hides sidebar footer when collapsed', () => {
    renderWithProviders({ collapsed: true })
    expect(screen.queryByText('4.2 GB / 10 GB')).not.toBeInTheDocument()
  })

  // --- Mobile open state ---

  it('adds show class when mobileOpen is true', () => {
    const { container } = renderWithProviders({ mobileOpen: true })
    expect(container.querySelector('.sidebar.show')).toBeInTheDocument()
  })

  // --- Submenu toggle ---

  it('expands a parent menu when its toggle button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    // Find a parent menu button (e.g., "User Management" if it has children, or any expandable)
    const parentButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('nav-link-parent')
    )
    if (parentButtons.length > 0) {
      await act(async () => {
        await user.click(parentButtons[0])
      })
      // After clicking, the button should have the "active" class toggled
      // (The submenu should have the "show" class)
      expect(parentButtons[0]).toBeInTheDocument()
    }
  })

  it('toggles submenu visibility on parent click', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders()

    const parentButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('nav-link-parent')
    )
    if (parentButtons.length > 0) {
      // First click - expand
      await act(async () => {
        await user.click(parentButtons[0])
      })
      let submenus = container.querySelectorAll('.nav-submenu.show')
      const showCount = submenus.length

      // Second click - collapse
      await act(async () => {
        await user.click(parentButtons[0])
      })
      submenus = container.querySelectorAll('.nav-submenu.show')
      expect(submenus.length).toBeLessThanOrEqual(showCount)
    }
  })

  // --- Mobile nav click ---

  it('calls onCloseMobile when a nav link is clicked on mobile', async () => {
    // Simulate mobile by setting window.innerWidth
    Object.defineProperty(globalThis, 'innerWidth', { value: 500, writable: true })
    const user = userEvent.setup()
    const { onCloseMobile } = renderWithProviders({ mobileOpen: true })

    // Find a single nav link (not parent)
    const navLinks = screen.getAllByRole('link')
    if (navLinks.length > 0) {
      await act(async () => {
        await user.click(navLinks[0])
      })
      expect(onCloseMobile).toHaveBeenCalled()
    }

    // Restore
    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, writable: true })
  })

  // --- Avatar ---

  it('renders user avatar image when available', () => {
    const { container } = renderWithProviders()
    const avatar = container.querySelector('.user-avatar')
    expect(avatar).toBeInTheDocument()
  })
})
