// =============================================================================
// Navigation Module - Public API
// =============================================================================

export {
  // Types
  type RouteParams,
  type RouteDefinition,
  type NavItem,
  type RoutePath,
  type RouteComponentConfig,

  // Constants
  Routes,
  routeDefinitions,

  // Utilities
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
