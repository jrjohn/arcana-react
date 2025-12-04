// =============================================================================
// Sanitization Service
// =============================================================================

/**
 * Sanitization utilities for cleaning user input
 */
export const sanitizationService = {
  /**
   * Sanitize HTML to prevent XSS
   */
  sanitizeHtml(input: string): string {
    if (!input) return ''

    const div = document.createElement('div')
    div.textContent = input
    return div.innerHTML
  },

  /**
   * Trim and normalize whitespace
   */
  normalizeWhitespace(input: string): string {
    if (!input) return ''
    return input.trim().replace(/\s+/g, ' ')
  },

  /**
   * Sanitize email (lowercase and trim)
   */
  sanitizeEmail(email: string): string {
    if (!email) return ''
    return email.trim().toLowerCase()
  },

  /**
   * Sanitize name (capitalize first letter of each word)
   */
  sanitizeName(name: string): string {
    if (!name) return ''
    return this.normalizeWhitespace(name)
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  },

  /**
   * Sanitize URL
   */
  sanitizeUrl(url: string): string {
    if (!url) return ''
    const trimmed = url.trim()

    // Ensure URL has protocol
    if (trimmed && !trimmed.match(/^https?:\/\//i)) {
      return `https://${trimmed}`
    }

    return trimmed
  },

  /**
   * Remove dangerous characters from string
   */
  removeDangerousChars(input: string): string {
    if (!input) return ''
    // Remove null bytes, control characters, and common injection characters
    return input.replace(/[\x00-\x1f\x7f<>'"`;\\]/g, '')
  },

  /**
   * Sanitize for SQL-like contexts (escape quotes)
   */
  escapeQuotes(input: string): string {
    if (!input) return ''
    return input.replace(/'/g, "''").replace(/"/g, '\\"')
  },

  /**
   * Sanitize search query
   */
  sanitizeSearchQuery(query: string): string {
    if (!query) return ''
    // Remove special regex characters and trim
    return this.normalizeWhitespace(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  },

  /**
   * Generate initials from name
   */
  getInitials(firstName: string, lastName: string): string {
    const first = firstName?.trim().charAt(0).toUpperCase() || ''
    const last = lastName?.trim().charAt(0).toUpperCase() || ''
    return `${first}${last}`
  },

  /**
   * Format full name
   */
  formatFullName(firstName: string, lastName: string): string {
    return [firstName, lastName]
      .filter(Boolean)
      .map((name) => name?.trim())
      .join(' ')
  },

  /**
   * Truncate string with ellipsis
   */
  truncate(input: string, maxLength: number): string {
    if (!input) return ''
    if (input.length <= maxLength) return input
    return `${input.slice(0, maxLength - 3)}...`
  },

  /**
   * Sanitize object recursively
   */
  sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized = { ...obj } as Record<string, unknown>

    for (const key in sanitized) {
      const value = sanitized[key]
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeHtml(value)
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>)
      }
    }

    return sanitized as T
  },
}
