import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('spinner-border', 'text-primary', 'spinner-md')
  })

  it('should render small spinner', () => {
    render(<LoadingSpinner size="sm" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('spinner-sm')
  })

  it('should render large spinner', () => {
    render(<LoadingSpinner size="lg" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('spinner-lg')
  })

  it('should display message when provided', () => {
    render(<LoadingSpinner message="Please wait..." />)

    expect(screen.getByText('Please wait...')).toBeInTheDocument()
  })

  it('should not display message when not provided', () => {
    render(<LoadingSpinner />)

    expect(screen.queryByText(/please wait/i)).not.toBeInTheDocument()
  })

  it('should render full page spinner when fullPage is true', () => {
    const { container } = render(<LoadingSpinner fullPage />)

    expect(container.querySelector('.loading-spinner-fullpage')).toBeInTheDocument()
  })

  it('should not render full page wrapper when fullPage is false', () => {
    const { container } = render(<LoadingSpinner fullPage={false} />)

    expect(container.querySelector('.loading-spinner-fullpage')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />)

    expect(container.querySelector('.loading-spinner-container')).toHaveClass('custom-class')
  })

  it('should have accessible hidden text', () => {
    render(<LoadingSpinner />)

    expect(screen.getByText('Loading...')).toHaveClass('visually-hidden')
  })
})
