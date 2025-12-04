import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useI18n } from '@core/providers/I18nProvider'
import './UserFormComponent.scss'

interface UserForm {
  firstName: string
  lastName: string
  email: string
  avatar: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  avatar?: string
}

interface MockUser {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar: string
}

// Mock data for fallback when API is unavailable
const MOCK_USERS: MockUser[] = [
  { id: 1, email: 'george.bluth@reqres.in', first_name: 'George', last_name: 'Bluth', avatar: 'https://reqres.in/img/faces/1-image.jpg' },
  { id: 2, email: 'janet.weaver@reqres.in', first_name: 'Janet', last_name: 'Weaver', avatar: 'https://reqres.in/img/faces/2-image.jpg' },
  { id: 3, email: 'emma.wong@reqres.in', first_name: 'Emma', last_name: 'Wong', avatar: 'https://reqres.in/img/faces/3-image.jpg' },
  { id: 4, email: 'eve.holt@reqres.in', first_name: 'Eve', last_name: 'Holt', avatar: 'https://reqres.in/img/faces/4-image.jpg' },
  { id: 5, email: 'charles.morris@reqres.in', first_name: 'Charles', last_name: 'Morris', avatar: 'https://reqres.in/img/faces/5-image.jpg' },
  { id: 6, email: 'tracey.ramos@reqres.in', first_name: 'Tracey', last_name: 'Ramos', avatar: 'https://reqres.in/img/faces/6-image.jpg' },
  { id: 7, email: 'michael.lawson@reqres.in', first_name: 'Michael', last_name: 'Lawson', avatar: 'https://reqres.in/img/faces/7-image.jpg' },
  { id: 8, email: 'lindsay.ferguson@reqres.in', first_name: 'Lindsay', last_name: 'Ferguson', avatar: 'https://reqres.in/img/faces/8-image.jpg' },
  { id: 9, email: 'tobias.funke@reqres.in', first_name: 'Tobias', last_name: 'Funke', avatar: 'https://reqres.in/img/faces/9-image.jpg' },
  { id: 10, email: 'byron.fields@reqres.in', first_name: 'Byron', last_name: 'Fields', avatar: 'https://reqres.in/img/faces/10-image.jpg' },
  { id: 11, email: 'george.edwards@reqres.in', first_name: 'George', last_name: 'Edwards', avatar: 'https://reqres.in/img/faces/11-image.jpg' },
  { id: 12, email: 'rachel.howell@reqres.in', first_name: 'Rachel', last_name: 'Howell', avatar: 'https://reqres.in/img/faces/12-image.jpg' },
]

