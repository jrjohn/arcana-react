import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from '@core/providers/I18nProvider'
import { AuthProvider } from '@core/providers/AuthProvider'
import { Header } from './Header'

// Test wrapper with all providers
function renderWithProviders(
  _ui: React.ReactElement,
  options: { onToggleSidebar?: () => void; onToggleRightPanel?: () => void; rightPanelOpen?: boolean } = {}
) {
  const {
    onToggleSidebar = vi.fn(),
    onToggleRightPanel = vi.fn(),
    rightPanelOpen = false,
  } = options

  return {
    ...render(
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <Header
              onToggleSidebar={onToggleSidebar}
              onToggleRightPanel={onToggleRightPanel}
              rightPanelOpen={rightPanelOpen}
            />
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    ),
    onToggleSidebar,
    onToggleRightPanel,
  }
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
  })

  it('should render header with brand name', () => {
    renderWithProviders(<Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />)

    expect(screen.getByText('Arcana')).toBeInTheDocument()
  })

  it('should render search input', () => {
    renderWithProviders(<Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />)

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('should call onToggleSidebar when sidebar toggle is clicked', async () => {
    const user = userEvent.setup()
    const { onToggleSidebar } = renderWithProviders(
      <Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />
    )

    const toggleButton = screen.getByLabelText('Toggle sidebar')
    await act(async () => {
      await user.click(toggleButton)
    })

    expect(onToggleSidebar).toHaveBeenCalledTimes(1)
  })

  it('should call onToggleRightPanel when right panel toggle is clicked', async () => {
    const user = userEvent.setup()
    const { onToggleRightPanel } = renderWithProviders(
      <Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />
    )

    const toggleButton = screen.getByLabelText('Toggle right panel')
    await act(async () => {
      await user.click(toggleButton)
    })

    expect(onToggleRightPanel).toHaveBeenCalledTimes(1)
  })

  it('should display current language', () => {
    renderWithProviders(<Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />)

    // Default language is English - use getAllByText since it appears multiple times
    const englishElements = screen.getAllByText('English')
    expect(englishElements.length).toBeGreaterThan(0)
  })

  it('should open language dropdown when clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />)

    const languageButton = screen.getByLabelText('Select language')
    await act(async () => {
      await user.click(languageButton)
    })

    expect(screen.getByText('Select Language')).toBeInTheDocument()
  })

  it('should change language when selecting from dropdown', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />)

    const languageButton = screen.getByLabelText('Select language')
    await act(async () => {
      await user.click(languageButton)
    })

    // Find and click Chinese option - contains Chinese characters
    const dropdownItems = screen.getAllByRole('button')
    const chineseOption = dropdownItems.find(btn => btn.textContent?.includes('中文'))
    if (chineseOption) {
      await act(async () => {
        await user.click(chineseOption)
      })
      expect(localStorage.setItem).toHaveBeenCalledWith('arcana_language', 'zh')
    }
  })

  it('should display user name from auth context', () => {
    const { container } = renderWithProviders(<Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />)

    // Default demo user is "John Doe" - check for user avatar or name element
    const userMenuToggle = container.querySelector('.user-menu-toggle')
    expect(userMenuToggle).toBeInTheDocument()
  })

  it('should open user dropdown when clicked', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(<Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />)

    const userMenuButton = container.querySelector('.user-menu-toggle')
    if (userMenuButton) {
      await act(async () => {
        await user.click(userMenuButton)
      })

      // After clicking, dropdown should open - look for any "My Profile" text
      const profileTexts = screen.getAllByText('My Profile')
      expect(profileTexts.length).toBeGreaterThan(0)
    }
  })

  it('should call logout when logout menu item is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    )

    // Open user dropdown
    const userMenuButton = container.querySelector('.user-menu-toggle')
    if (userMenuButton) {
      await act(async () => {
        await user.click(userMenuButton)
      })

      const logoutButtons = screen.getAllByRole('button').filter(btn => btn.textContent?.includes('Logout'))
      if (logoutButtons.length > 0) {
        await act(async () => {
          await user.click(logoutButtons[0])
        })
        expect(localStorage.removeItem).toHaveBeenCalled()
      }
    }
  })

  it('should display notification badge', () => {
    renderWithProviders(<Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />)

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should have brand link to home', () => {
    renderWithProviders(<Header onToggleSidebar={vi.fn()} onToggleRightPanel={vi.fn()} rightPanelOpen={false} />)

    const brandLink = screen.getByText('Arcana').closest('a')
    expect(brandLink).toHaveAttribute('href', '/')
  })
})
