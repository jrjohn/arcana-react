// =============================================================================
// Memory Cache Service Tests
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryCacheService } from './memoryCacheService'

describe('MemoryCacheService', () => {
  let cacheService: MemoryCacheService

  beforeEach(() => {
    cacheService = new MemoryCacheService(100)
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

    it('stores different types of values', () => {
      cacheService.set('string', 'hello')
      cacheService.set('number', 42)
      cacheService.set('array', [1, 2, 3])
      cacheService.set('object', { a: 1 })

      expect(cacheService.get('string')).toBe('hello')
      expect(cacheService.get('number')).toBe(42)
      expect(cacheService.get('array')).toEqual([1, 2, 3])
      expect(cacheService.get('object')).toEqual({ a: 1 })
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
      const result = cacheService.delete('nonexistent')
      expect(result).toBe(false)
    })

    it('returns true when key is deleted', () => {
      cacheService.set('key', 'value')
      const result = cacheService.delete('key')
      expect(result).toBe(true)
    })
  })

  describe('clear', () => {
    it('removes all entries', () => {
      cacheService.set('key1', 'value1')
      cacheService.set('key2', 'value2')
      cacheService.set('key3', 'value3')

      cacheService.clear()

      expect(cacheService.get('key1')).toBeNull()
      expect(cacheService.get('key2')).toBeNull()
      expect(cacheService.get('key3')).toBeNull()
    })

    it('resets statistics', () => {
      cacheService.set('key', 'value')
      cacheService.get('key')
      cacheService.get('nonexistent')

      cacheService.clear()

      const stats = cacheService.stats
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
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

    it('handles no matching entries', () => {
      cacheService.set('key1', 'value1')

      expect(() => cacheService.clearByPrefix('nonexistent:')).not.toThrow()
      expect(cacheService.get('key1')).toBe('value1')
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
  })

  describe('stats', () => {
    it('returns correct statistics', () => {
      cacheService.set('key1', 'value1')
      cacheService.set('key2', 'value2')

      const stats = cacheService.stats

      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(100)
      expect(stats.hits).toBeDefined()
      expect(stats.misses).toBeDefined()
    })

    it('tracks hits and misses', () => {
      cacheService.set('key1', 'value1')

      cacheService.get('key1') // hit
      cacheService.get('key1') // hit
      cacheService.get('nonexistent') // miss

      const stats = cacheService.stats

      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(1)
    })

    it('calculates hit rate', () => {
      cacheService.set('key', 'value')

      cacheService.get('key') // hit
      cacheService.get('key') // hit
      cacheService.get('nonexistent') // miss
      cacheService.get('nonexistent') // miss

      const stats = cacheService.stats

      expect(stats.hitRate).toBe(0.5) // 2 hits / 4 total
    })
  })

  describe('LRU eviction', () => {
    it('evicts items when at capacity', () => {
      const smallCache = new MemoryCacheService(3)

      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')

      // Access key1 to increase its access count
      smallCache.get('key1')
      smallCache.get('key1')

      // Add fourth item - should trigger eviction
      smallCache.set('key4', 'value4')

      // Size should be capped at max
      expect(smallCache.size).toBe(3)
      // Fourth key should exist
      expect(smallCache.get('key4')).toBe('value4')
    })
  })

  describe('edge cases', () => {
    it('overwrites existing key', () => {
      cacheService.set('key', 'value1')
      cacheService.set('key', 'value2')

      expect(cacheService.get('key')).toBe('value2')
    })

    it('handles empty string key', () => {
      cacheService.set('', 'value')

      expect(cacheService.get('')).toBe('value')
    })

    it('handles null value', () => {
      cacheService.set('key', null)

      // null is stored, but get returns null for both stored null and not found
      expect(cacheService.has('key')).toBe(true)
    })
  })

  describe('keys', () => {
    it('returns all keys', () => {
      cacheService.set('key1', 'value1')
      cacheService.set('key2', 'value2')

      const keys = cacheService.keys()

      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys.length).toBe(2)
    })
  })

  describe('entries', () => {
    it('returns all entries with metadata', () => {
      cacheService.set('key1', 'value1')

      const entries = cacheService.entries()

      expect(entries.length).toBe(1)
      expect(entries[0].key).toBe('key1')
      expect(entries[0].entry.value).toBe('value1')
      expect(entries[0].entry.accessCount).toBe(1)
    })
  })

  describe('size', () => {
    it('returns correct size', () => {
      expect(cacheService.size).toBe(0)

      cacheService.set('key1', 'value1')
      expect(cacheService.size).toBe(1)

      cacheService.set('key2', 'value2')
      expect(cacheService.size).toBe(2)

      cacheService.delete('key1')
      expect(cacheService.size).toBe(1)
    })
  })
})
