// =============================================================================
// User Form Component
// =============================================================================
// Presentation layer component that uses UserFormViewModel for all business logic.
// This component only handles UI rendering - no direct API calls.
// Follows UDF pattern: dispatch Input actions, render from Output state.
// =============================================================================

import { useParams, Link } from 'react-router-dom'
import { useI18n } from '@core/providers/I18nProvider'
import { useUserFormViewModel } from '../viewmodels/userFormViewModel'
import type { UserValidationErrors } from '@/app/domain/entities/user.model'
import './UserFormComponent.scss'

export function UserFormComponent() {
  const { id } = useParams<{ id: string }>()
  const { t } = useI18n()

  // Use ViewModel - UDF Input/Output pattern
  const { output, dispatch } = useUserFormViewModel(id)

  // ==========================================================================
  // Event Handlers - dispatch Input actions
  // ==========================================================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    dispatch({
      type: 'SET_FIELD',
      field: name as 'firstName' | 'lastName' | 'email' | 'avatar',
      value,
    })
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    dispatch({
      type: 'VALIDATE_FIELD',
      field: name as keyof UserValidationErrors,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'SUBMIT' })
  }

  const handleReset = () => {
    dispatch({ type: 'RESET' })
  }

  const handleNavigateToList = () => {
    dispatch({ type: 'NAVIGATE_TO_LIST' })
  }

  const handleDismissError = () => {
    dispatch({ type: 'DISMISS_ERROR' })
  }

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  const getInitials = () => {
    const first = output.firstName.charAt(0) || ''
    const last = output.lastName.charAt(0) || ''
    return `${first}${last}`.toUpperCase() || '?'
  }

  // ==========================================================================
  // Render - driven by Output state
  // ==========================================================================

  return (
    <div className="user-form-page container-fluid py-4">
      {/* Back Button */}
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={handleNavigateToList}
      >
        <i className="bi bi-arrow-left me-2"></i>
        {t('common.back')}
      </button>

      {/* Page Header */}
      <div className="page-header mb-4">
        <h2 className="mb-1">
          {output.isEditMode ? t('user.form.edit.title') : t('user.form.create.title')}
        </h2>
        <p className="text-muted mb-0">
          {output.isEditMode ? t('user.form.edit.subtitle') : t('user.form.create.subtitle')}
        </p>
      </div>

      {/* Success Alert */}
      {output.successMessage && (
        <div className="alert alert-success fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          {output.successMessage}
        </div>
      )}

      {/* API Error Alert */}
      {output.submitError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {output.submitError}
          <button type="button" className="btn-close" onClick={handleDismissError}></button>
        </div>
      )}

      {/* Loading State */}
      {output.isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
          </div>
          <p className="mt-3 text-muted">{t('user.form.loading')}</p>
        </div>
      )}

      {/* Form */}
      {!output.isLoading && (
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleSubmit} noValidate>
                  {/* First Name */}
                  <div className="mb-3">
                    <label htmlFor="firstName" className="form-label">
                      {t('user.form.field.first.name')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className={`form-control ${output.errors.firstName ? 'is-invalid' : ''}`}
                      placeholder={t('user.form.placeholder.first.name')}
                      value={output.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={output.isSubmitting}
                    />
                    {output.errors.firstName && (
                      <div className="invalid-feedback">{output.errors.firstName}</div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="mb-3">
                    <label htmlFor="lastName" className="form-label">
                      {t('user.form.field.last.name')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className={`form-control ${output.errors.lastName ? 'is-invalid' : ''}`}
                      placeholder={t('user.form.placeholder.last.name')}
                      value={output.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={output.isSubmitting}
                    />
                    {output.errors.lastName && (
                      <div className="invalid-feedback">{output.errors.lastName}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      {t('user.form.field.email')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`form-control ${output.errors.email ? 'is-invalid' : ''}`}
                      placeholder={t('user.form.placeholder.email')}
                      value={output.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={output.isSubmitting}
                    />
                    {output.errors.email && (
                      <div className="invalid-feedback">{output.errors.email}</div>
                    )}
                  </div>

                  {/* Avatar URL */}
                  <div className="mb-4">
                    <label htmlFor="avatar" className="form-label">
                      {t('user.form.field.avatar')}
                      <span className="text-muted ms-1">({t('user.form.optional')})</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="url"
                        id="avatar"
                        name="avatar"
                        className={`form-control ${output.errors.avatar ? 'is-invalid' : ''}`}
                        placeholder={t('user.form.placeholder.avatar')}
                        value={output.avatar}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={output.isSubmitting}
                      />
                      {/* Avatar Preview */}
                      <span className="input-group-text p-0">
                        {output.avatar ? (
                          <img
                            src={output.avatar}
                            alt="Avatar preview"
                            className="avatar-preview"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="avatar-preview avatar-initials">
                            {getInitials()}
                          </div>
                        )}
                      </span>
                    </div>
                    {output.errors.avatar && (
                      <div className="text-danger small mt-1">{output.errors.avatar}</div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleReset}
                      disabled={output.isSubmitting || !output.isDirty}
                    >
                      <i className="bi bi-arrow-counterclockwise me-2"></i>
                      {t('user.form.button.reset')}
                    </button>
                    <div className="d-flex gap-2">
                      <Link to="/users" className="btn btn-outline-secondary">
                        {t('user.form.button.cancel')}
                      </Link>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={output.isSubmitting || !output.isValid}
                      >
                        {output.isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            {t('user.form.button.saving')}
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-lg me-2"></i>
                            {output.isEditMode ? t('user.form.button.update') : t('user.form.button.create')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="col-lg-4 mt-4 mt-lg-0">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="bi bi-question-circle me-2 text-primary"></i>
                  {t('user.form.help.title')}
                </h6>
                <ul className="list-unstyled small text-muted mb-0">
                  <li className="mb-2">
                    <i className="bi bi-check text-success me-2"></i>
                    {t('user.form.help.name.length')}
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check text-success me-2"></i>
                    {t('user.form.help.name.characters')}
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check text-success me-2"></i>
                    {t('user.form.help.email.format')}
                  </li>
                  <li>
                    <i className="bi bi-check text-success me-2"></i>
                    {t('user.form.help.avatar.optional')}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
