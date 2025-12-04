// =============================================================================
// Navigation Graph - Core Navigation Configuration
// =============================================================================
// Centralized navigation configuration following Clean Architecture.
// Defines all routes, navigation structure, and route utilities.
// =============================================================================

import type { ComponentType, LazyExoticComponent } from 'react'

// =============================================================================
// Route Types
// =============================================================================

export interface RouteParams {
  [key: string]: string
}

export interface RouteDefinition {
  /** Unique route identifier */
  id: string
  /** Route path pattern (e.g., '/users/:id') */
  path: string
  /** i18n key for route label */
  labelKey: string
  /** Bootstrap icon class */
  icon?: string
  /** Whether route requires authentication */
  requiresAuth?: boolean
  /** Required roles for access */
  roles?: string[]
  /** Parent route ID for nested routes */
  parentId?: string
  /** Whether this is an index route */
  isIndex?: boolean
  /** Badge text */
  badge?: string
  /** Badge CSS class */
  badgeClass?: string
  /** Whether route should appear in navigation */
  showInNav?: boolean
  /** Sort order in navigation */
  order?: number
}

export interface NavItem {
  id: string
  labelKey: string
  icon: string
  route?: string
  badge?: string
  badgeClass?: string
  children?: NavItem[]
  order: number
}

// =============================================================================
// Route Constants
// =============================================================================

export const Routes = {
  // Root
  ROOT: '/',

  // Home
  HOME: '/home',

  // Users
  USERS: '/users',
  USER_NEW: '/users/new',
  USER_DETAIL: '/users/:id',
  USER_EDIT: '/users/:id/edit',

  // Projects
  PROJECTS: '/projects',
  PROJECT_NEW: '/projects/new',
  PROJECT_ARCHIVED: '/projects/archived',
  PROJECT_DETAIL: '/projects/:id',
  PROJECT_EDIT: '/projects/:id/edit',

  // Tasks
  TASKS: '/tasks',
  TASKS_RECENT: '/tasks/recent',
  TASKS_IMPORTANT: '/tasks/important',
  TASK_DETAIL: '/tasks/:id',

  // Calendar
  CALENDAR: '/calendar',

  // Messages
  MESSAGES: '/messages',
  MESSAGE_DETAIL: '/messages/:id',

  // Documents
  DOCUMENTS: '/documents',
  DOCUMENT_DETAIL: '/documents/:id',

  // Analytics
  ANALYTICS: '/analytics',
  ANALYTICS_REPORTS: '/analytics/reports',
  ANALYTICS_PERFORMANCE: '/analytics/performance',

  // Settings
  SETTINGS: '/settings',

  // Profile
  PROFILE: '/profile',
} as const

export type RoutePath = (typeof Routes)[keyof typeof Routes]

// =============================================================================
// Route Definitions
// =============================================================================

export const routeDefinitions: RouteDefinition[] = [
  // Home
  {
    id: 'home',
    path: Routes.HOME,
    labelKey: 'nav.home',
    icon: 'bi bi-house-door',
    showInNav: true,
    order: 1,
  },

  // Users
  {
    id: 'users',
    path: Routes.USERS,
    labelKey: 'nav.users',
    icon: 'bi bi-people',
    showInNav: true,
    order: 2,
  },
  {
    id: 'user-new',
    path: Routes.USER_NEW,
    labelKey: 'user.form.create.title',
    parentId: 'users',
    showInNav: false,
  },
  {
    id: 'user-detail',
    path: Routes.USER_DETAIL,
    labelKey: 'user.detail.title',
    parentId: 'users',
    showInNav: false,
  },
  {
    id: 'user-edit',
    path: Routes.USER_EDIT,
    labelKey: 'user.form.edit.title',
    parentId: 'users',
    showInNav: false,
  },

  // Projects (with children)
  {
    id: 'projects',
    path: Routes.PROJECTS,
    labelKey: 'nav.projects',
    icon: 'bi bi-folder',
    showInNav: true,
    order: 3,
  },
  {
    id: 'projects-all',
    path: Routes.PROJECTS,
    labelKey: 'nav.projects.all',
    icon: 'bi bi-folder2',
    parentId: 'projects',
    showInNav: true,
    order: 1,
  },
  {
    id: 'projects-new',
    path: Routes.PROJECT_NEW,
    labelKey: 'nav.projects.create',
    icon: 'bi bi-folder-plus',
    parentId: 'projects',
    showInNav: true,
    order: 2,
  },
  {
    id: 'projects-archived',
    path: Routes.PROJECT_ARCHIVED,
    labelKey: 'nav.projects.archived',
    icon: 'bi bi-archive',
    parentId: 'projects',
    showInNav: true,
    order: 3,
  },

  // Tasks (with children)
  {
    id: 'tasks',
    path: Routes.TASKS,
    labelKey: 'nav.tasks',
    icon: 'bi bi-list-check',
    showInNav: true,
    order: 4,
  },
  {
    id: 'tasks-my',
    path: Routes.TASKS,
    labelKey: 'nav.tasks.my',
    icon: 'bi bi-person-check',
    parentId: 'tasks',
    showInNav: true,
    order: 1,
  },
  {
    id: 'tasks-recent',
    path: Routes.TASKS_RECENT,
    labelKey: 'nav.tasks.recent',
    icon: 'bi bi-clock-history',
    parentId: 'tasks',
    showInNav: true,
    order: 2,
  },
  {
    id: 'tasks-important',
    path: Routes.TASKS_IMPORTANT,
    labelKey: 'nav.tasks.important',
    icon: 'bi bi-star',
    parentId: 'tasks',
    showInNav: true,
    order: 3,
  },

  // Calendar
  {
    id: 'calendar',
    path: Routes.CALENDAR,
    labelKey: 'nav.calendar',
    icon: 'bi bi-calendar',
    showInNav: true,
    order: 5,
  },

  // Messages
  {
    id: 'messages',
    path: Routes.MESSAGES,
    labelKey: 'nav.messages',
    icon: 'bi bi-chat-dots',
    badge: '5',
    badgeClass: 'bg-danger',
    showInNav: true,
    order: 6,
  },

  // Documents
  {
    id: 'documents',
    path: Routes.DOCUMENTS,
    labelKey: 'nav.documents',
    icon: 'bi bi-file-earmark-text',
    showInNav: true,
    order: 7,
  },

  // Analytics (with children)
  {
    id: 'analytics',
    path: Routes.ANALYTICS,
    labelKey: 'nav.analytics',
    icon: 'bi bi-bar-chart',
    showInNav: true,
    order: 8,
  },
  {
    id: 'analytics-overview',
    path: Routes.ANALYTICS,
    labelKey: 'nav.analytics.overview',
    icon: 'bi bi-graph-up',
    parentId: 'analytics',
    showInNav: true,
    order: 1,
  },
  {
    id: 'analytics-reports',
    path: Routes.ANALYTICS_REPORTS,
    labelKey: 'nav.analytics.reports',
    icon: 'bi bi-file-bar-graph',
    parentId: 'analytics',
    showInNav: true,
    order: 2,
  },
  {
    id: 'analytics-performance',
    path: Routes.ANALYTICS_PERFORMANCE,
    labelKey: 'nav.analytics.performance',
    icon: 'bi bi-speedometer2',
    parentId: 'analytics',
    showInNav: true,
    order: 3,
  },

  // Settings
  {
    id: 'settings',
    path: Routes.SETTINGS,
    labelKey: 'nav.settings',
    icon: 'bi bi-gear',
    showInNav: true,
    order: 9,
  },

  // Profile (not in main nav)
  {
    id: 'profile',
    path: Routes.PROFILE,
    labelKey: 'nav.profile',
    icon: 'bi bi-person',
    showInNav: false,
  },
]

