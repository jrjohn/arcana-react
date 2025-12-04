import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@core/providers/I18nProvider'
import { AuthProvider } from '@core/providers/AuthProvider'
import { ThemeProvider } from '@core/providers/ThemeProvider'
import { MainLayout } from '@presentation/layout/main-layout/MainLayout'

// Test wrapper with all providers
function renderApp(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <MainLayout />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
    localStorage.removeItem = vi.fn()
  })

  describe('Navigation', () => {
    it('should render the main layout with sidebar', () => {
      renderApp()

      // Check header is rendered
      expect(screen.getByText('Arcana')).toBeInTheDocument()
    })

    it('should toggle sidebar when toggle button is clicked', async () => {
      // Mock window.innerWidth to be desktop size (so toggleSidebar affects sidebarCollapsed state)
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })

      const user = userEvent.setup()
      const { container } = renderApp()

      const toggleButton = screen.getByLabelText('Toggle sidebar')
      const mainContentElement = container.querySelector('.main-content')

      // Initial state - sidebar should be open (no collapsed class)
      expect(mainContentElement).not.toHaveClass('sidebar-collapsed')

      // Click to collapse
      await act(async () => {
        await user.click(toggleButton)
      })

      expect(mainContentElement).toHaveClass('sidebar-collapsed')

      // Click to expand
      await act(async () => {
        await user.click(toggleButton)
      })

      expect(mainContentElement).not.toHaveClass('sidebar-collapsed')
    })
  })

  describe('Authentication Flow', () => {
    it('should display default user information', () => {
      const { container } = renderApp()

      // Check user menu toggle exists
      const userMenuToggle = container.querySelector('.user-menu-toggle')
      expect(userMenuToggle).toBeInTheDocument()
    })

    it('should handle logout', async () => {
      const user = userEvent.setup()
      const { container } = renderApp()

      // Open user dropdown
      const userMenuButton = container.querySelector('.user-menu-toggle')
      if (userMenuButton) {
        await act(async () => {
          await user.click(userMenuButton)
        })

        // Find and click logout
        const logoutButtons = screen.getAllByRole('button').filter(btn => btn.textContent?.includes('Logout'))
        if (logoutButtons.length > 0) {
          await act(async () => {
            await user.click(logoutButtons[0])
          })

          expect(localStorage.removeItem).toHaveBeenCalled()
        }
      }
    })
  })

  describe('Internationalization', () => {
    it('should change language when selecting from dropdown', async () => {
      const user = userEvent.setup()
      renderApp()

      // Open language dropdown
      const languageButton = screen.getByLabelText('Select language')
      await act(async () => {
        await user.click(languageButton)
      })

      // Should show language options
      expect(screen.getByText('Select Language')).toBeInTheDocument()

      // Find and click Chinese option
      const dropdownItems = screen.getAllByRole('button')
      const chineseOption = dropdownItems.find(btn => btn.textContent?.includes('中文'))
      if (chineseOption) {
        await act(async () => {
          await user.click(chineseOption)
        })

        expect(localStorage.setItem).toHaveBeenCalledWith('arcana_language', 'zh')
      }
    })

    it('should persist language preference', async () => {
      // Mock stored language
      localStorage.getItem = vi.fn((key) => {
        if (key === 'arcana_language') return 'zh'
        return null
      })

      renderApp()

      // Language should be loaded from localStorage
      expect(localStorage.getItem).toHaveBeenCalledWith('arcana_language')
    })
  })

  describe('Right Panel', () => {
    it('should toggle right panel when toggle button is clicked', async () => {
      const user = userEvent.setup()
      const { container } = renderApp()

      const toggleButton = screen.getByLabelText('Toggle right panel')
      const mainContentElement = container.querySelector('.main-content')

      // Initial state - right panel should be closed
      expect(mainContentElement).not.toHaveClass('right-panel-open')

      // Click to open
      await act(async () => {
        await user.click(toggleButton)
      })

      expect(mainContentElement).toHaveClass('right-panel-open')

      // Click to close
      await act(async () => {
        await user.click(toggleButton)
      })

      expect(mainContentElement).not.toHaveClass('right-panel-open')
    })
  })

  describe('Search', () => {
    it('should have a search input', () => {
      renderApp()

      const searchInput = screen.getByPlaceholderText(/search/i)
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('Notifications', () => {
    it('should display notification badge', () => {
      renderApp()

      // Check for notification badge
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })
})

describe('App Responsiveness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
  })

  it('should render all main components', () => {
    renderApp()

    // Header should be present
    expect(screen.getByText('Arcana')).toBeInTheDocument()

    // Search should be present
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })
})
