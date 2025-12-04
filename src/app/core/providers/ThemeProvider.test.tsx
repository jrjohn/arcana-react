import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from './ThemeProvider'

// Test component that uses the theme context
function TestComponent() {
  const { theme, isDarkMode, toggleTheme, setTheme } = useTheme()

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="is-dark">{isDarkMode ? 'yes' : 'no'}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn().mockReturnValue(null)
    localStorage.setItem = vi.fn()
    // Reset document attribute
    document.documentElement.removeAttribute('data-theme')
  })

  it('should provide default theme (light)', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('is-dark')).toHaveTextContent('no')
  })

  it('should toggle theme', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('light')

    await act(async () => {
      await user.click(screen.getByText('Toggle Theme'))
    })

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('is-dark')).toHaveTextContent('yes')
    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('should set specific theme', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await act(async () => {
      await user.click(screen.getByText('Set Dark'))
    })

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')

    await act(async () => {
      await user.click(screen.getByText('Set Light'))
    })

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('should load theme from localStorage', () => {
    localStorage.getItem = vi.fn().mockReturnValue('dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('should persist theme to localStorage', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await act(async () => {
      await user.click(screen.getByText('Set Dark'))
    })

    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('should apply theme to document', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await act(async () => {
      await user.click(screen.getByText('Set Dark'))
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should throw error when useTheme is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })
})
