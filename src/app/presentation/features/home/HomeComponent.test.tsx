import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from '@core/providers/I18nProvider'
import { AuthProvider } from '@core/providers/AuthProvider'
import { HomeComponent } from './HomeComponent'

// Test wrapper with all providers
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>{ui}</AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  )
}

describe('HomeComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
  })

  it('should render the dashboard title', () => {
    renderWithProviders(<HomeComponent />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('should display welcome message with user name', () => {
    renderWithProviders(<HomeComponent />)

    // Default demo user is "Admin" (from AuthProvider default state)
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
  })

  it('should render stat cards', () => {
    renderWithProviders(<HomeComponent />)

    expect(screen.getByText('2,847')).toBeInTheDocument() // Users count
    expect(screen.getByText('184')).toBeInTheDocument() // Projects count
    expect(screen.getByText('64')).toBeInTheDocument() // Tasks count
    expect(screen.getByText('23')).toBeInTheDocument() // Messages count
  })

  it('should render quick actions section', () => {
    renderWithProviders(<HomeComponent />)

    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Create User')).toBeInTheDocument()
    expect(screen.getByText('New Project')).toBeInTheDocument()
    expect(screen.getByText('View Documents')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('should render recent activity section', () => {
    renderWithProviders(<HomeComponent />)

    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('should render system stats section', () => {
    renderWithProviders(<HomeComponent />)

    expect(screen.getByText('System Stats')).toBeInTheDocument()
    expect(screen.getByText('CPU Usage')).toBeInTheDocument()
    expect(screen.getByText('Memory')).toBeInTheDocument()
    expect(screen.getByText('Storage')).toBeInTheDocument()
    expect(screen.getByText('Bandwidth')).toBeInTheDocument()
  })

  it('should render quick links section', () => {
    renderWithProviders(<HomeComponent />)

    expect(screen.getByText('Quick Links')).toBeInTheDocument()
  })

  it('should have working navigation links', () => {
    renderWithProviders(<HomeComponent />)

    // Find links by href attribute since there are multiple with similar names
    const allLinks = screen.getAllByRole('link')
    const usersLink = allLinks.find(link => link.getAttribute('href') === '/users')
    expect(usersLink).toBeInTheDocument()

    const createUserLink = allLinks.find(link => link.getAttribute('href') === '/users/new')
    expect(createUserLink).toBeInTheDocument()
  })

  it('should render export report and new item buttons', () => {
    renderWithProviders(<HomeComponent />)

    expect(screen.getByText('Export Report')).toBeInTheDocument()
    expect(screen.getByText('New Item')).toBeInTheDocument()
  })

  it('should display progress bars for system stats', () => {
    renderWithProviders(<HomeComponent />)

    const progressBars = screen.getAllByRole('progressbar')
    expect(progressBars.length).toBe(4) // CPU, Memory, Storage, Bandwidth
  })
})
