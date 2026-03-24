import { describe, it, expect } from 'vitest'
import {
  Routes,
  routeDefinitions,
  buildPath,
  getRouteById,
  getRouteByPath,
  getChildRoutes,
  hasChildren,
  getTopLevelNavItems,
  buildNavigation,
  isRouteActive,
  isChildRouteActive,
} from './navGraph'

// =============================================================================
// Route Constants
// =============================================================================

describe('Routes', () => {
  it('should define all expected route constants', () => {
    expect(Routes.ROOT).toBe('/')
    expect(Routes.HOME).toBe('/home')
    expect(Routes.USERS).toBe('/users')
    expect(Routes.USER_NEW).toBe('/users/new')
    expect(Routes.USER_DETAIL).toBe('/users/:id')
    expect(Routes.USER_EDIT).toBe('/users/:id/edit')
    expect(Routes.PROJECTS).toBe('/projects')
    expect(Routes.TASKS).toBe('/tasks')
    expect(Routes.CALENDAR).toBe('/calendar')
    expect(Routes.MESSAGES).toBe('/messages')
    expect(Routes.DOCUMENTS).toBe('/documents')
    expect(Routes.ANALYTICS).toBe('/analytics')
    expect(Routes.SETTINGS).toBe('/settings')
    expect(Routes.PROFILE).toBe('/profile')
  })

  it('should define project sub-routes', () => {
    expect(Routes.PROJECT_NEW).toBe('/projects/new')
    expect(Routes.PROJECT_ARCHIVED).toBe('/projects/archived')
    expect(Routes.PROJECT_DETAIL).toBe('/projects/:id')
    expect(Routes.PROJECT_EDIT).toBe('/projects/:id/edit')
  })

  it('should define task sub-routes', () => {
    expect(Routes.TASKS_RECENT).toBe('/tasks/recent')
    expect(Routes.TASKS_IMPORTANT).toBe('/tasks/important')
    expect(Routes.TASK_DETAIL).toBe('/tasks/:id')
  })

  it('should define analytics sub-routes', () => {
    expect(Routes.ANALYTICS_REPORTS).toBe('/analytics/reports')
    expect(Routes.ANALYTICS_PERFORMANCE).toBe('/analytics/performance')
  })
})

// =============================================================================
// Route Definitions
// =============================================================================