// =============================================================================
// Route Utilities
// =============================================================================

/**
 * Build a route path with parameters
 * @example buildPath(Routes.USER_DETAIL, { id: '123' }) => '/users/123'
 */
export function buildPath(path: string, params?: RouteParams): string {
  if (!params) return path

  let result = path
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, encodeURIComponent(value))
  })
  return result
}

/**
 * Get route definition by ID
 */
export function getRouteById(id: string): RouteDefinition | undefined {
  return routeDefinitions.find((route) => route.id === id)
}

/**
 * Get route definition by path
 */
export function getRouteByPath(path: string): RouteDefinition | undefined {
  return routeDefinitions.find((route) => route.path === path)
}

/**
 * Get child routes for a parent route
 */
export function getChildRoutes(parentId: string): RouteDefinition[] {
  return routeDefinitions
    .filter((route) => route.parentId === parentId && route.showInNav)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

/**
 * Check if a route has children
 */
export function hasChildren(routeId: string): boolean {
  return routeDefinitions.some((route) => route.parentId === routeId && route.showInNav)
}

/**
 * Get top-level navigation items
 */
export function getTopLevelNavItems(): RouteDefinition[] {
  return routeDefinitions
    .filter((route) => route.showInNav && !route.parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

/**
 * Build navigation structure from route definitions
 */
export function buildNavigation(): NavItem[] {
  const topLevel = getTopLevelNavItems()

  return topLevel.map((route) => {
    const children = getChildRoutes(route.id)

    const navItem: NavItem = {
      id: route.id,
      labelKey: route.labelKey,
      icon: route.icon || 'bi bi-circle',
      order: route.order || 0,
    }

    if (children.length > 0) {
      navItem.children = children.map((child) => ({
        id: child.id,
        labelKey: child.labelKey,
        icon: child.icon || 'bi bi-circle',
        route: child.path,
        badge: child.badge,
        badgeClass: child.badgeClass,
        order: child.order || 0,
      }))
    } else {
      navItem.route = route.path
      navItem.badge = route.badge
      navItem.badgeClass = route.badgeClass
    }

    return navItem
  })
}

/**
 * Check if current path matches a route
 */
export function isRouteActive(currentPath: string, routePath: string): boolean {
  // Exact match
  if (currentPath === routePath) return true

  // Check if current path starts with route path (for nested routes)
  // But not for root paths
  if (routePath !== '/' && currentPath.startsWith(routePath)) {
    const nextChar = currentPath.charAt(routePath.length)
    return nextChar === '' || nextChar === '/'
  }

  return false
}

/**
 * Check if any child route is active
 */
export function isChildRouteActive(currentPath: string, parentId: string): boolean {
  const children = getChildRoutes(parentId)
  return children.some((child) => isRouteActive(currentPath, child.path))
}

// =============================================================================
// Route Component Mapping Type
// =============================================================================

export interface RouteComponentConfig {
  id: string
  path: string
  component: LazyExoticComponent<ComponentType<unknown>> | ComponentType<unknown>
  children?: RouteComponentConfig[]
  index?: boolean
}
