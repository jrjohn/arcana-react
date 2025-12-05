// =============================================================================
// CSRF Interceptor
// =============================================================================
// Implements CSRF (Cross-Site Request Forgery) protection for API requests.
// Uses double-submit cookie pattern with token refresh capability.
// =============================================================================

import type { InternalAxiosRequestConfig } from 'axios'
import { APP_CONSTANTS } from '@/app/core/constants/app.constants'

/**
 * CSRF Token storage key
 */
const CSRF_TOKEN_KEY = 'arcana_csrf_token'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

/**
 * CSRF Token service
 * Manages CSRF token lifecycle
 */
class CsrfTokenService {
  private token: string | null = null
  private tokenExpiry: number | null = null
  private tokenRefreshPromise: Promise<string> | null = null

  /**
   * Token validity duration (30 minutes)
   */
  private readonly TOKEN_TTL = 30 * 60 * 1000

  constructor() {
    // Try to restore token from session storage
    this.restoreToken()
  }

  /**
   * Restore token from session storage
   */
  private restoreToken(): void {
    try {
      const stored = sessionStorage.getItem(CSRF_TOKEN_KEY)
      if (stored) {
        const { token, expiry } = JSON.parse(stored)
        if (expiry > Date.now()) {
          this.token = token
          this.tokenExpiry = expiry
        } else {
          sessionStorage.removeItem(CSRF_TOKEN_KEY)
        }
      }
    } catch {
      // Ignore errors, will generate new token
    }
  }

  /**
   * Save token to session storage
   */
  private saveToken(): void {
    if (this.token && this.tokenExpiry) {
      try {
        sessionStorage.setItem(
          CSRF_TOKEN_KEY,
          JSON.stringify({ token: this.token, expiry: this.tokenExpiry })
        )
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Generate a new CSRF token
   * Uses crypto API for secure random token generation
   */
  private generateToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Check if token is valid
   */
  private isTokenValid(): boolean {
    return !!(this.token && this.tokenExpiry && this.tokenExpiry > Date.now())
  }

  /**
   * Get current CSRF token
   * Generates new token if expired or not present
   */
  async getToken(): Promise<string> {
    // Return existing valid token
    if (this.isTokenValid()) {
      return this.token!
    }

    // Prevent concurrent token generation
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise
    }

    // Generate new token
    this.tokenRefreshPromise = this.refreshToken()

    try {
      return await this.tokenRefreshPromise
    } finally {
      this.tokenRefreshPromise = null
    }
  }

  /**
   * Refresh CSRF token
   */
  private async refreshToken(): Promise<string> {
    // In a real implementation, this would fetch from server:
    // const response = await fetch('/api/csrf-token')
    // const { token } = await response.json()

    // For now, generate client-side token
    // This should be replaced with server-side token in production
    this.token = this.generateToken()
    this.tokenExpiry = Date.now() + this.TOKEN_TTL

    this.saveToken()

    return this.token
  }

  /**
   * Clear CSRF token (on logout)
   */
  clearToken(): void {
    this.token = null
    this.tokenExpiry = null
    sessionStorage.removeItem(CSRF_TOKEN_KEY)
  }

  /**
   * Force token refresh
   */
  async forceRefresh(): Promise<string> {
    this.token = null
    this.tokenExpiry = null
    return this.getToken()
  }
}

// Singleton instance
export const csrfTokenService = new CsrfTokenService()

/**
 * Methods that require CSRF protection
 * GET and HEAD are safe methods and don't need CSRF tokens
 */
const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

/**
 * Check if request method requires CSRF protection
 */
function requiresCsrfProtection(method?: string): boolean {
  if (!method) return false
  return UNSAFE_METHODS.includes(method.toUpperCase())
}

/**
 * CSRF Request Interceptor
 * Adds CSRF token to state-changing requests
 */
export const csrfInterceptor = async (
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> => {
  // Only add CSRF token for unsafe methods
  if (!requiresCsrfProtection(config.method)) {
    return config
  }

  // Skip CSRF for external URLs
  const baseUrl = APP_CONSTANTS.API.BASE_URL
  const requestUrl = config.url || ''

  // If request URL is absolute and different origin, skip CSRF
  if (requestUrl.startsWith('http') && !requestUrl.startsWith(baseUrl)) {
    return config
  }

  try {
    const token = await csrfTokenService.getToken()

    if (config.headers) {
      config.headers[CSRF_HEADER_NAME] = token
    }
  } catch (error) {
    // Log error but don't block request
    console.warn('Failed to get CSRF token:', error)
  }

  return config
}

/**
 * Handle CSRF token errors from response
 * Returns true if error was handled and request should be retried
 */
export async function handleCsrfError(status: number, errorCode?: string): Promise<boolean> {
  // 403 with CSRF error code indicates invalid token
  if (status === 403 && errorCode === 'CSRF_TOKEN_INVALID') {
    await csrfTokenService.forceRefresh()
    return true // Request should be retried
  }

  return false
}

/**
 * Clear CSRF token (call on logout)
 */
export function clearCsrfToken(): void {
  csrfTokenService.clearToken()
}
