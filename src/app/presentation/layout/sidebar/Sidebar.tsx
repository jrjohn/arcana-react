// =============================================================================
// Sidebar Component
// =============================================================================
// Uses NavGraph for navigation structure. All routes are defined in
// @core/navigation/navGraph.ts for centralized management.
// =============================================================================

import { useState, useCallback, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@core/providers/AuthProvider'
import { useI18n } from '@core/providers/I18nProvider'
import {
  buildNavigation,
  isChildRouteActive,
  type NavItem,
  Routes,
} from '@core/navigation'
import './Sidebar.scss'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { currentUser } = useAuth()
  const { t } = useI18n()
  const location = useLocation()

  // Build navigation from NavGraph
  const menuItems = useMemo(() => buildNavigation(), [])

  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    // Auto-expand menu that contains the current route
    const initialExpanded = new Set<string>()
    menuItems.forEach((item) => {
      if (item.children && isChildRouteActive(location.pathname, item.id)) {
        initialExpanded.add(item.id)
      }
    })
    return initialExpanded
  })

  const toggleMenuItem = useCallback((item: NavItem) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(item.id)) {
        newSet.delete(item.id)
      } else {
        newSet.add(item.id)
      }
      return newSet
    })
  }, [])

  const isMenuExpanded = (item: NavItem) => expandedMenus.has(item.id)

  const getStatusClass = (status: string) => `status-${status}`

  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User'

  const handleNavClick = () => {
    // Close mobile sidebar when navigating
    if (window.innerWidth <= 768) {
      onCloseMobile()
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'show' : ''}`}>
      {/* User Profile Block */}
      <div className="user-profile-block">
        <div className="user-profile-content">
          <div className="user-avatar-wrapper">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={userName} className="user-avatar" />
            ) : (
              <div className="user-avatar avatar-initials">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className={`status-indicator ${getStatusClass(currentUser?.status || 'offline')}`}
              title={currentUser?.status}
            ></span>
          </div>
          {!collapsed && (
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-email">{currentUser?.email}</div>
              <div>
                <span className="badge bg-primary user-role-badge">{currentUser?.role}</span>
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="user-profile-actions">
            <NavLink
              to={Routes.PROFILE}
              className="btn btn-sm btn-outline-primary w-100"
              title={t('nav.profile')}
              onClick={handleNavClick}
            >
              <i className="bi bi-person me-1"></i>
              {t('nav.profile')}
            </NavLink>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">{t('nav.main.menu')}</div>}
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.children ? (
                /* Parent menu item with children */
                <div className="nav-item-wrapper">
                  <button
                    type="button"
                    className={`nav-link nav-link-parent ${isMenuExpanded(item) ? 'active' : ''}`}
                    onClick={() => toggleMenuItem(item)}
                    title={collapsed ? t(item.labelKey) : ''}
                  >
                    <i className={`${item.icon} nav-icon`}></i>
                    {!collapsed && (
                      <>
                        <span className="nav-label">{t(item.labelKey)}</span>
                        <i
                          className={`bi bi-chevron-down nav-arrow ${isMenuExpanded(item) ? 'rotated' : ''}`}
                        ></i>
                      </>
                    )}
                  </button>
                  {!collapsed && (
                    <div className={`nav-submenu ${isMenuExpanded(item) ? 'show' : ''}`}>
                      {item.children.map((child) => (
                        <NavLink
                          key={child.id}
                          to={child.route || '#'}
                          className={({ isActive }) =>
                            `nav-link nav-link-child ${isActive ? 'active' : ''}`
                          }
                          onClick={handleNavClick}
                        >
                          <i className={`${child.icon} nav-icon`}></i>
                          <span className="nav-label">{t(child.labelKey)}</span>
                          {child.badge && (
                            <span className={`badge ms-auto ${child.badgeClass}`}>
                              {child.badge}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Single menu item */
                <NavLink
                  to={item.route || '#'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title={collapsed ? t(item.labelKey) : ''}
                  onClick={handleNavClick}
                >
                  <i className={`${item.icon} nav-icon`}></i>
                  {!collapsed ? (
                    <>
                      <span className="nav-label">{t(item.labelKey)}</span>
                      {item.badge && (
                        <span className={`badge ms-auto ${item.badgeClass}`}>{item.badge}</span>
                      )}
                    </>
                  ) : (
                    item.badge && <span className={`badge-dot ${item.badgeClass}`}></span>
                  )}
                </NavLink>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="footer-stats">
            <div className="stat-item">
              <i className="bi bi-hdd text-primary"></i>
              <div className="stat-info">
                <div className="stat-label">{t('sidebar.storage')}</div>
                <div className="stat-value">4.2 GB / 10 GB</div>
              </div>
            </div>
            <div className="progress" style={{ height: '4px' }}>
              <div
                className="progress-bar bg-primary"
                role="progressbar"
                style={{ width: '42%' }}
                aria-valuenow={42}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
