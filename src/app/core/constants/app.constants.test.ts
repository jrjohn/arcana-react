// =============================================================================
// Application Constants Tests
// =============================================================================

import { describe, it, expect } from 'vitest'
import { APP_CONSTANTS, isDevelopment, isProduction } from './app.constants'

describe('APP_CONSTANTS', () => {
  it('has expected application info fields', () => {
    expect(APP_CONSTANTS.APP_NAME).toBe('Arcana')
    expect(APP_CONSTANTS.APP_VERSION).toBeDefined()
    expect(APP_CONSTANTS.APP_BUILD).toBeDefined()
    expect(APP_CONSTANTS.APP_ENVIRONMENT).toBeDefined()
  })

  it('has API configuration with BASE_URL and TIMEOUT', () => {
    expect(APP_CONSTANTS.API.BASE_URL).toBeTruthy()
    expect(typeof APP_CONSTANTS.API.TIMEOUT).toBe('number')
    expect(APP_CONSTANTS.API.TIMEOUT).toBeGreaterThan(0)
  })

  it('has CACHE configuration with numeric TTL values', () => {
    expect(APP_CONSTANTS.CACHE.DEFAULT_TTL).toBeGreaterThan(0)
    expect(APP_CONSTANTS.CACHE.LIST_TTL).toBeGreaterThan(0)
    expect(APP_CONSTANTS.CACHE.LONG_TTL).toBeGreaterThan(APP_CONSTANTS.CACHE.DEFAULT_TTL)
    expect(APP_CONSTANTS.CACHE.LRU_MAX_ITEMS).toBeGreaterThan(0)
  })

  it('has PAGINATION defaults', () => {
    expect(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE_SIZE).toBeGreaterThan(0)
    expect(APP_CONSTANTS.PAGINATION.PAGE_SIZE_OPTIONS).toContain(
      APP_CONSTANTS.PAGINATION.DEFAULT_PAGE_SIZE
    )
  })

  it('has all STORAGE_KEYS defined as non-empty strings', () => {
    for (const [, value] of Object.entries(APP_CONSTANTS.STORAGE_KEYS)) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('has INDEXED_DB configuration', () => {
    expect(APP_CONSTANTS.INDEXED_DB.NAME).toBeTruthy()
    expect(APP_CONSTANTS.INDEXED_DB.VERSION).toBeGreaterThan(0)
    expect(APP_CONSTANTS.INDEXED_DB.STORES.USERS).toBeTruthy()
    expect(APP_CONSTANTS.INDEXED_DB.STORES.PENDING_OPERATIONS).toBeTruthy()
    expect(APP_CONSTANTS.INDEXED_DB.STORES.CACHE_ENTRIES).toBeTruthy()
  })

  it('has VALIDATION patterns that compile as RegExp', () => {
    expect(APP_CONSTANTS.VALIDATION.NAME_PATTERN).toBeInstanceOf(RegExp)
    expect(APP_CONSTANTS.VALIDATION.EMAIL_PATTERN).toBeInstanceOf(RegExp)
    expect(APP_CONSTANTS.VALIDATION.URL_PATTERN).toBeInstanceOf(RegExp)
  })

  it('VALIDATION email pattern matches valid emails', () => {
    const { EMAIL_PATTERN } = APP_CONSTANTS.VALIDATION
    expect(EMAIL_PATTERN.test('user@example.com')).toBe(true)
    expect(EMAIL_PATTERN.test('not-an-email')).toBe(false)
  })

  it('VALIDATION URL pattern matches valid http/https URLs', () => {
    const { URL_PATTERN } = APP_CONSTANTS.VALIDATION
    expect(URL_PATTERN.test('https://example.com')).toBe(true)
    expect(URL_PATTERN.test('http://localhost:3000')).toBe(true)
    expect(URL_PATTERN.test('ftp://nope.com')).toBe(false)
  })

  it('has RETRY configuration with positive values', () => {
    expect(APP_CONSTANTS.RETRY.MAX_ATTEMPTS).toBeGreaterThan(0)
    expect(APP_CONSTANTS.RETRY.INITIAL_DELAY).toBeGreaterThan(0)
    expect(APP_CONSTANTS.RETRY.MAX_DELAY).toBeGreaterThan(APP_CONSTANTS.RETRY.INITIAL_DELAY)
  })

  it('has ANIMATION durations in expected order (FAST < NORMAL < SLOW)', () => {
    expect(APP_CONSTANTS.ANIMATION.FAST).toBeLessThan(APP_CONSTANTS.ANIMATION.NORMAL)
    expect(APP_CONSTANTS.ANIMATION.NORMAL).toBeLessThan(APP_CONSTANTS.ANIMATION.SLOW)
  })

  it('has DEBOUNCE timing values', () => {
    expect(APP_CONSTANTS.DEBOUNCE.SEARCH).toBeGreaterThan(0)
    expect(APP_CONSTANTS.DEBOUNCE.RESIZE).toBeGreaterThan(0)
    expect(APP_CONSTANTS.DEBOUNCE.SCROLL).toBeGreaterThan(0)
  })
})

describe('Environment helpers', () => {
  it('isDevelopment and isProduction are booleans', () => {
    expect(typeof isDevelopment).toBe('boolean')
    expect(typeof isProduction).toBe('boolean')
  })

  it('isDevelopment and isProduction are mutually exclusive in a given env', () => {
    // They should not both be true at the same time
    expect(isDevelopment && isProduction).toBe(false)
  })
})
