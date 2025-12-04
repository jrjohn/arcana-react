// =============================================================================
// User List Component
// =============================================================================
// Presentation layer component that uses UserListViewModel for all business logic.
// This component only handles UI rendering - no direct API calls.
// Follows UDF pattern: dispatch Input actions, render from Output state.
// =============================================================================

import { Link } from 'react-router-dom'
import { useI18n } from '@core/providers/I18nProvider'
import { useUserListViewModel } from '../viewmodels/userListViewModel'
import type { User } from '@/app/domain/entities/user.model'
import './UserListComponent.scss'

export function UserListComponent() {
  const { t } = useI18n()

  // Use ViewModel - UDF Input/Output pattern
  const { output, dispatch } = useUserListViewModel()

  // ==========================================================================
  // Event Handlers - dispatch Input actions
  // ==========================================================================

  const handleRefresh = () => {
    dispatch({ type: 'REFRESH_USERS' })
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_QUERY', query: e.target.value })
  }

  const handleClearSearch = () => {
    dispatch({ type: 'CLEAR_SEARCH' })
  }

  const handlePageChange = (page: number) => {
    dispatch({ type: 'CHANGE_PAGE', page })
  }

  const handleViewUser = (user: User) => {
    dispatch({ type: 'NAVIGATE_TO_DETAIL', id: user.id })
  }

  const handleEditUser = (user: User) => {
    dispatch({ type: 'NAVIGATE_TO_EDIT', id: user.id })
  }

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(t('user.delete.message', { name: `${user.firstName} ${user.lastName}` }))) {
      dispatch({ type: 'DELETE_USER', user })
    }
  }

  const handleDismissError = () => {
    dispatch({ type: 'DISMISS_ERROR' })
  }

  const handleDismissSuccess = () => {
    dispatch({ type: 'DISMISS_SUCCESS' })
  }

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // ==========================================================================
  // Render - driven by Output state
  // ==========================================================================

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
      {output.successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          {output.successMessage}
          <button type="button" className="btn-close" onClick={handleDismissSuccess}></button>
        </div>
      )}

      {output.error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {output.error}
          <button type="button" className="btn-close" onClick={handleDismissError}></button>
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
                  value={output.searchQuery}
                  onChange={handleSearch}
                />
                {output.searchQuery && (
                  <button
                    type="button"
                    className="btn btn-link clear-search"
                    onClick={handleClearSearch}
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
                disabled={output.isRefreshing}
              >
                <i className={`bi bi-arrow-clockwise ${output.isRefreshing ? 'spin' : ''}`}></i>
                <span className="ms-2">{t('common.refresh')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {output.isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
          </div>
          <p className="mt-3 text-muted">{t('common.loading')}</p>
        </div>
      )}

      {/* Empty State */}
      {!output.isLoading && output.filteredUsers.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-people display-1 text-muted opacity-50"></i>
            <h4 className="mt-3 text-muted">{t('user.list.no.results')}</h4>
            <p className="text-muted">
              {output.searchQuery ? t('user.list.empty.search') : t('user.list.empty.message')}
            </p>
            {!output.searchQuery && (
              <Link to="/users/new" className="btn btn-primary mt-3">
                <i className="bi bi-plus-lg me-2"></i>
                {t('user.list.create')}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* User Table - Desktop */}
      {!output.isLoading && output.filteredUsers.length > 0 && (
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
                  {output.filteredUsers.map(user => (
                    <tr
                      key={user.id}
                      className="user-row"
                      onClick={() => handleViewUser(user)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>#{user.id}</td>
                      <td>
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="user-avatar"
                          />
                        ) : (
                          <div className="user-avatar avatar-initials">
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{user.firstName} {user.lastName}</strong>
                      </td>
                      <td>{user.email}</td>
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
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
            {output.filteredUsers.map(user => (
              <div
                key={user.id}
                className="card mb-3 user-card"
                onClick={() => handleViewUser(user)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="user-avatar-lg"
                      />
                    ) : (
                      <div className="user-avatar-lg avatar-initials">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{user.firstName} {user.lastName}</h6>
                      <small className="text-muted">{user.email}</small>
                    </div>
                  </div>
                  <div className="mt-3 d-flex gap-2" onClick={(e) => e.stopPropagation()}>
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
              {t('user.list.showing', { start: output.startItem, end: output.endItem, total: output.totalItems })}
            </span>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${output.currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(output.currentPage - 1)}
                    disabled={output.currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {Array.from({ length: output.totalPages }, (_, i) => i + 1).map(page => (
                  <li key={page} className={`page-item ${page === output.currentPage ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${output.currentPage === output.totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(output.currentPage + 1)}
                    disabled={output.currentPage === output.totalPages}
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
