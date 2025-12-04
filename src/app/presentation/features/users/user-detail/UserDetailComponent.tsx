// =============================================================================
// User Detail Component
// =============================================================================
// Presentation layer component that uses UserDetailViewModel for all business logic.
// This component only handles UI rendering - no direct API calls.
// Follows UDF pattern: dispatch Input actions, render from Output state.
// =============================================================================

import { useParams, Link } from 'react-router-dom'
import { useI18n } from '@core/providers/I18nProvider'
import { useUserDetailViewModel } from '../viewmodels/userDetailViewModel'

export function UserDetailComponent() {
  const { id } = useParams<{ id: string }>()
  const { t } = useI18n()

  // Use ViewModel - UDF Input/Output pattern
  const { output, dispatch } = useUserDetailViewModel(id || '')

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ==========================================================================
  // Event Handlers - dispatch Input actions
  // ==========================================================================

  const handleDelete = async () => {
    if (output.user && window.confirm(t('user.delete.message', { name: output.fullName }))) {
      dispatch({ type: 'DELETE_USER' })
    }
  }

  const handleNavigateToList = () => {
    dispatch({ type: 'NAVIGATE_TO_LIST' })
  }

  const handleNavigateToEdit = () => {
    if (output.user) {
      dispatch({ type: 'NAVIGATE_TO_EDIT', id: output.user.id })
    }
  }

  const handleDismissError = () => {
    dispatch({ type: 'DISMISS_ERROR' })
  }

  // ==========================================================================
  // Render - driven by Output state
  // ==========================================================================

  return (
    <div className="user-detail-page container-fluid py-4">
      {/* Back Button */}
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={handleNavigateToList}
      >
        <i className="bi bi-arrow-left me-2"></i>
        {t('common.back')}
      </button>

      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">{t('user.detail.title')}</h2>
          <p className="text-muted mb-0">{t('user.detail.subtitle')}</p>
        </div>
      </div>

      {/* Success Alert */}
      {output.successMessage && (
        <div className="alert alert-success fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          {output.successMessage}
        </div>
      )}

      {/* Error Alert */}
      {output.error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {output.error}
          <button type="button" className="btn-close" onClick={handleDismissError}></button>
        </div>
      )}

      {/* Loading State */}
      {output.isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
          </div>
          <p className="mt-3 text-muted">{t('user.detail.loading')}</p>
        </div>
      )}

      {/* User Detail Card */}
      {!output.isLoading && output.user && (
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-body text-center py-4">
                {output.user.avatar ? (
                  <img
                    src={output.user.avatar}
                    alt={output.fullName}
                    className="rounded-circle mb-3"
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '120px', height: '120px', fontSize: '2.5rem' }}
                  >
                    {output.initials}
                  </div>
                )}
                <h4>{output.fullName}</h4>
                <p className="text-muted">
                  <i className="bi bi-envelope me-2"></i>
                  {output.user.email}
                </p>

                <hr className="my-4" />

                {/* Info Grid */}
                <div className="row text-start">
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-badge text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.user.id')}</small>
                        <div className="fw-semibold">#{output.user.id}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.first.name')}</small>
                        <div className="fw-semibold">{output.user.firstName}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-fill text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.last.name')}</small>
                        <div className="fw-semibold">{output.user.lastName}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-envelope text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.email.address')}</small>
                        <div className="fw-semibold">{output.user.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar-plus text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.created.at')}</small>
                        <div className="fw-semibold">{formatDate(output.user.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar-check text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.updated.at')}</small>
                        <div className="fw-semibold">{formatDate(output.user.updatedAt)}</div>
                      </div>
                    </div>
                  </div>
                  {output.user.avatar && (
                    <div className="col-12 mb-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-image text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                        <div style={{ overflow: 'hidden' }}>
                          <small className="text-muted">{t('user.detail.avatar.url')}</small>
                          <div className="fw-semibold text-truncate">{output.user.avatar}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-footer bg-white d-flex justify-content-between">
                <Link to="/users" className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-left me-2"></i>
                  {t('user.detail.back.to.list')}
                </Link>
                <div className="btn-group">
                  <button
                    className="btn btn-outline-danger"
                    onClick={handleDelete}
                    disabled={output.isDeleting}
                  >
                    {output.isDeleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        {t('common.deleting')}
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash me-2"></i>
                        {t('common.delete')}
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleNavigateToEdit}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    {t('user.detail.edit.user')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="col-lg-4 mt-4 mt-lg-0">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="bi bi-info-circle me-2 text-primary"></i>
                  {t('user.detail.information')}
                </h6>
                <p className="card-text text-muted small">
                  {t('user.detail.information.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
