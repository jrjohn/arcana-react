import './LoadingSpinner.scss'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullPage?: boolean
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  message,
  fullPage = false,
  className = '',
}: LoadingSpinnerProps) {
  const spinnerContent = (
    <div className={`loading-spinner-container ${className}`}>
      <div className={`spinner-border text-primary spinner-${size}`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="loading-message mt-3 text-muted">{message}</p>}
    </div>
  )

  if (fullPage) {
    return <div className="loading-spinner-fullpage">{spinnerContent}</div>
  }

  return spinnerContent
}
