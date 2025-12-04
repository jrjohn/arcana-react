import { useState, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@core/providers/AuthProvider'
import { useI18n } from '@core/providers/I18nProvider'
import './Sidebar.scss'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

interface MenuItem {
  id: string
  labelKey: string
  icon: string
  route?: string
  badge?: string
  badgeClass?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    labelKey: 'nav.home',
    icon: 'bi bi-house-door',
    route: '/home',
  },
  {
    id: 'users',
    labelKey: 'nav.users',
    icon: 'bi bi-people',
    route: '/users',
  },
  {
    id: 'projects',
    labelKey: 'nav.projects',
    icon: 'bi bi-folder',
    children: [
      { id: 'projects-all', labelKey: 'nav.projects.all', icon: 'bi bi-folder2', route: '/projects' },
      { id: 'projects-create', labelKey: 'nav.projects.create', icon: 'bi bi-folder-plus', route: '/projects/new' },
      { id: 'projects-archived', labelKey: 'nav.projects.archived', icon: 'bi bi-archive', route: '/projects/archived' },
    ],
  },
  {
    id: 'tasks',
    labelKey: 'nav.tasks',
    icon: 'bi bi-list-check',
    children: [
      { id: 'tasks-my', labelKey: 'nav.tasks.my', icon: 'bi bi-person-check', route: '/tasks' },
      { id: 'tasks-recent', labelKey: 'nav.tasks.recent', icon: 'bi bi-clock-history', route: '/tasks/recent' },
      { id: 'tasks-important', labelKey: 'nav.tasks.important', icon: 'bi bi-star', route: '/tasks/important' },
    ],
  },
  {
    id: 'calendar',
    labelKey: 'nav.calendar',
    icon: 'bi bi-calendar',
    route: '/calendar',
  },
  {
    id: 'messages',
    labelKey: 'nav.messages',
    icon: 'bi bi-chat-dots',
    route: '/messages',
    badge: '5',
    badgeClass: 'bg-danger',
  },
  {
    id: 'documents',
    labelKey: 'nav.documents',
    icon: 'bi bi-file-earmark-text',
    route: '/documents',
  },
  {
    id: 'analytics',
    labelKey: 'nav.analytics',
    icon: 'bi bi-bar-chart',
    children: [
      { id: 'analytics-overview', labelKey: 'nav.analytics.overview', icon: 'bi bi-graph-up', route: '/analytics' },
      { id: 'analytics-reports', labelKey: 'nav.analytics.reports', icon: 'bi bi-file-bar-graph', route: '/analytics/reports' },
      { id: 'analytics-performance', labelKey: 'nav.analytics.performance', icon: 'bi bi-speedometer2', route: '/analytics/performance' },
    ],
  },
  {
    id: 'settings',
    labelKey: 'nav.settings',
    icon: 'bi bi-gear',
    route: '/settings',
  },
]

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { currentUser } = useAuth()
  const { t } = useI18n()
  const location = useLocation()

  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    // Auto-expand menu that contains the current route
    const initialExpanded = new Set<string>()
    menuItems.forEach(item => {
      if (item.children?.some(child => location.pathname.startsWith(child.route || ''))) {
        initialExpanded.add(item.id)
      }
    })
    return initialExpanded
  })

  const toggleMenuItem = useCallback((item: MenuItem) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev)
      if (newSet.has(item.id)) {
        newSet.delete(item.id)
      } else {
        newSet.add(item.id)
      }
      return newSet
    })
  }, [])

  const isMenuExpanded = (item: MenuItem) => expandedMenus.has(item.id)

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
            <span
              className={`status-indicator ${getStatusClass(currentUser?.status || 'offline')}`}
              title={currentUser?.status}
            ></span>
          </div>
          {!collapsed && (
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-email">{currentUser?.email}</div>
              <div><span className="badge bg-primary user-role-badge">{currentUser?.role}</span></div>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="user-profile-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary w-100"
              title={t('nav.profile')}
            >
              <i className="bi bi-person me-1"></i>
              {t('nav.profile')}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && (
            <div className="nav-section-title">{t('nav.main.menu')}</div>
          )}
          {menuItems.map(item => (
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
                        <i className={`bi bi-chevron-down nav-arrow ${isMenuExpanded(item) ? 'rotated' : ''}`}></i>
                      </>
                    )}
                  </button>
                  {!collapsed && (
                    <div className={`nav-submenu ${isMenuExpanded(item) ? 'show' : ''}`}>
                      {item.children.map(child => (
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
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Single menu item */
                <NavLink
                  to={item.route || '#'}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
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
