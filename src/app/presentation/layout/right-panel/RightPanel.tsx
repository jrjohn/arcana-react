import { useState } from 'react'
import { useTheme } from '@core/providers/ThemeProvider'
import { useI18n } from '@core/providers/I18nProvider'
import { APP_CONSTANTS } from '@core/constants/app.constants'
import './RightPanel.scss'

interface RightPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface Activity {
  id: string
  type: 'info' | 'success' | 'warning' | 'danger'
  icon: string
  title: string
  description: string
  time: string
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  avatar?: string
  icon?: string
  read: boolean
}

const initialActivities: Activity[] = [
  {
    id: '1',
    type: 'success',
    icon: 'bi bi-check-circle',
    title: 'Project Updated',
    description: 'Dashboard redesign completed successfully',
    time: '2 min ago',
  },
  {
    id: '2',
    type: 'info',
    icon: 'bi bi-person-plus',
    title: 'New User',
    description: 'John Doe joined the team',
    time: '1 hour ago',
  },
  {
    id: '3',
    type: 'warning',
    icon: 'bi bi-exclamation-triangle',
    title: 'Storage Warning',
    description: 'Storage usage above 80%',
    time: '3 hours ago',
  },
]

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Sarah Connor',
    message: 'Approved your pull request',
    time: '5 min ago',
    avatar: 'https://i.pravatar.cc/150?img=1',
    read: false,
  },
  {
    id: '2',
    title: 'System Update',
    message: 'New version available for download',
    time: '1 hour ago',
    icon: 'bi bi-gear',
    read: false,
  },
  {
    id: '3',
    title: 'Mike Johnson',
    message: 'Mentioned you in a comment',
    time: '2 hours ago',
    avatar: 'https://i.pravatar.cc/150?img=3',
    read: true,
  },
]

export function RightPanel({ isOpen, onClose }: RightPanelProps) {
  const { t } = useI18n()
  const { isDarkMode, toggleTheme } = useTheme()

  const [activeTab, setActiveTab] = useState(1)
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    twoFactor: false,
    privacyMode: false,
  })

  const getUnreadCount = () => notifications.filter(n => !n.read).length

  const clearActivities = () => setActivities([])

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markAsRead = (notification: Notification) => {
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    )
  }

  const getActivityTypeClass = (type: Activity['type']) => {
    switch (type) {
      case 'success': return 'activity-success'
      case 'warning': return 'activity-warning'
      case 'danger': return 'activity-danger'
      default: return 'activity-info'
    }
  }

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }))
  }

  return (
    <aside className={`right-panel ${isOpen ? 'open' : ''}`}>
      {/* Panel Header */}
      <div className="panel-header">
        <h5 className="panel-title">{t('panel.activity.center')}</h5>
        <button
          type="button"
          className="btn btn-link close-btn"
          onClick={onClose}
          aria-label="Close panel"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* Tabs Navigation */}
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            <i className="bi bi-activity me-2"></i>
            {t('panel.activity.tab')}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 2 ? 'active' : ''}`}
            onClick={() => setActiveTab(2)}
          >
            <i className="bi bi-bell me-2"></i>
            {t('panel.notifications.tab')}
            {getUnreadCount() > 0 && (
              <span className="badge bg-danger ms-1">{getUnreadCount()}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 3 ? 'active' : ''}`}
            onClick={() => setActiveTab(3)}
          >
            <i className="bi bi-sliders me-2"></i>
            {t('panel.settings')}
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="panel-body">
        {/* Activity Tab */}
        {activeTab === 1 && (
          <div className="tab-content-wrapper">
            <div className="content-header">
              <h6>{t('panel.recent.activity')}</h6>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={clearActivities}
              >
                {t('panel.clear.all')}
              </button>
            </div>

            <div className="activity-list">
              {activities.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-inbox display-4 text-muted"></i>
                  <p className="text-muted mt-2">{t('panel.no.activity')}</p>
                </div>
              ) : (
                activities.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className={`activity-icon ${getActivityTypeClass(activity.type)}`}>
                      <i className={activity.icon}></i>
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-description">{activity.description}</div>
                      <div className="activity-time">{activity.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 2 && (
          <div className="tab-content-wrapper">
            <div className="content-header">
              <h6>{t('panel.notifications.tab')}</h6>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={markAllAsRead}
              >
                {t('panel.mark.all.read')}
              </button>
            </div>

            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-bell-slash display-4 text-muted"></i>
                  <p className="text-muted mt-2">{t('panel.no.notifications')}</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => markAsRead(notification)}
                  >
                    <div className="notification-avatar">
                      {notification.avatar ? (
                        <img src={notification.avatar} alt={notification.title} />
                      ) : (
                        <i className={notification.icon}></i>
                      )}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{notification.time}</div>
                    </div>
                    {!notification.read && <div className="unread-indicator"></div>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 3 && (
          <div className="tab-content-wrapper">
            <div className="content-header">
              <h6>Quick Settings</h6>
            </div>

            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <i className="bi bi-bell text-primary"></i>
                  <div className="setting-details">
                    <div className="setting-label">{t('panel.push.notifications')}</div>
                    <div className="setting-description">Receive push notifications</div>
                  </div>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={() => handleSettingChange('pushNotifications')}
                  />
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <i className="bi bi-envelope text-success"></i>
                  <div className="setting-details">
                    <div className="setting-label">{t('panel.email.notifications')}</div>
                    <div className="setting-description">Receive email updates</div>
                  </div>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => handleSettingChange('emailNotifications')}
                  />
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <i className="bi bi-moon-stars text-warning"></i>
                  <div className="setting-details">
                    <div className="setting-label">{t('panel.dark.mode')}</div>
                    <div className="setting-description">Enable dark theme</div>
                  </div>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={toggleTheme}
                  />
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <i className="bi bi-shield-check text-danger"></i>
                  <div className="setting-details">
                    <div className="setting-label">{t('panel.two.factor')}</div>
                    <div className="setting-description">Extra security layer</div>
                  </div>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.twoFactor}
                    onChange={() => handleSettingChange('twoFactor')}
                  />
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <i className="bi bi-eye-slash text-info"></i>
                  <div className="setting-details">
                    <div className="setting-label">{t('panel.privacy.mode')}</div>
                    <div className="setting-description">Hide online status</div>
                  </div>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.privacyMode}
                    onChange={() => handleSettingChange('privacyMode')}
                  />
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="system-info mt-4">
              <div className="info-card">
                <div className="info-item">
                  <span className="info-label">{t('panel.version')}</span>
                  <span className="info-value">v{APP_CONSTANTS.APP_VERSION}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('panel.build')}</span>
                  <span className="info-value">{APP_CONSTANTS.APP_BUILD}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('panel.environment')}</span>
                  <span className="badge bg-success">{APP_CONSTANTS.APP_ENVIRONMENT}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
