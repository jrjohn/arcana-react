import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useI18n } from '@core/providers/I18nProvider'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar: string
}

export function UserDetailComponent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`https://reqres.in/api/users/${id}`)
        if (!response.ok) {
          throw new Error('User not found')
        }
        const data = await response.json()
        setUser(data.data)
      } catch (err) {
        setError(t('error.not.found'))
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchUser()
    }
  }, [id, t])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="user-detail-page container-fluid py-4">
      {/* Back Button */}
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => navigate('/users')}
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

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
          </div>
          <p className="mt-3 text-muted">{t('user.detail.loading')}</p>
        </div>
      )}

      {/* User Detail Card */}
      {!isLoading && user && (
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-body text-center py-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="rounded-circle mb-3"
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '120px', height: '120px', fontSize: '2.5rem' }}
                  >
                    {getInitials(user.first_name, user.last_name)}
                  </div>
                )}
                <h4>{user.first_name} {user.last_name}</h4>
                <p className="text-muted">
                  <i className="bi bi-envelope me-2"></i>
                  {user.email}
                </p>

                <hr className="my-4" />

                {/* Info Grid */}
                <div className="row text-start">
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-badge text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.user.id')}</small>
                        <div className="fw-semibold">#{user.id}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.first.name')}</small>
                        <div className="fw-semibold">{user.first_name}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-fill text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.last.name')}</small>
                        <div className="fw-semibold">{user.last_name}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-envelope text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.email.address')}</small>
                        <div className="fw-semibold">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar-plus text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.created.at')}</small>
                        <div className="fw-semibold">{formatDate()}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar-check text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                      <div>
                        <small className="text-muted">{t('user.detail.updated.at')}</small>
                        <div className="fw-semibold">{formatDate()}</div>
                      </div>
                    </div>
                  </div>
                  {user.avatar && (
                    <div className="col-12 mb-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-image text-primary me-3" style={{ fontSize: '1.25rem' }}></i>
                        <div style={{ overflow: 'hidden' }}>
                          <small className="text-muted">{t('user.detail.avatar.url')}</small>
                          <div className="fw-semibold text-truncate">{user.avatar}</div>
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
                <Link to={`/users/${user.id}/edit`} className="btn btn-primary">
                  <i className="bi bi-pencil me-2"></i>
                  {t('user.detail.edit.user')}
                </Link>
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
