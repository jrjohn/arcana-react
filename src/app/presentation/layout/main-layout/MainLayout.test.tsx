import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@core/providers/I18nProvider'
import { AuthProvider } from '@core/providers/AuthProvider'
import { ThemeProvider } from '@core/providers/ThemeProvider'
import { MainLayout } from './MainLayout'

// ---------------------------------------------------------------------------
// Mock child components to isolate layout testing
// ---------------------------------------------------------------------------

vi.mock('../header/Header', () => ({
  Header: ({ onToggleSidebar, onToggleRightPanel }: {
    onToggleSidebar: () => void
    onToggleRightPanel: () => void
  }) => (
    <header data-testid="header">
      <button data-testid="toggle-sidebar" onClick={onToggleSidebar}>Toggle Sidebar</button>
      <button data-testid="toggle-right-panel" onClick={onToggleRightPanel}>Toggle Right Panel</button>
    </header>
  ),
}))

vi.mock('../sidebar/Sidebar', () => ({
  Sidebar: ({ collapsed, mobileOpen, onCloseMobile }: {
    collapsed: boolean
    mobileOpen: boolean
    onCloseMobile: () => void
  }) => (
    <aside
      data-testid="sidebar"
      data-collapsed={collapsed}
      data-mobile-open={mobileOpen}
    >
      <button data-testid="close-mobile" onClick={onCloseMobile}>Close Mobile</button>
    </aside>
  ),
}))

vi.mock('../right-panel/RightPanel', () => ({
  RightPanel: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <aside data-testid="right-panel" data-open={isOpen}>
      <button data-testid="close-right-panel" onClick={onClose}>Close</button>
    </aside>
  ),
}))

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function renderWithProviders() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <AuthProvider>
          <ThemeProvider>
            <MainLayout />
          </ThemeProvider>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
  })

  // --- Rendering ---

  it('renders the header', () => {
    renderWithProviders()
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('renders the sidebar', () => {
    renderWithProviders()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders the right panel', () => {
    renderWithProviders()
    expect(screen.getByTestId('right-panel')).toBeInTheDocument()
  })

  it('renders main content area', () => {
    const { container } = renderWithProviders()
    expect(container.querySelector('.main-content')).toBeInTheDocument()
  })

  it('renders main layout wrapper', () => {
    const { container } = renderWithProviders()
    expect(container.querySelector('.main-layout')).toBeInTheDocument()
  })

  // --- Initial state ---

  it('sidebar starts not collapsed by default', () => {
    renderWithProviders()
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false')
  })

  it('right panel starts closed by default', () => {
    renderWithProviders()
    expect(screen.getByTestId('right-panel')).toHaveAttribute('data-open', 'false')
  })

  it('mobile sidebar starts closed', () => {
    renderWithProviders()
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'false')
  })

  // --- Sidebar toggle (desktop) ---

  it('toggles sidebar collapsed state on desktop', async () => {
    // Simulate desktop
    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, writable: true })
    const user = userEvent.setup()
    renderWithProviders()

    const toggleBtn = screen.getByTestId('toggle-sidebar')
    await act(async () => {
      await user.click(toggleBtn)
    })

    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true')
    expect(localStorage.setItem).toHaveBeenCalledWith('arcana_sidebar_collapsed', 'true')
  })

  it('toggles sidebar back to expanded on second click', async () => {
    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, writable: true })
    const user = userEvent.setup()
    renderWithProviders()

    const toggleBtn = screen.getByTestId('toggle-sidebar')
    await act(async () => {
      await user.click(toggleBtn)
    })
    await act(async () => {
      await user.click(toggleBtn)
    })

    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false')
  })

  // --- Sidebar toggle (mobile) ---

  it('toggles mobile sidebar on mobile viewport', async () => {
    Object.defineProperty(globalThis, 'innerWidth', { value: 500, writable: true })
    const user = userEvent.setup()
    renderWithProviders()

    const toggleBtn = screen.getByTestId('toggle-sidebar')
    await act(async () => {
      await user.click(toggleBtn)
    })

    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'true')

    // Restore
    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, writable: true })
  })

  it('shows mobile overlay when mobile sidebar is open', async () => {
    Object.defineProperty(globalThis, 'innerWidth', { value: 500, writable: true })
    const user = userEvent.setup()
    const { container } = renderWithProviders()

    const toggleBtn = screen.getByTestId('toggle-sidebar')
    await act(async () => {
      await user.click(toggleBtn)
    })

    expect(container.querySelector('.mobile-overlay')).toBeInTheDocument()

    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, writable: true })
  })

  it('closes mobile sidebar when overlay is clicked', async () => {
    Object.defineProperty(globalThis, 'innerWidth', { value: 500, writable: true })
    const user = userEvent.setup()
    const { container } = renderWithProviders()

    // Open mobile sidebar
    const toggleBtn = screen.getByTestId('toggle-sidebar')
    await act(async () => {
      await user.click(toggleBtn)
    })

    // Click overlay
    const overlay = container.querySelector('.mobile-overlay')!
    await act(async () => {
      await user.click(overlay)
    })

    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'false')

    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, writable: true })
  })

  // --- Right panel toggle ---

  it('toggles right panel open state', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const toggleBtn = screen.getByTestId('toggle-right-panel')
    await act(async () => {
      await user.click(toggleBtn)
    })

    expect(screen.getByTestId('right-panel')).toHaveAttribute('data-open', 'true')
    expect(localStorage.setItem).toHaveBeenCalledWith('arcana_right_panel_open', 'true')
  })

  it('closes right panel via its close button', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    // Open right panel first
    const toggleBtn = screen.getByTestId('toggle-right-panel')
    await act(async () => {
      await user.click(toggleBtn)
    })
    expect(screen.getByTestId('right-panel')).toHaveAttribute('data-open', 'true')

    // Close via the panel's close button
    const closeBtn = screen.getByTestId('close-right-panel')
    await act(async () => {
      await user.click(closeBtn)
    })
    expect(screen.getByTestId('right-panel')).toHaveAttribute('data-open', 'false')
  })

  // --- CSS class propagation ---

  it('adds sidebar-collapsed class to main content when sidebar is collapsed', async () => {
    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, writable: true })
    const user = userEvent.setup()
    const { container } = renderWithProviders()

    const toggleBtn = screen.getByTestId('toggle-sidebar')
    await act(async () => {
      await user.click(toggleBtn)
    })

    expect(container.querySelector('.main-content.sidebar-collapsed')).toBeInTheDocument()
  })

  it('adds right-panel-open class to main content when right panel is open', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders()

    const toggleBtn = screen.getByTestId('toggle-right-panel')
    await act(async () => {
      await user.click(toggleBtn)
    })

    expect(container.querySelector('.main-content.right-panel-open')).toBeInTheDocument()
  })

  // --- LocalStorage persistence ---

  it('reads sidebar collapsed state from localStorage', () => {
    localStorage.getItem = vi.fn().mockImplementation((key: string) => {
      if (key === 'arcana_sidebar_collapsed') return 'true'
      return null
    })
    renderWithProviders()
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true')
  })

  it('reads right panel open state from localStorage', () => {
    localStorage.getItem = vi.fn().mockImplementation((key: string) => {
      if (key === 'arcana_right_panel_open') return 'true'
      return null
    })
    renderWithProviders()
    expect(screen.getByTestId('right-panel')).toHaveAttribute('data-open', 'true')
  })
})
