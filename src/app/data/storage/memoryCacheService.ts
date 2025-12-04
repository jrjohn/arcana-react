// =============================================================================
// Memory Cache Service - Layer 1 (Fastest)
// =============================================================================

import { signal } from '@preact/signals-react'

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T
  timestamp: number
  accessCount: number
  lastAccessed: number
}

/**
 * Memory Cache Service
 * Layer 1: Ultra-fast in-memory cache using Map
 * - No TTL (data lives until eviction or clear)
 * - Suitable for frequently accessed data within a session
 */
class MemoryCacheService {
  private cache = new Map<string, CacheEntry<unknown>>()
  private maxSize: number
  private hits = signal(0)
  private misses = signal(0)

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      this.misses.value++
      return null
    }

    // Update access metadata
    entry.accessCount++
    entry.lastAccessed = Date.now()
    this.hits.value++

    return entry.value
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, value: T): void {
    // Evict if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed()
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    }

    this.cache.set(key, entry)
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all items matching prefix
   */
  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
    this.hits.value = 0
    this.misses.value = 0
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * Get cache statistics
   */
  get stats() {
    const totalRequests = this.hits.value + this.misses.value
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits.value,
      misses: this.misses.value,
      hitRate: totalRequests > 0 ? this.hits.value / totalRequests : 0,
    }
  }

  /**
   * Evict least recently used item
   */
  private evictLeastUsed(): void {
    let lruKey: string | null = null
    let lruTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      // Use combination of access count and last accessed time
      const score = entry.lastAccessed - entry.accessCount * 1000
      if (score < lruTime) {
        lruTime = score
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get all entries (for debugging)
   */
  entries(): Array<{ key: string; entry: CacheEntry<unknown> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry,
    }))
  }
}

// Export singleton instance
export const memoryCacheService = new MemoryCacheService(100)

// Export class for testing or custom instances
export { MemoryCacheService }
