// =============================================================================
// LRU Cache Service Tests
// =============================================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { LRUCacheService } from './lruCacheService'

describe('LRUCacheService', () => {
  let cacheService: LRUCacheService

  beforeEach(() => {
    cacheService = new LRUCacheService(100, 300000) // 100 items, 5 min TTL
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('set and get', () => {
    it('stores and retrieves values', () => {
      cacheService.set('key1', { name: 'test' })

      const result = cacheService.get<{ name: string }>('key1')

      expect(result).toEqual({ name: 'test' })
    })

    it('returns null for non-existent keys', () => {
      const result = cacheService.get('nonexistent')

      expect(result).toBeNull()
    })

    it('stores different types', () => {
      cacheService.set('string', 'hello')
      cacheService.set('number', 42)
      cacheService.set('boolean', true)

      expect(cacheService.get('string')).toBe('hello')
      expect(cacheService.get('number')).toBe(42)
      expect(cacheService.get('boolean')).toBe(true)
    })
  })

  describe('LRU eviction', () => {
    it('evicts least recently used items when at capacity', () => {
      const smallCache = new LRUCacheService(3, 300000)

      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')

      // Access key1 to make it most recently used
      smallCache.get('key1')

      // Add fourth item - should evict key2 (least recently used)
      smallCache.set('key4', 'value4')

      expect(smallCache.size).toBe(3)
      expect(smallCache.get('key1')).toBe('value1') // still exists
      expect(smallCache.get('key2')).toBeNull() // evicted
      expect(smallCache.get('key3')).not.toBeNull()
      expect(smallCache.get('key4')).toBe('value4')
    })

    it('updates access order on get', () => {
      const smallCache = new LRUCacheService(3, 300000)

      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')

      // Access key1 to make it recently used
      smallCache.get('key1')

      // All should still be accessible
      expect(smallCache.get('key1')).toBe('value1')
      expect(smallCache.get('key2')).toBe('value2')
      expect(smallCache.get('key3')).toBe('value3')
    })

    it('moves accessed items to front', () => {
      const smallCache = new LRUCacheService(3, 300000)

      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')

      // key1 is LRU, access it to move to front
      smallCache.get('key1')

      // Add new item - key2 should be evicted (now LRU)
      smallCache.set('key4', 'value4')

      expect(smallCache.get('key1')).toBe('value1')
      expect(smallCache.get('key2')).toBeNull() // evicted
    })
  })

  describe('TTL (Time To Live)', () => {
    it('expires items after TTL', () => {
      cacheService.set('key', 'value', 1000) // 1 second TTL

      expect(cacheService.get('key')).toBe('value')

      vi.advanceTimersByTime(1001)

      expect(cacheService.get('key')).toBeNull()
    })

    it('uses default TTL when not specified', () => {
      cacheService.set('key', 'value')

      expect(cacheService.get('key')).toBe('value')

      // Default TTL is 5 minutes (300000ms)
      vi.advanceTimersByTime(300001)

      expect(cacheService.get('key')).toBeNull()
    })
  })

  describe('delete', () => {
    it('removes a specific key', () => {
      cacheService.set('key1', 'value1')
      cacheService.set('key2', 'value2')

      cacheService.delete('key1')

      expect(cacheService.get('key1')).toBeNull()
      expect(cacheService.get('key2')).toBe('value2')
    })

    it('returns false for non-existent key', () => {
      expect(cacheService.delete('nonexistent')).toBe(false)
    })

    it('returns true when key is deleted', () => {
      cacheService.set('key', 'value')
      expect(cacheService.delete('key')).toBe(true)
    })
  })

  describe('clear', () => {
    it('removes all entries', () => {
      cacheService.set('key1', 'value1')
      cacheService.set('key2', 'value2')

      cacheService.clear()

      expect(cacheService.get('key1')).toBeNull()
      expect(cacheService.get('key2')).toBeNull()
      expect(cacheService.size).toBe(0)
    })

    it('resets statistics', () => {
      cacheService.set('key', 'value')
      cacheService.get('key')
      cacheService.get('nonexistent')

      cacheService.clear()

      const stats = cacheService.stats
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.evictions).toBe(0)
    })
  })

  describe('clearByPrefix', () => {
    it('removes entries matching prefix', () => {
      cacheService.set('user:1', { id: 1 })
      cacheService.set('user:2', { id: 2 })
      cacheService.set('product:1', { id: 1 })

      cacheService.clearByPrefix('user:')

      expect(cacheService.get('user:1')).toBeNull()
      expect(cacheService.get('user:2')).toBeNull()
      expect(cacheService.get('product:1')).toEqual({ id: 1 })
    })
  })

  describe('has', () => {
    it('returns true for existing key', () => {
      cacheService.set('key', 'value')

      expect(cacheService.has('key')).toBe(true)
    })

    it('returns false for non-existent key', () => {
      expect(cacheService.has('nonexistent')).toBe(false)
    })

    it('returns false for expired key', () => {
      cacheService.set('key', 'value', 1000)

      vi.advanceTimersByTime(1001)

      expect(cacheService.has('key')).toBe(false)
    })
  })

  describe('stats', () => {
    it('returns cache statistics', () => {
      cacheService.set('key1', 'value1')
      cacheService.set('key2', 'value2')

      const stats = cacheService.stats

      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(100)
      expect(typeof stats.hits).toBe('number')
      expect(typeof stats.misses).toBe('number')
      expect(typeof stats.evictions).toBe('number')
    })

    it('tracks evictions', () => {
      const smallCache = new LRUCacheService(2, 300000)

      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3') // triggers eviction

      expect(smallCache.stats.evictions).toBe(1)
    })
  })

  describe('getTTL', () => {
    it('returns remaining TTL in milliseconds', () => {
      cacheService.set('key', 'value', 10000) // 10 seconds

      vi.advanceTimersByTime(3000) // 3 seconds pass

      const remaining = cacheService.getTTL('key')

      expect(remaining).toBeLessThanOrEqual(7000)
      expect(remaining).toBeGreaterThan(6000)
    })

    it('returns null for non-existent key', () => {
      expect(cacheService.getTTL('nonexistent')).toBeNull()
    })

    it('returns null for expired key', () => {
      cacheService.set('key', 'value', 1000)

      vi.advanceTimersByTime(1001)

      expect(cacheService.getTTL('key')).toBeNull()
    })
  })

  describe('touch', () => {
    it('refreshes TTL for existing key', () => {
      cacheService.set('key', 'value', 5000)

      vi.advanceTimersByTime(4000) // 4 seconds pass

      cacheService.touch('key', 10000) // refresh with 10 second TTL

      vi.advanceTimersByTime(5000) // 5 more seconds

      // Should still exist (10 second TTL from touch)
      expect(cacheService.get('key')).toBe('value')
    })

    it('returns false for non-existent key', () => {
      expect(cacheService.touch('nonexistent')).toBe(false)
    })

    it('returns true for existing key', () => {
      cacheService.set('key', 'value')
      expect(cacheService.touch('key')).toBe(true)
    })
  })

  describe('keys', () => {
    it('returns all keys', () => {
      cacheService.set('key1', 'value1')
      cacheService.set('key2', 'value2')

      const keys = cacheService.keys()

      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
    })
  })

  describe('update existing key', () => {
    it('updates value and moves to front', () => {
      const smallCache = new LRUCacheService(3, 300000)

      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')

      // Update key1 - should move to front
      smallCache.set('key1', 'updated')

      // Add new item - key2 should be evicted
      smallCache.set('key4', 'value4')

      expect(smallCache.get('key1')).toBe('updated')
      expect(smallCache.get('key2')).toBeNull() // evicted
    })
  })
})
