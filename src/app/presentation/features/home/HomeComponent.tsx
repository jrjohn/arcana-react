import { useI18n } from '@core/providers/I18nProvider'
import { useAuth } from '@core/providers/AuthProvider'
import { Link } from 'react-router-dom'
import './HomeComponent.scss'

interface StatCard {
  id: string
  titleKey: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: string
  gradientClass: string
}

interface QuickAction {
  id: string
  label: string
  icon: string
  route: string
  bgClass: string
}

interface ActivityItem {
  id: string
  avatar: string
  user: string
  action: string
  target: string
  time: string
}

interface SystemStat {
  label: string
  value: number
  colorClass: string
}

const statCards: StatCard[] = [
  {
    id: 'users',
    titleKey: 'dashboard.stats.users',
    value: '2,847',
    change: '+12.5%',
    changeType: 'positive',
    icon: 'bi bi-people',
    gradientClass: 'bg-gradient-purple',
  },
  {
    id: 'projects',
    titleKey: 'dashboard.stats.projects',
    value: '184',
    change: '+8.2%',
    changeType: 'positive',
    icon: 'bi bi-folder',
    gradientClass: 'bg-gradient-green',
  },
  {
    id: 'tasks',
    titleKey: 'dashboard.stats.tasks',
    value: '64',
    change: '-3.1%',
    changeType: 'negative',
    icon: 'bi bi-list-check',
    gradientClass: 'bg-gradient-orange',
  },
  {
    id: 'messages',
    titleKey: 'dashboard.stats.messages',
    value: '23',
    change: '+18.7%',
    changeType: 'positive',
    icon: 'bi bi-chat-dots',
    gradientClass: 'bg-gradient-cyan',
  },
]

const quickActions: QuickAction[] = [
  { id: 'create-user', label: 'Create User', icon: 'bi bi-person-plus', route: '/users/new', bgClass: 'bg-primary' },
  { id: 'new-project', label: 'New Project', icon: 'bi bi-folder-plus', route: '/projects/new', bgClass: 'bg-success' },
  { id: 'view-docs', label: 'View Documents', icon: 'bi bi-file-earmark-text', route: '/documents', bgClass: 'bg-warning' },
  { id: 'analytics', label: 'Analytics', icon: 'bi bi-bar-chart', route: '/analytics', bgClass: 'bg-info' },
]

const recentActivities: ActivityItem[] = [
  { id: '1', avatar: 'https://i.pravatar.cc/150?img=1', user: 'John Doe', action: 'created a new project', target: 'Dashboard Redesign', time: '2 min ago' },
  { id: '2', avatar: 'https://i.pravatar.cc/150?img=2', user: 'Jane Smith', action: 'completed task', target: 'Update API endpoints', time: '15 min ago' },
  { id: '3', avatar: 'https://i.pravatar.cc/150?img=3', user: 'Mike Johnson', action: 'commented on', target: 'Bug fix #234', time: '1 hour ago' },
  { id: '4', avatar: 'https://i.pravatar.cc/150?img=4', user: 'Sarah Connor', action: 'uploaded file', target: 'requirements.pdf', time: '2 hours ago' },
]

const systemStats: SystemStat[] = [
  { label: 'CPU Usage', value: 64, colorClass: 'bg-primary' },
  { label: 'Memory', value: 72, colorClass: 'bg-success' },
  { label: 'Storage', value: 42, colorClass: 'bg-warning' },
  { label: 'Bandwidth', value: 89, colorClass: 'bg-danger' },
]

export function HomeComponent() {
  const { t } = useI18n()
  const { currentUser } = useAuth()

  const userName = currentUser ? `${currentUser.firstName}` : 'User'

  return (
    <div className="home-page container-fluid py-4">
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">{t('dashboard.title')}</h2>
          <p className="text-muted mb-0">{t('dashboard.welcome', { name: userName })}</p>
        </div>
        <div className="header-actions d-flex gap-2">
          <button className="btn btn-outline-primary">
            <i className="bi bi-download me-2"></i>
            {t('dashboard.export.report')}
          </button>
          <button className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>
            {t('dashboard.new.item')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {statCards.map(card => (
          <div key={card.id} className="col-xl-3 col-md-6">
            <div className="card stat-card h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`stat-icon ${card.gradientClass}`}>
                  <i className={card.icon}></i>
                </div>
                <div className="stat-content">
                  <div className="stat-label text-muted">{t(card.titleKey)}</div>
                  <div className="stat-value">{card.value}</div>
                  <div className={`stat-change ${card.changeType === 'positive' ? 'text-success' : 'text-danger'}`}>
                    <i className={`bi ${card.changeType === 'positive' ? 'bi-arrow-up' : 'bi-arrow-down'}`}></i>
                    {card.change}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card mb-4">
        <div className="card-header bg-white">
          <h5 className="card-title mb-0">{t('dashboard.quick.actions')}</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {quickActions.map(action => (
              <div key={action.id} className="col-6 col-md-3">
                <Link to={action.route} className="quick-action-item d-flex flex-column align-items-center p-3 rounded text-decoration-none">
                  <div className={`action-icon ${action.bgClass} text-white rounded-circle mb-2`}>
                    <i className={action.icon}></i>
                  </div>
                  <span className="action-label text-dark">{action.label}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Recent Activity */}
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">{t('dashboard.recent.activity')}</h5>
              <button className="btn btn-sm btn-outline-primary">{t('dashboard.view.all')}</button>
            </div>
            <div className="card-body p-0">
              <div className="activity-list">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="activity-item d-flex align-items-center gap-3 p-3 border-bottom">
                    <img src={activity.avatar} alt={activity.user} className="activity-avatar rounded-circle" />
                    <div className="activity-content flex-grow-1">
                      <div className="activity-text">
                        <strong>{activity.user}</strong> {activity.action} <span className="text-primary">{activity.target}</span>
                      </div>
                      <small className="text-muted">{activity.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">{t('dashboard.system.stats')}</h5>
            </div>
            <div className="card-body">
              {systemStats.map((stat, index) => (
                <div key={index} className="system-stat mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="stat-name">{stat.label}</span>
                    <span className="stat-percentage">{stat.value}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div
                      className={`progress-bar progress-bar-striped progress-bar-animated ${stat.colorClass}`}
                      role="progressbar"
                      style={{ width: `${stat.value}%` }}
                      aria-valuenow={stat.value}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card mt-4">
        <div className="card-header bg-white">
          <h5 className="card-title mb-0">{t('dashboard.quick.links')}</h5>
        </div>
        <div className="card-body p-0">
          <div className="list-group list-group-flush">
            <Link to="/users" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i className="bi bi-people me-2 text-primary"></i>{t('nav.users')}</span>
              <i className="bi bi-chevron-right text-muted"></i>
            </Link>
            <Link to="/settings" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i className="bi bi-gear me-2 text-primary"></i>{t('nav.settings')}</span>
              <i className="bi bi-chevron-right text-muted"></i>
            </Link>
            <Link to="/help" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i className="bi bi-question-circle me-2 text-primary"></i>{t('nav.help')}</span>
              <i className="bi bi-chevron-right text-muted"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
