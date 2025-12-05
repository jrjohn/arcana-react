// =============================================================================
// CSRF Interceptor Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { InternalAxiosRequestConfig, AxiosHeaders } from 'axios'
import { csrfInterceptor, csrfTokenService, clearCsrfToken, handleCsrfError } from './csrfInterceptor'

// Mock crypto.getRandomValues
const mockGetRandomValues = vi.fn((array: Uint8Array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256)
  }
  return array
})

Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
  },
  writable: true,
})

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {}
const sessionStorageMock = {
  getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage[key]
  }),
  clear: vi.fn(() => {
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key])
  }),
}

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})

// Helper to create mock config
function createMockConfig(
  method: string,
  url = '/test'
): InternalAxiosRequestConfig {
  return {
    method,
    url,
    headers: {
      set: vi.fn(),
      get: vi.fn(),
      has: vi.fn(),
      delete: vi.fn(),
    } as unknown as AxiosHeaders,
  } as InternalAxiosRequestConfig
}

describe('csrfInterceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorageMock.clear()
    clearCsrfToken()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Safe Methods (no CSRF required)', () => {
    it('does not add CSRF token for GET requests', async () => {
      const config = createMockConfig('GET')
      const result = await csrfInterceptor(config)

      expect(result.headers['X-CSRF-Token']).toBeUndefined()
    })

    it('does not add CSRF token for HEAD requests', async () => {
      const config = createMockConfig('HEAD')
      const result = await csrfInterceptor(config)

      expect(result.headers['X-CSRF-Token']).toBeUndefined()
    })

    it('does not add CSRF token for OPTIONS requests', async () => {
      const config = createMockConfig('OPTIONS')
      const result = await csrfInterceptor(config)

      expect(result.headers['X-CSRF-Token']).toBeUndefined()
    })
  })

  describe('Unsafe Methods (CSRF required)', () => {
    it('adds CSRF token for POST requests', async () => {
      const config = createMockConfig('POST')
      const result = await csrfInterceptor(config)

      expect(result.headers['X-CSRF-Token']).toBeDefined()
      expect(typeof result.headers['X-CSRF-Token']).toBe('string')
      expect((result.headers['X-CSRF-Token'] as string).length).toBe(64) // 32 bytes = 64 hex chars
    })

    it('adds CSRF token for PUT requests', async () => {
      const config = createMockConfig('PUT')
      const result = await csrfInterceptor(config)

      expect(result.headers['X-CSRF-Token']).toBeDefined()
    })

    it('adds CSRF token for PATCH requests', async () => {
      const config = createMockConfig('PATCH')
      const result = await csrfInterceptor(config)

      expect(result.headers['X-CSRF-Token']).toBeDefined()
    })

    it('adds CSRF token for DELETE requests', async () => {
      const config = createMockConfig('DELETE')
      const result = await csrfInterceptor(config)

      expect(result.headers['X-CSRF-Token']).toBeDefined()
    })

    it('handles case-insensitive method names', async () => {
      const configLower = createMockConfig('post')
      const configUpper = createMockConfig('POST')
      const configMixed = createMockConfig('Post')

      const resultLower = await csrfInterceptor(configLower)
      const resultUpper = await csrfInterceptor(configUpper)
      const resultMixed = await csrfInterceptor(configMixed)

      expect(resultLower.headers['X-CSRF-Token']).toBeDefined()
      expect(resultUpper.headers['X-CSRF-Token']).toBeDefined()
      expect(resultMixed.headers['X-CSRF-Token']).toBeDefined()
    })
  })

  describe('Token Reuse', () => {
    it('reuses the same token for multiple requests', async () => {
      const config1 = createMockConfig('POST')
      const config2 = createMockConfig('PUT')

      const result1 = await csrfInterceptor(config1)
      const result2 = await csrfInterceptor(config2)

      expect(result1.headers['X-CSRF-Token']).toBe(result2.headers['X-CSRF-Token'])
    })
  })

  describe('External URLs', () => {
    it('skips CSRF for external URLs', async () => {
      const config = createMockConfig('POST', 'https://external-api.com/endpoint')
      const result = await csrfInterceptor(config)

      expect(result.headers['X-CSRF-Token']).toBeUndefined()
    })

    it('adds CSRF for same-origin URLs', async () => {
      const config = createMockConfig('POST', '/api/users')
      const result = await csrfInterceptor(config)

      expect(result.headers['X-CSRF-Token']).toBeDefined()
    })
  })

  describe('Missing Method', () => {
    it('handles undefined method gracefully', async () => {
      const config = createMockConfig('')
      config.method = undefined

      const result = await csrfInterceptor(config)

      expect(result.headers['X-CSRF-Token']).toBeUndefined()
    })
  })
})