describe('routeDefinitions', () => {
  it('should contain all route definitions', () => {
    expect(routeDefinitions.length).toBeGreaterThan(10)
  })

  it('should have unique IDs', () => {
    const ids = routeDefinitions.map((r) => r.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should have required fields for each route', () => {
    for (const route of routeDefinitions) {
      expect(route.id).toBeDefined()
      expect(route.id.length).toBeGreaterThan(0)
      expect(route.path).toBeDefined()
      expect(route.path.startsWith('/')).toBe(true)
      expect(route.labelKey).toBeDefined()
      expect(route.labelKey.length).toBeGreaterThan(0)
    }
  })

  it('should have valid parentId references', () => {
    const ids = new Set(routeDefinitions.map((r) => r.id))
    for (const route of routeDefinitions) {
      if (route.parentId) {
        expect(ids.has(route.parentId)).toBe(true)
      }
    }
  })

  it('should have order defined for nav items', () => {
    const navItems = routeDefinitions.filter((r) => r.showInNav && !r.parentId)
    for (const item of navItems) {
      expect(item.order).toBeDefined()
      expect(typeof item.order).toBe('number')
    }
  })
})

// =============================================================================
// buildPath
// =============================================================================

describe('buildPath', () => {
  it('should return path as-is when no params provided', () => {
    expect(buildPath('/users')).toBe('/users')
    expect(buildPath('/home')).toBe('/home')
  })

  it('should replace single parameter', () => {
    expect(buildPath('/users/:id', { id: '123' })).toBe('/users/123')
  })

  it('should replace multiple parameters', () => {
    expect(buildPath('/users/:id/posts/:postId', { id: '1', postId: '42' })).toBe(
      '/users/1/posts/42'
    )
  })

  it('should URL-encode parameter values', () => {
    expect(buildPath('/users/:id', { id: 'hello world' })).toBe(
      '/users/hello%20world'
    )
  })

  it('should handle empty params object', () => {
    expect(buildPath('/users', {})).toBe('/users')
  })

  it('should work with actual route constants', () => {
    expect(buildPath(Routes.USER_DETAIL, { id: '42' })).toBe('/users/42')
    expect(buildPath(Routes.USER_EDIT, { id: '42' })).toBe('/users/42/edit')
    expect(buildPath(Routes.PROJECT_DETAIL, { id: '99' })).toBe('/projects/99')
    expect(buildPath(Routes.TASK_DETAIL, { id: '7' })).toBe('/tasks/7')
    expect(buildPath(Routes.MESSAGE_DETAIL, { id: '15' })).toBe('/messages/15')
  })
})

// =============================================================================
// getRouteById
// =============================================================================

describe('getRouteById', () => {
  it('should find route by id', () => {
    const route = getRouteById('home')
    expect(route).toBeDefined()
    expect(route?.path).toBe('/home')
    expect(route?.labelKey).toBe('nav.home')
  })

  it('should find user routes', () => {
    expect(getRouteById('users')?.path).toBe('/users')
    expect(getRouteById('user-new')?.path).toBe('/users/new')
    expect(getRouteById('user-detail')?.path).toBe('/users/:id')
    expect(getRouteById('user-edit')?.path).toBe('/users/:id/edit')
  })

  it('should return undefined for non-existent id', () => {
    expect(getRouteById('does-not-exist')).toBeUndefined()
  })
})

// =============================================================================
// getRouteByPath
// =============================================================================

describe('getRouteByPath', () => {
  it('should find route by path', () => {
    const route = getRouteByPath('/home')
    expect(route).toBeDefined()
    expect(route?.id).toBe('home')
  })

  it('should return first matching route for shared paths', () => {
    // /projects is shared between 'projects' and 'projects-all'
    const route = getRouteByPath('/projects')
    expect(route).toBeDefined()
    expect(['projects', 'projects-all']).toContain(route?.id)
  })

  it('should return undefined for non-existent path', () => {
    expect(getRouteByPath('/does-not-exist')).toBeUndefined()
  })
})

// =============================================================================
// getChildRoutes
// =============================================================================

describe('getChildRoutes', () => {
  it('should return child routes for projects', () => {
    const children = getChildRoutes('projects')
    expect(children.length).toBeGreaterThan(0)
    expect(children.every((c) => c.parentId === 'projects')).toBe(true)
    expect(children.every((c) => c.showInNav)).toBe(true)
  })

  it('should return child routes sorted by order', () => {
    const children = getChildRoutes('projects')
    for (let i = 1; i < children.length; i++) {
      expect((children[i].order || 0) >= (children[i - 1].order || 0)).toBe(true)
    }
  })

  it('should return child routes for tasks', () => {
    const children = getChildRoutes('tasks')
    expect(children.length).toBe(3)
    expect(children.map((c) => c.id)).toEqual(
      expect.arrayContaining(['tasks-my', 'tasks-recent', 'tasks-important'])
    )
  })

  it('should return child routes for analytics', () => {
    const children = getChildRoutes('analytics')
    expect(children.length).toBe(3)
  })

  it('should return empty array for routes without children', () => {
    const children = getChildRoutes('home')
    expect(children).toEqual([])
  })

  it('should return empty array for non-existent parent', () => {
    expect(getChildRoutes('non-existent')).toEqual([])
  })

  it('should not return non-nav children', () => {
    // User child routes have showInNav: false
    const children = getChildRoutes('users')
    expect(children).toEqual([])
  })
})

// =============================================================================
// hasChildren
// =============================================================================

describe('hasChildren', () => {
  it('should return true for routes with visible children', () => {
    expect(hasChildren('projects')).toBe(true)
    expect(hasChildren('tasks')).toBe(true)
    expect(hasChildren('analytics')).toBe(true)
  })

  it('should return false for routes without children', () => {
    expect(hasChildren('home')).toBe(false)
    expect(hasChildren('calendar')).toBe(false)
    expect(hasChildren('settings')).toBe(false)
  })

  it('should return false for routes with only hidden children', () => {
    // users has child routes but they have showInNav: false
    expect(hasChildren('users')).toBe(false)
  })

  it('should return false for non-existent route', () => {
    expect(hasChildren('non-existent')).toBe(false)
  })
})

// =============================================================================
// getTopLevelNavItems
// =============================================================================

describe('getTopLevelNavItems', () => {
  it('should return only top-level nav items', () => {
    const items = getTopLevelNavItems()
    expect(items.every((item) => item.showInNav)).toBe(true)
    expect(items.every((item) => !item.parentId)).toBe(true)
  })

  it('should include expected top-level routes', () => {
    const items = getTopLevelNavItems()
    const ids = items.map((i) => i.id)
    expect(ids).toContain('home')
    expect(ids).toContain('users')
    expect(ids).toContain('projects')
    expect(ids).toContain('tasks')
    expect(ids).toContain('calendar')
    expect(ids).toContain('messages')
    expect(ids).toContain('documents')
    expect(ids).toContain('analytics')
    expect(ids).toContain('settings')
  })

  it('should not include hidden routes', () => {
    const items = getTopLevelNavItems()
    const ids = items.map((i) => i.id)
    expect(ids).not.toContain('profile')
  })

  it('should be sorted by order', () => {
    const items = getTopLevelNavItems()
    for (let i = 1; i < items.length; i++) {
      expect((items[i].order || 0) >= (items[i - 1].order || 0)).toBe(true)
    }
  })
})

// =============================================================================
// buildNavigation
// =============================================================================

describe('buildNavigation', () => {
  it('should build navigation tree', () => {
    const nav = buildNavigation()
    expect(nav.length).toBeGreaterThan(0)
  })

  it('should include children for routes with sub-items', () => {
    const nav = buildNavigation()
    const projects = nav.find((n) => n.id === 'projects')
    expect(projects).toBeDefined()
    expect(projects?.children).toBeDefined()
    expect(projects?.children!.length).toBeGreaterThan(0)
  })

  it('should set route on leaf items (no children)', () => {
    const nav = buildNavigation()
    const home = nav.find((n) => n.id === 'home')
    expect(home).toBeDefined()
    expect(home?.route).toBe('/home')
    expect(home?.children).toBeUndefined()
  })

  it('should not set route on parent items (with children)', () => {
    const nav = buildNavigation()
    const projects = nav.find((n) => n.id === 'projects')
    expect(projects?.route).toBeUndefined()
  })

  it('should include badges on applicable items', () => {
    const nav = buildNavigation()
    const messages = nav.find((n) => n.id === 'messages')
    expect(messages).toBeDefined()
    expect(messages?.badge).toBe('5')
    expect(messages?.badgeClass).toBe('bg-danger')
  })

  it('should set icon on all nav items', () => {
    const nav = buildNavigation()
    for (const item of nav) {
      expect(item.icon).toBeDefined()
      expect(item.icon.length).toBeGreaterThan(0)
    }
  })

  it('should include child route details', () => {
    const nav = buildNavigation()
    const tasks = nav.find((n) => n.id === 'tasks')
    expect(tasks?.children).toBeDefined()
    const myTasks = tasks?.children?.find((c) => c.id === 'tasks-my')
    expect(myTasks?.route).toBe('/tasks')
    expect(myTasks?.icon).toBeDefined()
  })

  it('should maintain sort order in children', () => {
    const nav = buildNavigation()
    const projects = nav.find((n) => n.id === 'projects')
    const children = projects?.children || []
    for (let i = 1; i < children.length; i++) {
      expect(children[i].order >= children[i - 1].order).toBe(true)
    }
  })
})

// =============================================================================
// isRouteActive
// =============================================================================

describe('isRouteActive', () => {
  it('should return true for exact match', () => {
    expect(isRouteActive('/users', '/users')).toBe(true)
    expect(isRouteActive('/home', '/home')).toBe(true)
    expect(isRouteActive('/', '/')).toBe(true)
  })

  it('should return true for nested path match', () => {
    expect(isRouteActive('/users/123', '/users')).toBe(true)
    expect(isRouteActive('/users/123/edit', '/users')).toBe(true)
    expect(isRouteActive('/analytics/reports', '/analytics')).toBe(true)
  })

  it('should return false for non-matching paths', () => {
    expect(isRouteActive('/users', '/projects')).toBe(false)
    expect(isRouteActive('/home', '/users')).toBe(false)
  })

  it('should not match partial path segments', () => {
    // /users-archived should NOT match /users
    expect(isRouteActive('/users-archived', '/users')).toBe(false)
  })

  it('should not match root for all paths', () => {
    // Root '/' should only match exact '/'
    expect(isRouteActive('/users', '/')).toBe(false)
    expect(isRouteActive('/home', '/')).toBe(false)
  })

  it('should match with trailing slash boundary', () => {
    expect(isRouteActive('/users/', '/users')).toBe(true)
  })
})

// =============================================================================
// isChildRouteActive
// =============================================================================

describe('isChildRouteActive', () => {
  it('should return true when a child route is active', () => {
    // projects has children: /projects, /projects/new, /projects/archived
    expect(isChildRouteActive('/projects', 'projects')).toBe(true)
    expect(isChildRouteActive('/projects/new', 'projects')).toBe(true)
    expect(isChildRouteActive('/projects/archived', 'projects')).toBe(true)
  })

  it('should return false when no child route matches', () => {
    expect(isChildRouteActive('/users', 'projects')).toBe(false)
    expect(isChildRouteActive('/home', 'projects')).toBe(false)
  })

  it('should return false for route without children', () => {
    expect(isChildRouteActive('/home', 'home')).toBe(false)
  })

  it('should work with task sub-routes', () => {
    expect(isChildRouteActive('/tasks', 'tasks')).toBe(true)
    expect(isChildRouteActive('/tasks/recent', 'tasks')).toBe(true)
    expect(isChildRouteActive('/tasks/important', 'tasks')).toBe(true)
  })

  it('should work with analytics sub-routes', () => {
    expect(isChildRouteActive('/analytics', 'analytics')).toBe(true)
    expect(isChildRouteActive('/analytics/reports', 'analytics')).toBe(true)
    expect(isChildRouteActive('/analytics/performance', 'analytics')).toBe(true)
  })
})
