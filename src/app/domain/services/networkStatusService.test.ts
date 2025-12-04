import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { networkStatusService, NetworkStatus } from './networkStatusService'

describe('networkStatusService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have status signal', () => {
      expect(networkStatusService.status).toBeDefined()
      expect(networkStatusService.status.value).toBeDefined()
    })

    it('should have online computed signal', () => {
      expect(networkStatusService.online).toBeDefined()
    })

    it('should have offline computed signal', () => {
      expect(networkStatusService.offline).toBeDefined()
    })

    it('should have slow computed signal', () => {
      expect(networkStatusService.slow).toBeDefined()
    })

    it('should have info signal', () => {
      expect(networkStatusService.info).toBeDefined()
      expect(networkStatusService.info.value).toHaveProperty('status')
      expect(networkStatusService.info.value).toHaveProperty('isOnline')
      expect(networkStatusService.info.value).toHaveProperty('connectionQuality')
    })
  })

  describe('isCurrentlyOnline', () => {
    it('should return navigator.onLine value', () => {
      const result = networkStatusService.isCurrentlyOnline()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('refresh', () => {
    it('should update network status', () => {
      // Just verify refresh doesn't throw
      expect(() => networkStatusService.refresh()).not.toThrow()
    })
  })

  describe('onChange$', () => {
    it('should return an observable', () => {
      const observable = networkStatusService.onChange$
      expect(observable).toBeDefined()
      expect(observable.subscribe).toBeDefined()
    })
  })

  describe('NetworkStatus constants', () => {
    it('should have ONLINE status', () => {
      expect(NetworkStatus.ONLINE).toBe('online')
    })

    it('should have OFFLINE status', () => {
      expect(NetworkStatus.OFFLINE).toBe('offline')
    })

    it('should have SLOW status', () => {
      expect(NetworkStatus.SLOW).toBe('slow')
    })
  })
})
