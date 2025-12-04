import { describe, it, expect } from 'vitest'
import { sanitizationService } from './sanitizationService'

describe('sanitizationService', () => {
  describe('sanitizeHtml', () => {
    it('should return empty string for falsy input', () => {
      expect(sanitizationService.sanitizeHtml('')).toBe('')
    })

    it('should escape HTML entities', () => {
      expect(sanitizationService.sanitizeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;')
      expect(sanitizationService.sanitizeHtml('<div>Test</div>')).toBe('&lt;div&gt;Test&lt;/div&gt;')
    })

    it('should preserve plain text', () => {
      expect(sanitizationService.sanitizeHtml('Hello World')).toBe('Hello World')
    })
  })

  describe('normalizeWhitespace', () => {
    it('should return empty string for falsy input', () => {
      expect(sanitizationService.normalizeWhitespace('')).toBe('')
    })

    it('should trim and normalize whitespace', () => {
      expect(sanitizationService.normalizeWhitespace('  hello   world  ')).toBe('hello world')
      expect(sanitizationService.normalizeWhitespace('hello\n\t\tworld')).toBe('hello world')
    })
  })

  describe('sanitizeEmail', () => {
    it('should return empty string for falsy input', () => {
      expect(sanitizationService.sanitizeEmail('')).toBe('')
    })

    it('should lowercase and trim email', () => {
      expect(sanitizationService.sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com')
    })
  })

  describe('sanitizeName', () => {
    it('should return empty string for falsy input', () => {
      expect(sanitizationService.sanitizeName('')).toBe('')
    })

    it('should capitalize first letter of each word', () => {
      expect(sanitizationService.sanitizeName('john doe')).toBe('John Doe')
      expect(sanitizationService.sanitizeName('JOHN DOE')).toBe('John Doe')
      expect(sanitizationService.sanitizeName('jOHN dOE')).toBe('John Doe')
    })

    it('should normalize whitespace', () => {
      expect(sanitizationService.sanitizeName('  john   doe  ')).toBe('John Doe')
    })
  })

  describe('sanitizeUrl', () => {
    it('should return empty string for falsy input', () => {
      expect(sanitizationService.sanitizeUrl('')).toBe('')
    })

    it('should add https protocol if missing', () => {
      expect(sanitizationService.sanitizeUrl('example.com')).toBe('https://example.com')
    })

    it('should preserve existing protocol', () => {
      expect(sanitizationService.sanitizeUrl('https://example.com')).toBe('https://example.com')
      expect(sanitizationService.sanitizeUrl('http://example.com')).toBe('http://example.com')
    })

    it('should trim whitespace', () => {
      expect(sanitizationService.sanitizeUrl('  https://example.com  ')).toBe('https://example.com')
    })
  })

  describe('removeDangerousChars', () => {
    it('should return empty string for falsy input', () => {
      expect(sanitizationService.removeDangerousChars('')).toBe('')
    })

    it('should remove dangerous characters', () => {
      expect(sanitizationService.removeDangerousChars('<script>')).toBe('script')
      expect(sanitizationService.removeDangerousChars("test'quote")).toBe('testquote')
      expect(sanitizationService.removeDangerousChars('test;semicolon')).toBe('testsemicolon')
    })

    it('should preserve safe characters', () => {
      expect(sanitizationService.removeDangerousChars('Hello World 123!')).toBe('Hello World 123!')
    })
  })

  describe('escapeQuotes', () => {
    it('should return empty string for falsy input', () => {
      expect(sanitizationService.escapeQuotes('')).toBe('')
    })

    it('should escape single quotes', () => {
      expect(sanitizationService.escapeQuotes("O'Brien")).toBe("O''Brien")
    })

    it('should escape double quotes', () => {
      expect(sanitizationService.escapeQuotes('Say "Hello"')).toBe('Say \\"Hello\\"')
    })
  })

  describe('sanitizeSearchQuery', () => {
    it('should return empty string for falsy input', () => {
      expect(sanitizationService.sanitizeSearchQuery('')).toBe('')
    })

    it('should escape regex special characters', () => {
      expect(sanitizationService.sanitizeSearchQuery('test.*query')).toBe('test\\.\\*query')
      expect(sanitizationService.sanitizeSearchQuery('hello (world)')).toBe('hello \\(world\\)')
    })

    it('should normalize whitespace', () => {
      expect(sanitizationService.sanitizeSearchQuery('  hello   world  ')).toBe('hello world')
    })
  })

  describe('getInitials', () => {
    it('should return initials from first and last name', () => {
      expect(sanitizationService.getInitials('John', 'Doe')).toBe('JD')
    })

    it('should handle empty strings', () => {
      expect(sanitizationService.getInitials('', '')).toBe('')
      expect(sanitizationService.getInitials('John', '')).toBe('J')
      expect(sanitizationService.getInitials('', 'Doe')).toBe('D')
    })

    it('should trim and uppercase', () => {
      expect(sanitizationService.getInitials('  john  ', '  doe  ')).toBe('JD')
    })
  })

  describe('formatFullName', () => {
    it('should format full name', () => {
      expect(sanitizationService.formatFullName('John', 'Doe')).toBe('John Doe')
    })

    it('should handle empty parts', () => {
      expect(sanitizationService.formatFullName('John', '')).toBe('John')
      expect(sanitizationService.formatFullName('', 'Doe')).toBe('Doe')
      expect(sanitizationService.formatFullName('', '')).toBe('')
    })

    it('should trim whitespace', () => {
      expect(sanitizationService.formatFullName('  John  ', '  Doe  ')).toBe('John Doe')
    })
  })

  describe('truncate', () => {
    it('should return empty string for falsy input', () => {
      expect(sanitizationService.truncate('', 10)).toBe('')
    })

    it('should not truncate if within limit', () => {
      expect(sanitizationService.truncate('Hello', 10)).toBe('Hello')
    })

    it('should truncate with ellipsis', () => {
      expect(sanitizationService.truncate('Hello World', 8)).toBe('Hello...')
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize string values in object', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
      }
      const result = sanitizationService.sanitizeObject(input)
      expect(result.name).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;')
      expect(result.email).toBe('test@example.com')
    })

    it('should recursively sanitize nested objects', () => {
      const input = {
        user: {
          name: '<div>Test</div>',
        },
      }
      const result = sanitizationService.sanitizeObject(input)
      expect((result.user as { name: string }).name).toBe('&lt;div&gt;Test&lt;/div&gt;')
    })

    it('should preserve non-string values', () => {
      const input = {
        count: 42,
        active: true,
        tags: ['a', 'b'],
      }
      const result = sanitizationService.sanitizeObject(input)
      expect(result.count).toBe(42)
      expect(result.active).toBe(true)
      expect(result.tags).toEqual(['a', 'b'])
    })
  })
})
