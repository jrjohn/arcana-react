// =============================================================================
// Arcana React - Application Constants
// =============================================================================

export const APP_CONSTANTS = {
  // Application Info
  APP_NAME: 'Arcana',
  APP_VERSION: '1.0.0',
  APP_BUILD: '2025.12.04',
  APP_ENVIRONMENT: import.meta.env.MODE,

  // API Configuration
  API: {
    BASE_URL: 'https://reqres.in/api',
    TIMEOUT: 30000,
  },

  // Cache Configuration
  CACHE: {
    DEFAULT_TTL: 300000, // 5 minutes
    LIST_TTL: 60000, // 1 minute for lists
    LONG_TTL: 3600000, // 1 hour for persistent
    LRU_MAX_ITEMS: 100,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 25, 50],
  },

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'arcana_auth_token',
    USER: 'arcana_current_user',
    LANGUAGE: 'arcana_language',
    THEME: 'arcana_theme',
    SIDEBAR_COLLAPSED: 'arcana_sidebar_collapsed',
    RIGHT_PANEL_OPEN: 'arcana_right_panel_open',
  },

  // IndexedDB Configuration
  INDEXED_DB: {
    NAME: 'ArcanaDB',
    VERSION: 1,
    STORES: {
      USERS: 'users',
      PENDING_OPERATIONS: 'pendingOperations',
      CACHE_ENTRIES: 'cacheEntries',
    },
  },

  // Validation
  VALIDATION: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    NAME_PATTERN: /^[a-zA-Z\s\-']+$/,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL_PATTERN: /^https?:\/\/.+/,
  },

  // Retry Configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000,
    MAX_DELAY: 10000,
  },

  // Animation Durations (ms)
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },

  // Debounce/Throttle
  DEBOUNCE: {
    SEARCH: 300,
    RESIZE: 150,
    SCROLL: 100,
  },
} as const

// Type exports for constants
export type StorageKeys = typeof APP_CONSTANTS.STORAGE_KEYS
export type IndexedDBConfig = typeof APP_CONSTANTS.INDEXED_DB

// Environment helper
export const isDevelopment = import.meta.env.DEV
export const isProduction = import.meta.env.PROD
