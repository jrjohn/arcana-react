import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '@core/providers/I18nProvider'
import './UserListComponent.scss'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar: string
}

export function UserListComponent() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const pageSize = 6

  const fetchUsers = useCallback(async (page: number, showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const response = await fetch(`https://reqres.in/api/users?page=${page}&per_page=${pageSize}`)
      const data = await response.json()

      setUsers(data.data)
      setTotalPages(data.total_pages)
      setTotalItems(data.total)
      setCurrentPage(page)
    } catch (err) {
      setError(t('error.network'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [t, pageSize])

  useEffect(() => {
    fetchUsers(1)
  }, [fetchUsers])

  const handleRefresh = () => {
    fetchUsers(currentPage, true)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchUsers(page)
    }
  }

  const handleViewUser = (user: User) => {
    navigate(`/users/${user.id}`)
  }

  const handleEditUser = (user: User) => {
    navigate(`/users/${user.id}/edit`)
  }

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(t('user.delete.message', { name: `${user.first_name} ${user.last_name}` }))) {
      try {
        await fetch(`https://reqres.in/api/users/${user.id}`, { method: 'DELETE' })
        setSuccessMessage(t('user.deleted.success', { name: `${user.first_name} ${user.last_name}` }))
        setUsers(prev => prev.filter(u => u.id !== user.id))
        setTimeout(() => setSuccessMessage(null), 5000)
      } catch (err) {
        setError(t('error.unknown'))
      }
    }
  }

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.first_name.toLowerCase().includes(query) ||
      user.last_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  })

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="user-list-page container-fluid py-4">
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">{t('user.list.title')}</h2>
          <p className="text-muted mb-0">{t('user.list.subtitle')}</p>
        </div>
        <Link to="/users/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          {t('user.list.create')}
        </Link>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Search Bar */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="search-box position-relative">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder={t('user.list.search.placeholder')}
                  value={searchQuery}
                  onChange={handleSearch}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn btn-link clear-search"
                    onClick={clearSearch}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <button
                className="btn btn-outline-secondary"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin' : ''}`}></i>
                <span className="ms-2">{t('common.refresh')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
          </div>
          <p className="mt-3 text-muted">{t('common.loading')}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredUsers.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-people display-1 text-muted opacity-50"></i>
            <h4 className="mt-3 text-muted">{t('user.list.no.results')}</h4>
            <p className="text-muted">
              {searchQuery ? t('user.list.empty.search') : t('user.list.empty.message')}
            </p>
            {!searchQuery && (
              <Link to="/users/new" className="btn btn-primary mt-3">
                <i className="bi bi-plus-lg me-2"></i>
                {t('user.list.create')}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* User Table - Desktop */}
      {!isLoading && filteredUsers.length > 0 && (
        <>
          <div className="card d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>{t('table.id')}</th>
                    <th>{t('table.avatar')}</th>
                    <th>{t('table.name')}</th>
                    <th>{t('table.email')}</th>
                    <th className="text-end">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td>
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.first_name} ${user.last_name}`}
                            className="user-avatar"
                          />
                        ) : (
                          <div className="user-avatar avatar-initials">
                            {getInitials(user.first_name, user.last_name)}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{user.first_name} {user.last_name}</strong>
                      </td>
                      <td>{user.email}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleViewUser(user)}
                            title={t('common.view')}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleEditUser(user)}
                            title={t('common.edit')}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteUser(user)}
                            title={t('common.delete')}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Cards - Mobile */}
          <div className="d-md-none">
            {filteredUsers.map(user => (
              <div key={user.id} className="card mb-3 user-card">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.first_name} ${user.last_name}`}
                        className="user-avatar-lg"
                      />
                    ) : (
                      <div className="user-avatar-lg avatar-initials">
                        {getInitials(user.first_name, user.last_name)}
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{user.first_name} {user.last_name}</h6>
                      <small className="text-muted">{user.email}</small>
                    </div>
                  </div>
                  <div className="mt-3 d-flex gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm flex-fill"
                      onClick={() => handleViewUser(user)}
                    >
                      <i className="bi bi-eye me-1"></i>{t('common.view')}
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm flex-fill"
                      onClick={() => handleEditUser(user)}
                    >
                      <i className="bi bi-pencil me-1"></i>{t('common.edit')}
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <span className="text-muted">
              {t('user.list.showing', { start: startItem, end: endItem, total: totalItems })}
            </span>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
