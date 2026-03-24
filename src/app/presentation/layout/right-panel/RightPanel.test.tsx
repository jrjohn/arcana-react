import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from '@core/providers/I18nProvider'
import { AuthProvider } from '@core/providers/AuthProvider'
import { ThemeProvider } from '@core/providers/ThemeProvider'
import { RightPanel } from './RightPanel'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function renderWithProviders(props: { isOpen?: boolean; onClose?: () => void } = {}) {
  const { isOpen = true, onClose = vi.fn() } = props

  return {
    ...render(
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <ThemeProvider>
              <RightPanel isOpen={isOpen} onClose={onClose} />
            </ThemeProvider>
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    ),
    onClose,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RightPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
  })

  // --- Rendering ---

  it('renders the panel header', () => {
    renderWithProviders()
    expect(screen.getByText('Activity Center')).toBeInTheDocument()
  })

  it('renders close button', () => {
    renderWithProviders()
    expect(screen.getByLabelText('Close panel')).toBeInTheDocument()
  })

  it('renders three tabs', () => {
    renderWithProviders()
    expect(screen.getByText('Activity')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('has open class when isOpen is true', () => {
    const { container } = renderWithProviders({ isOpen: true })
    expect(container.querySelector('.right-panel.open')).toBeInTheDocument()
  })

  it('does not have open class when isOpen is false', () => {
    const { container } = renderWithProviders({ isOpen: false })
    expect(container.querySelector('.right-panel.open')).not.toBeInTheDocument()
  })

  // --- Activity tab (default) ---

  it('shows activity tab content by default', () => {
    renderWithProviders()
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('Clear All')).toBeInTheDocument()
  })

  it('displays activity items', () => {
    renderWithProviders()
    expect(screen.getByText('Project Updated')).toBeInTheDocument()
    expect(screen.getByText('New User')).toBeInTheDocument()
    expect(screen.getByText('Storage Warning')).toBeInTheDocument()
  })

  it('displays activity descriptions', () => {
    renderWithProviders()
    expect(screen.getByText('Dashboard redesign completed successfully')).toBeInTheDocument()
    expect(screen.getByText('John Doe joined the team')).toBeInTheDocument()
  })

  it('clears all activities when Clear All is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const clearBtn = screen.getByText('Clear All')
    await act(async () => {
      await user.click(clearBtn)
    })

    expect(screen.getByText('No recent activity')).toBeInTheDocument()
    expect(screen.queryByText('Project Updated')).not.toBeInTheDocument()
  })

  // --- Notifications tab ---

  it('switches to notifications tab when clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const notifTab = screen.getByText('Notifications').closest('button')!
    await act(async () => {
      await user.click(notifTab)
    })

    expect(screen.getByText('Mark All Read')).toBeInTheDocument()
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument()
    expect(screen.getByText('System Update')).toBeInTheDocument()
  })

  it('shows unread badge count on notifications tab', () => {
    renderWithProviders()
    // 2 unread notifications in initial data
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('marks notification as read when clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    // Switch to notifications tab
    const notifTab = screen.getByText('Notifications').closest('button')!
    await act(async () => {
      await user.click(notifTab)
    })

    // Find an unread notification and click it
    const unreadItems = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('notification-item') && btn.classList.contains('unread')
    )

    if (unreadItems.length > 0) {
      await act(async () => {
        await user.click(unreadItems[0])
      })
      // After clicking, the notification should no longer have unread class
      expect(unreadItems[0]).not.toHaveClass('unread')
    }
  })

  it('marks all as read when "Mark All Read" is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    // Switch to notifications tab
    const notifTab = screen.getByText('Notifications').closest('button')!
    await act(async () => {
      await user.click(notifTab)
    })

    const markAllBtn = screen.getByText('Mark All Read')
    await act(async () => {
      await user.click(markAllBtn)
    })

    // After marking all as read, no unread indicators should exist
    const unreadIndicators = screen.queryAllByRole('button').filter(
      btn => btn.classList.contains('notification-item') && btn.classList.contains('unread')
    )
    expect(unreadIndicators.length).toBe(0)
  })

  it('shows notification messages', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const notifTab = screen.getByText('Notifications').closest('button')!
    await act(async () => {
      await user.click(notifTab)
    })

    expect(screen.getByText('Approved your pull request')).toBeInTheDocument()
    expect(screen.getByText('New version available for download')).toBeInTheDocument()
    expect(screen.getByText('Mentioned you in a comment')).toBeInTheDocument()
  })

  // --- Settings tab ---

  it('switches to settings tab when clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const settingsTab = screen.getByText('Settings').closest('button')!
    await act(async () => {
      await user.click(settingsTab)
    })

    expect(screen.getByText('Quick Settings')).toBeInTheDocument()
    expect(screen.getByText('Push Notifications')).toBeInTheDocument()
    expect(screen.getByText('Email Notifications')).toBeInTheDocument()
    expect(screen.getByText('Dark Mode')).toBeInTheDocument()
    expect(screen.getByText('Two-Factor Auth')).toBeInTheDocument()
    expect(screen.getByText('Privacy Mode')).toBeInTheDocument()
  })

  it('renders system info in settings tab', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const settingsTab = screen.getByText('Settings').closest('button')!
    await act(async () => {
      await user.click(settingsTab)
    })

    expect(screen.getByText('Version')).toBeInTheDocument()
    expect(screen.getByText('Build')).toBeInTheDocument()
    expect(screen.getByText('Environment')).toBeInTheDocument()
    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
    expect(screen.getByText('2025.12.04')).toBeInTheDocument()
  })

  it('toggles push notifications setting', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const settingsTab = screen.getByText('Settings').closest('button')!
    await act(async () => {
      await user.click(settingsTab)
    })

    // Get all checkboxes
    const checkboxes = screen.getAllByRole('checkbox')
    // Push notifications is the first checkbox and should be checked initially
    expect(checkboxes[0]).toBeChecked()

    await act(async () => {
      await user.click(checkboxes[0])
    })
    expect(checkboxes[0]).not.toBeChecked()
  })

  it('toggles two-factor setting', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const settingsTab = screen.getByText('Settings').closest('button')!
    await act(async () => {
      await user.click(settingsTab)
    })

    const checkboxes = screen.getAllByRole('checkbox')
    // twoFactor is the 4th checkbox (push, email, darkMode, twoFactor) - initially false
    expect(checkboxes[3]).not.toBeChecked()

    await act(async () => {
      await user.click(checkboxes[3])
    })
    expect(checkboxes[3]).toBeChecked()
  })

  // --- Close button ---

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderWithProviders()

    const closeBtn = screen.getByLabelText('Close panel')
    await act(async () => {
      await user.click(closeBtn)
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // --- Tab switching ---

  it('highlights active tab', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const notifTab = screen.getByText('Notifications').closest('button')!
    await act(async () => {
      await user.click(notifTab)
    })
    expect(notifTab).toHaveClass('active')

    // Activity tab should no longer be active
    const activityTab = screen.getByText('Activity').closest('button')!
    expect(activityTab).not.toHaveClass('active')
  })
})
