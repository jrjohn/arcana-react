// =============================================================================
// LRU Cache Service - Layer 2 (Fast with TTL)
// =============================================================================

import { signal } from '@preact/signals-react'
import { APP_CONSTANTS } from '@/app/core/constants/app.constants'

/**
 * LRU Cache entry with TTL
 */
interface LRUCacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
}

/**
 * LRU Node for doubly linked list
 */
class LRUNode<T> {
  key: string
  entry: LRUCacheEntry<T>
  prev: LRUNode<T> | null = null
  next: LRUNode<T> | null = null

  constructor(key: string, entry: LRUCacheEntry<T>) {
    this.key = key
    this.entry = entry
  }
}

/**
 * LRU Cache Service
 * Layer 2: LRU cache with TTL support
 * - Uses doubly linked list for O(1) operations
 * - Automatic expiration of stale entries
 * - Configurable max size and default TTL
 */
class LRUCacheService {
  private cache = new Map<string, LRUNode<unknown>>()
  private head: LRUNode<unknown> | null = null
  private tail: LRUNode<unknown> | null = null
  private maxSize: number
  private defaultTTL: number

  private hits = signal(0)
  private misses = signal(0)
  private evictions = signal(0)

  constructor(maxSize: number = 500, defaultTTL: number = APP_CONSTANTS.CACHE.DEFAULT_TTL) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL

    // Periodic cleanup of expired entries
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupExpired(), 60000) // Every minute
    }
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const node = this.cache.get(key) as LRUNode<T> | undefined

    if (!node) {
      this.misses.value++
      return null
    }

    // Check if expired
    if (Date.now() > node.entry.expiresAt) {
      this.delete(key)
      this.misses.value++
      return null
    }

    // Move to front (most recently used)
    this.moveToFront(node)
    this.hits.value++

    return node.entry.value
  }

  /**
   * Set item in cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL)
    const entry: LRUCacheEntry<T> = {
      value,
      expiresAt,
      createdAt: Date.now(),
    }

    // Update existing
    if (this.cache.has(key)) {
      const node = this.cache.get(key) as LRUNode<T>
      node.entry = entry
      this.moveToFront(node)
      return
    }

    // Evict if at max size
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    // Add new node at front
    const node = new LRUNode(key, entry)
    this.addToFront(node as LRUNode<unknown>)
    this.cache.set(key, node as LRUNode<unknown>)
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const node = this.cache.get(key)
    if (!node) return false
    if (Date.now() > node.entry.expiresAt) {
      this.delete(key)
      return false
    }
    return true
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const node = this.cache.get(key)
    if (!node) return false

    this.removeNode(node)
    return this.cache.delete(key)
  }

  /**
   * Clear all items matching prefix
   */
  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key)
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
    this.head = null
    this.tail = null
    this.hits.value = 0
    this.misses.value = 0
    this.evictions.value = 0
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
      evictions: this.evictions.value,
      hitRate: totalRequests > 0 ? this.hits.value / totalRequests : 0,
    }
  }

  /**
   * Add node to front of list
   */
  private addToFront(node: LRUNode<unknown>): void {
    node.prev = null
    node.next = this.head

    if (this.head) {
      this.head.prev = node
    }
    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  /**
   * Remove node from list
   */
  private removeNode(node: LRUNode<unknown>): void {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }
  }

  /**
   * Move node to front of list
   */
  private moveToFront(node: LRUNode<unknown>): void {
    if (node === this.head) return
    this.removeNode(node)
    this.addToFront(node)
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    if (!this.tail) return

    const key = this.tail.key
    this.removeNode(this.tail)
    this.cache.delete(key)
    this.evictions.value++
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now()
    for (const [key, node] of this.cache.entries()) {
      if (now > node.entry.expiresAt) {
        this.delete(key)
      }
    }
  }

  /**
   * Get remaining TTL for a key in milliseconds
   */
  getTTL(key: string): number | null {
    const node = this.cache.get(key)
    if (!node) return null

    const remaining = node.entry.expiresAt - Date.now()
    return remaining > 0 ? remaining : null
  }

  /**
   * Refresh TTL for a key
   */
  touch(key: string, ttl?: number): boolean {
    const node = this.cache.get(key)
    if (!node) return false

    node.entry.expiresAt = Date.now() + (ttl ?? this.defaultTTL)
    this.moveToFront(node)
    return true
  }

  /**
   * Get all keys (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
}

// Export singleton instance
export const lruCacheService = new LRUCacheService(500, APP_CONSTANTS.CACHE.DEFAULT_TTL)

// Export class for testing or custom instances
export { LRUCacheService }
