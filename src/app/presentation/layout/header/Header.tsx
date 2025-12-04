import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@core/providers/AuthProvider'
import { useI18n, type Language, type LanguageConfig } from '@core/providers/I18nProvider'
import './Header.scss'

interface HeaderProps {
  onToggleSidebar: () => void
  onToggleRightPanel: () => void
  rightPanelOpen: boolean
}

interface UserMenuItem {
  action: string
  label: string
  icon: string
  divider?: boolean
}

export function Header({ onToggleSidebar, onToggleRightPanel }: HeaderProps) {
  const { currentUser, logout } = useAuth()
  const { currentLanguage, currentLanguageConfig, languages, setLanguage, t } = useI18n()

  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const languageDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  const userMenuActions: UserMenuItem[] = [
    { action: 'profile', label: t('nav.my.profile'), icon: 'bi bi-person' },
    { action: 'notifications', label: t('nav.notifications'), icon: 'bi bi-bell' },
    { action: 'settings', label: t('nav.settings'), icon: 'bi bi-gear' },
    { action: 'help', label: t('nav.help'), icon: 'bi bi-question-circle' },
    { action: 'logout', label: t('nav.logout'), icon: 'bi bi-box-arrow-right', divider: true },
  ]

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setLanguageDropdownOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageChange = (lang: LanguageConfig) => {
    setLanguage(lang.code as Language)
    setLanguageDropdownOpen(false)
  }

  const handleUserMenuAction = (action: string) => {
    setUserDropdownOpen(false)
    switch (action) {
      case 'logout':
        logout()
        break
      // Other actions can be implemented later
    }
  }

  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User'

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Left Section: Menu Toggle & Brand */}
        <div className="header-left">
          <button
            type="button"
            className="btn btn-link sidebar-toggle"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list"></i>
          </button>
          <Link to="/" className="brand">
            <i className="bi bi-hexagon-fill text-primary me-2"></i>
            <span className="brand-text">Arcana</span>
          </Link>
        </div>

        {/* Center Section: Search */}
        <div className="header-center d-none d-md-flex">
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="form-control"
              placeholder={t('header.search.placeholder')}
            />
            <button type="button" className="search-button" aria-label="Search">
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="header-right">
          {/* Language Selector */}
          <div className="dropdown" ref={languageDropdownRef}>
            <button
              type="button"
              className="btn btn-link header-action language-selector"
              onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
              aria-label="Select language"
            >
              <span className="language-flag">{currentLanguageConfig.flag}</span>
              <span className="language-name d-none d-sm-inline ms-1">{currentLanguageConfig.name}</span>
            </button>
            <div className={`dropdown-menu language-dropdown ${languageDropdownOpen ? 'show' : ''}`}>
              <h6 className="dropdown-header">Select Language</h6>
              {languages.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  className={`dropdown-item ${lang.code === currentLanguage ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang)}
                >
                  <span className="me-2">{lang.flag}</span>
                  {lang.name}
                  {lang.code === currentLanguage && (
                    <i className="bi bi-check float-end text-primary"></i>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="btn btn-link header-action position-relative"
            aria-label="Notifications"
          >
            <i className="bi bi-bell"></i>
            <span className="badge badge-notification">3</span>
          </button>

          {/* Right Panel Toggle */}
          <button
            type="button"
            className="btn btn-link header-action"
            onClick={onToggleRightPanel}
            aria-label="Toggle right panel"
          >
            <i className="bi bi-layout-sidebar-inset-reverse"></i>
          </button>

          {/* User Menu */}
          <div className="dropdown" ref={userDropdownRef}>
            <button
              type="button"
              className="btn btn-link header-action user-menu-toggle"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={userName}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar avatar-initials">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="d-none d-md-inline ms-2">{userName}</span>
              <i className="bi bi-chevron-down ms-1 d-none d-md-inline"></i>
            </button>
            <div className={`dropdown-menu user-dropdown ${userDropdownOpen ? 'show' : ''}`}>
              {/* User Info */}
              <div className="user-info">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={userName}
                    className="user-avatar-large"
                  />
                ) : (
                  <div className="user-avatar-large avatar-initials">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="user-details">
                  <div className="user-name">{userName}</div>
                  <div className="user-email">{currentUser?.email}</div>
                  <span className="badge bg-primary user-role">{currentUser?.role}</span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              {/* Menu Actions */}
              {userMenuActions.map((item) => (
                <div key={item.action}>
                  {item.divider && <div className="dropdown-divider"></div>}
                  <button
                    type="button"
                    className={`dropdown-item ${item.action === 'logout' ? 'text-danger' : ''}`}
                    onClick={() => handleUserMenuAction(item.action)}
                  >
                    <i className={`${item.icon} me-2`}></i>
                    {item.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