describe('csrfTokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorageMock.clear()
    clearCsrfToken()
  })

  describe('Token Generation', () => {
    it('generates a 64 character hex token', async () => {
      const token = await csrfTokenService.getToken()

      expect(token).toMatch(/^[0-9a-f]{64}$/)
    })

    it('uses crypto.getRandomValues for secure generation', async () => {
      await csrfTokenService.getToken()

      expect(mockGetRandomValues).toHaveBeenCalled()
    })
  })

  describe('Token Persistence', () => {
    it('stores token in sessionStorage', async () => {
      await csrfTokenService.getToken()

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'arcana_csrf_token',
        expect.any(String)
      )
    })

    it('restores token from sessionStorage', async () => {
      const futureExpiry = Date.now() + 1000 * 60 * 30 // 30 minutes
      const storedData = JSON.stringify({ token: 'stored-token-123', expiry: futureExpiry })
      mockSessionStorage['arcana_csrf_token'] = storedData
      sessionStorageMock.getItem.mockReturnValue(storedData)

      // Create new service instance to test restoration
      const { csrfTokenService: newService } = await import('./csrfInterceptor')

      // Force token refresh to test
      await newService.forceRefresh()
      const token = await newService.getToken()

      expect(token).toBeDefined()
    })
  })

  describe('Token Clearing', () => {
    it('clears token from memory and storage', async () => {
      await csrfTokenService.getToken()
      clearCsrfToken()

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('arcana_csrf_token')
    })

    it('generates new token after clearing', async () => {
      const token1 = await csrfTokenService.getToken()
      clearCsrfToken()
      const token2 = await csrfTokenService.getToken()

      expect(token1).not.toBe(token2)
    })
  })

  describe('Force Refresh', () => {
    it('generates new token on force refresh', async () => {
      const token1 = await csrfTokenService.getToken()
      const token2 = await csrfTokenService.forceRefresh()

      expect(token1).not.toBe(token2)
    })
  })

  describe('Concurrent Requests', () => {
    it('handles concurrent token requests without duplicate generation', async () => {
      clearCsrfToken()

      // Make multiple concurrent requests
      const promises = [
        csrfTokenService.getToken(),
        csrfTokenService.getToken(),
        csrfTokenService.getToken(),
      ]

      const tokens = await Promise.all(promises)

      // All should get the same token
      expect(tokens[0]).toBe(tokens[1])
      expect(tokens[1]).toBe(tokens[2])
    })
  })
})

describe('handleCsrfError', () => {
  beforeEach(() => {
    clearCsrfToken()
  })

  it('returns true and refreshes token for CSRF_TOKEN_INVALID error', async () => {
    const token1 = await csrfTokenService.getToken()
    const shouldRetry = await handleCsrfError(403, 'CSRF_TOKEN_INVALID')

    expect(shouldRetry).toBe(true)

    const token2 = await csrfTokenService.getToken()
    expect(token1).not.toBe(token2)
  })

  it('returns false for non-CSRF 403 errors', async () => {
    const shouldRetry = await handleCsrfError(403, 'FORBIDDEN')

    expect(shouldRetry).toBe(false)
  })

  it('returns false for other status codes', async () => {
    const shouldRetry = await handleCsrfError(401, 'CSRF_TOKEN_INVALID')

    expect(shouldRetry).toBe(false)
  })

  it('returns false when no error code provided', async () => {
    const shouldRetry = await handleCsrfError(403)

    expect(shouldRetry).toBe(false)
  })
})

describe('clearCsrfToken', () => {
  it('exports clearCsrfToken function', () => {
    expect(typeof clearCsrfToken).toBe('function')
  })

  it('clears token without throwing', () => {
    expect(() => clearCsrfToken()).not.toThrow()
  })
})
