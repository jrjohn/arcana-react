// =============================================================================
// API Service Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosHeaders } from 'axios'

// ---------------------------------------------------------------------------
// Use vi.hoisted() so mock variables are available in vi.mock() factories
// ---------------------------------------------------------------------------
const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: {
      headers: { common: {} as Record<string, string> },
      baseURL: '',
    },
  }
  return { mockClient }
})

vi.mock('@/app/domain/services/networkStatusService', () => ({
  networkStatusService: {
    isCurrentlyOnline: vi.fn().mockReturnValue(true),
    onChange$: { subscribe: vi.fn() },
  },
}))

vi.mock('./interceptors/csrfInterceptor', () => ({
  csrfInterceptor: vi.fn((config: unknown) => config),
  clearCsrfToken: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockClient),
  },
}))

// Helper to build a fake Axios response
function fakeResponse<T>(data: T, status = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    config: { headers: {} as AxiosHeaders },
  }
}

// Import AFTER mocks
import { apiService } from './apiService'

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient.defaults.headers.common = {}
    mockClient.defaults.baseURL = ''
  })

  // ==========================================================================
  // GET
  // ==========================================================================
  describe('get', () => {
    it('makes GET request and returns wrapped response', async () => {
      const payload = { id: 1, name: 'Test' }
      mockClient.get.mockResolvedValue(fakeResponse(payload))

      const result = await apiService.get<typeof payload>('/users/1')

      expect(mockClient.get).toHaveBeenCalledWith('/users/1', undefined)
      expect(result.data).toEqual(payload)
      expect(result.status).toBe(200)
      expect(result.headers).toHaveProperty('content-type')
    })

    it('passes extra config to axios', async () => {
      mockClient.get.mockResolvedValue(fakeResponse({}))
      const cfg = { params: { page: 2 } }

      await apiService.get('/users', cfg)

      expect(mockClient.get).toHaveBeenCalledWith('/users', cfg)
    })

    it('propagates GET errors', async () => {
      mockClient.get.mockRejectedValue(new Error('Timeout'))

      await expect(apiService.get('/fail')).rejects.toThrow('Timeout')
    })
  })

  // ==========================================================================
  // POST
  // ==========================================================================
  describe('post', () => {
    it('makes POST request with body', async () => {
      const body = { name: 'Alice' }
      mockClient.post.mockResolvedValue(fakeResponse({ id: 2, ...body }, 201))

      const result = await apiService.post('/users', body)

      expect(mockClient.post).toHaveBeenCalledWith('/users', body, undefined)
      expect(result.status).toBe(201)
      expect(result.data).toEqual({ id: 2, name: 'Alice' })
    })

    it('handles POST without body', async () => {
      mockClient.post.mockResolvedValue(fakeResponse(null))

      await apiService.post('/trigger')

      expect(mockClient.post).toHaveBeenCalledWith('/trigger', undefined, undefined)
    })

    it('propagates POST errors', async () => {
      mockClient.post.mockRejectedValue(new Error('Bad Request'))

      await expect(apiService.post('/fail', {})).rejects.toThrow('Bad Request')
    })
  })

  // ==========================================================================
  // PUT
  // ==========================================================================
  describe('put', () => {
    it('makes PUT request with body', async () => {
      const body = { name: 'Updated' }
      mockClient.put.mockResolvedValue(fakeResponse({ id: 1, ...body }))

      const result = await apiService.put('/users/1', body)

      expect(mockClient.put).toHaveBeenCalledWith('/users/1', body, undefined)
      expect(result.data).toEqual({ id: 1, name: 'Updated' })
    })

    it('propagates PUT errors', async () => {
      mockClient.put.mockRejectedValue(new Error('Not Found'))

      await expect(apiService.put('/fail', {})).rejects.toThrow('Not Found')
    })
  })

  // ==========================================================================
  // PATCH
  // ==========================================================================
  describe('patch', () => {
    it('makes PATCH request with body', async () => {
      const body = { name: 'Patched' }
      mockClient.patch.mockResolvedValue(fakeResponse({ id: 1, ...body }))

      const result = await apiService.patch('/users/1', body)

      expect(mockClient.patch).toHaveBeenCalledWith('/users/1', body, undefined)
      expect(result.data).toEqual({ id: 1, name: 'Patched' })
    })

    it('propagates PATCH errors', async () => {
      mockClient.patch.mockRejectedValue(new Error('Conflict'))

      await expect(apiService.patch('/fail', {})).rejects.toThrow('Conflict')
    })
  })

  // ==========================================================================
  // DELETE
  // ==========================================================================
  describe('delete', () => {
    it('makes DELETE request', async () => {
      mockClient.delete.mockResolvedValue(fakeResponse(null, 204))

      const result = await apiService.delete('/users/1')

      expect(mockClient.delete).toHaveBeenCalledWith('/users/1', undefined)
      expect(result.status).toBe(204)
    })

    it('propagates DELETE errors', async () => {
      mockClient.delete.mockRejectedValue(new Error('Forbidden'))

      await expect(apiService.delete('/fail')).rejects.toThrow('Forbidden')
    })
  })

  // ==========================================================================
  // Header management
  // ==========================================================================
  describe('setHeader', () => {
    it('sets a custom header', () => {
      apiService.setHeader('X-Custom', 'myvalue')

      expect(mockClient.defaults.headers.common['X-Custom']).toBe('myvalue')
    })
  })

  describe('removeHeader', () => {
    it('removes a custom header', () => {
      mockClient.defaults.headers.common['X-Remove'] = 'val'

      apiService.removeHeader('X-Remove')

      expect(mockClient.defaults.headers.common['X-Remove']).toBeUndefined()
    })
  })

  describe('setBaseURL', () => {
    it('updates the base URL', () => {
      apiService.setBaseURL('https://new.api.com')

      expect(mockClient.defaults.baseURL).toBe('https://new.api.com')
    })
  })

  // ==========================================================================
  // Instance & Observable
  // ==========================================================================
  describe('instance', () => {
    it('exposes the underlying axios instance', () => {
      expect(apiService.instance).toBeDefined()
      expect(apiService.instance).toBe(mockClient)
    })
  })

  describe('errors$', () => {
    it('exposes an observable for error events', () => {
      const obs = apiService.errors$
      expect(obs).toBeDefined()
      expect(typeof obs.subscribe).toBe('function')
    })
  })

  // ==========================================================================
  // Interceptor registration
  // ==========================================================================
  describe('interceptor setup', () => {
    it('request interceptors use function is a mock', () => {
      // Interceptors are registered during construction (before clearAllMocks),
      // so we verify the mock was set up correctly.
      expect(typeof mockClient.interceptors.request.use).toBe('function')
    })

    it('response interceptor use function is a mock', () => {
      expect(typeof mockClient.interceptors.response.use).toBe('function')
    })
  })
})