export function UserFormComponent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()

  const isEditMode = !!id

  const [form, setForm] = useState<UserForm>({
    firstName: '',
    lastName: '',
    email: '',
    avatar: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditMode && id) {
      const fetchUser = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`https://reqres.in/api/users/${id}`)
          if (!response.ok) {
            throw new Error('API not available')
          }
          const data = await response.json()
          if (data.data) {
            const user = data.data
            setForm({
              firstName: user.first_name,
              lastName: user.last_name,
              email: user.email,
              avatar: user.avatar || '',
            })
          } else {
            throw new Error('Invalid response')
          }
        } catch {
          // Fallback to mock data when API fails
          console.log('API unavailable, using mock data')
          const mockUser = MOCK_USERS.find(u => u.id === Number(id))
          if (mockUser) {
            setForm({
              firstName: mockUser.first_name,
              lastName: mockUser.last_name,
              email: mockUser.email,
              avatar: mockUser.avatar || '',
            })
          } else {
            setApiError(t('error.not.found'))
          }
        } finally {
          setIsLoading(false)
        }
      }
      fetchUser()
    }
  }, [id, isEditMode, t])

  const validateField = (name: keyof UserForm, value: string): string | undefined => {
    const namePattern = /^[a-zA-Z\s\-']+$/

    switch (name) {
      case 'firstName':
        if (!value.trim()) return t('user.form.error.first.name.required')
        if (value.length < 2) return t('user.form.error.first.name.min')
        if (value.length > 50) return t('user.form.error.first.name.max')
        if (!namePattern.test(value)) return t('user.form.error.first.name.pattern')
        break
      case 'lastName':
        if (!value.trim()) return t('user.form.error.last.name.required')
        if (value.length < 2) return t('user.form.error.last.name.min')
        if (value.length > 50) return t('user.form.error.last.name.max')
        if (!namePattern.test(value)) return t('user.form.error.last.name.pattern')
        break
      case 'email':
        if (!value.trim()) return t('user.form.error.email.required')
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailPattern.test(value)) return t('user.form.error.email.invalid')
        break
      case 'avatar':
        if (value.trim()) {
          const urlPattern = /^https?:\/\/.+/
          if (!urlPattern.test(value)) return t('user.form.error.avatar.invalid')
        }
        break
    }
    return undefined
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const error = validateField(name as keyof UserForm, value)
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    Object.keys(form).forEach(key => {
      const fieldName = key as keyof UserForm
      const error = validateField(fieldName, form[fieldName])
      if (error) {
        newErrors[fieldName] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    setApiError(null)

    try {
      const url = isEditMode
        ? `https://reqres.in/api/users/${id}`
        : 'https://reqres.in/api/users'

      const method = isEditMode ? 'PUT' : 'POST'

      // Try API call, but proceed with navigation regardless (for demo purposes)
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          avatar: form.avatar,
        }),
      }).catch(() => {
        console.log('API unavailable, proceeding with mock save')
      })

      navigate('/users')
    } catch {
      // Navigate anyway for demo purposes
      navigate('/users')
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = () => {
    const first = form.firstName.charAt(0) || ''
    const last = form.lastName.charAt(0) || ''
    return `${first}${last}`.toUpperCase() || '?'
  }

  return (
    <div className="user-form-page container-fluid py-4">
      {/* Back Button */}
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => navigate('/users')}
      >
        <i className="bi bi-arrow-left me-2"></i>
        {t('common.back')}
      </button>

      {/* Page Header */}
      <div className="page-header mb-4">
        <h2 className="mb-1">
          {isEditMode ? t('user.form.edit.title') : t('user.form.create.title')}
        </h2>
        <p className="text-muted mb-0">
          {isEditMode ? t('user.form.edit.subtitle') : t('user.form.create.subtitle')}
        </p>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {apiError}
          <button type="button" className="btn-close" onClick={() => setApiError(null)}></button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
          </div>
          <p className="mt-3 text-muted">{t('user.form.loading')}</p>
        </div>
      )}

      {/* Form */}
      {!isLoading && (
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
                      className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                      placeholder={t('user.form.placeholder.first.name')}
                      value={form.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                    />
                    {errors.firstName && (
                      <div className="invalid-feedback">{errors.firstName}</div>
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
                      className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                      placeholder={t('user.form.placeholder.last.name')}
                      value={form.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                    />
                    {errors.lastName && (
                      <div className="invalid-feedback">{errors.lastName}</div>
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
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder={t('user.form.placeholder.email')}
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
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
                        className={`form-control ${errors.avatar ? 'is-invalid' : ''}`}
                        placeholder={t('user.form.placeholder.avatar')}
                        value={form.avatar}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isSaving}
                      />
                      {/* Avatar Preview */}
                      <span className="input-group-text p-0">
                        {form.avatar ? (
                          <img
                            src={form.avatar}
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
                    {errors.avatar && (
                      <div className="text-danger small mt-1">{errors.avatar}</div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="d-flex justify-content-end gap-2">
                    <Link to="/users" className="btn btn-outline-secondary">
                      {t('user.form.button.cancel')}
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          {t('user.form.button.saving')}
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          {isEditMode ? t('user.form.button.update') : t('user.form.button.create')}
                        </>
                      )}
                    </button>
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
