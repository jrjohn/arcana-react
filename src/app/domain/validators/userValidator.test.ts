import { describe, it, expect } from 'vitest'
import { userValidator, isValidUser } from './userValidator'

describe('userValidator', () => {
  describe('validateFirstName', () => {
    it('should return error for empty value', () => {
      expect(userValidator.validateFirstName('')).toBe('First name is required')
      expect(userValidator.validateFirstName(null)).toBe('First name is required')
      expect(userValidator.validateFirstName(undefined)).toBe('First name is required')
      expect(userValidator.validateFirstName('   ')).toBe('First name is required')
    })

    it('should return error for too short value', () => {
      expect(userValidator.validateFirstName('A')).toBe('First name must be at least 2 characters')
    })

    it('should return error for too long value', () => {
      const longName = 'A'.repeat(51)
      expect(userValidator.validateFirstName(longName)).toBe('First name must be less than 50 characters')
    })

    it('should return error for invalid characters', () => {
      expect(userValidator.validateFirstName('John123')).toBe('First name contains invalid characters')
      expect(userValidator.validateFirstName('John@')).toBe('First name contains invalid characters')
    })

    it('should return null for valid first name', () => {
      expect(userValidator.validateFirstName('John')).toBeNull()
      expect(userValidator.validateFirstName('Mary-Jane')).toBeNull()
      expect(userValidator.validateFirstName("O'Brien")).toBeNull()
      expect(userValidator.validateFirstName('José')).toBeNull()
    })
  })

  describe('validateLastName', () => {
    it('should return error for empty value', () => {
      expect(userValidator.validateLastName('')).toBe('Last name is required')
      expect(userValidator.validateLastName(null)).toBe('Last name is required')
      expect(userValidator.validateLastName(undefined)).toBe('Last name is required')
    })

    it('should return error for too short value', () => {
      expect(userValidator.validateLastName('A')).toBe('Last name must be at least 2 characters')
    })

    it('should return error for too long value', () => {
      const longName = 'B'.repeat(51)
      expect(userValidator.validateLastName(longName)).toBe('Last name must be less than 50 characters')
    })

    it('should return null for valid last name', () => {
      expect(userValidator.validateLastName('Doe')).toBeNull()
      expect(userValidator.validateLastName('Van Der Berg')).toBeNull()
    })
  })

  describe('validateEmail', () => {
    it('should return error for empty value', () => {
      expect(userValidator.validateEmail('')).toBe('Email is required')
      expect(userValidator.validateEmail(null)).toBe('Email is required')
      expect(userValidator.validateEmail(undefined)).toBe('Email is required')
    })

    it('should return error for invalid email', () => {
      expect(userValidator.validateEmail('invalid')).toBe('Please enter a valid email address')
      expect(userValidator.validateEmail('invalid@')).toBe('Please enter a valid email address')
      expect(userValidator.validateEmail('@invalid.com')).toBe('Please enter a valid email address')
    })

    it('should return null for valid email', () => {
      expect(userValidator.validateEmail('test@example.com')).toBeNull()
      expect(userValidator.validateEmail('user.name@domain.co.uk')).toBeNull()
    })
  })

  describe('validateAvatar', () => {
    it('should return null for empty value (avatar is optional)', () => {
      expect(userValidator.validateAvatar('')).toBeNull()
      expect(userValidator.validateAvatar(null)).toBeNull()
      expect(userValidator.validateAvatar(undefined)).toBeNull()
    })

    it('should return error for invalid URL', () => {
      expect(userValidator.validateAvatar('invalid-url')).toBe('Please enter a valid URL')
      expect(userValidator.validateAvatar('www.example.com')).toBe('Please enter a valid URL')
    })

    it('should return null for valid URL', () => {
      expect(userValidator.validateAvatar('https://example.com/avatar.jpg')).toBeNull()
      expect(userValidator.validateAvatar('http://example.com/image.png')).toBeNull()
    })
  })

  describe('validateCreate', () => {
    it('should return all errors for empty object', () => {
      const errors = userValidator.validateCreate({
        firstName: '',
        lastName: '',
        email: '',
      })
      expect(errors.firstName).toBe('First name is required')
      expect(errors.lastName).toBe('Last name is required')
      expect(errors.email).toBe('Email is required')
    })

    it('should return no errors for valid data', () => {
      const errors = userValidator.validateCreate({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      })
      expect(errors.firstName).toBeNull()
      expect(errors.lastName).toBeNull()
      expect(errors.email).toBeNull()
    })
  })

  describe('validateUpdate', () => {
    it('should only validate provided fields', () => {
      const errors = userValidator.validateUpdate({
        firstName: 'A', // Too short
      })
      expect(errors.firstName).toBe('First name must be at least 2 characters')
      expect(errors.lastName).toBeUndefined()
      expect(errors.email).toBeUndefined()
    })
  })

  describe('hasErrors', () => {
    it('should return true if any error exists', () => {
      expect(userValidator.hasErrors({ firstName: 'Error' })).toBe(true)
      expect(userValidator.hasErrors({ firstName: null, lastName: 'Error' })).toBe(true)
    })

    it('should return false if no errors', () => {
      expect(userValidator.hasErrors({})).toBe(false)
      expect(userValidator.hasErrors({ firstName: null, lastName: null })).toBe(false)
    })
  })

  describe('getFirstError', () => {
    it('should return first error message', () => {
      const errors = { firstName: 'First error', lastName: 'Second error' }
      expect(userValidator.getFirstError(errors)).toBe('First error')
    })

    it('should return null if no errors', () => {
      expect(userValidator.getFirstError({})).toBeNull()
      expect(userValidator.getFirstError({ firstName: null })).toBeNull()
    })
  })

  describe('validateField', () => {
    it('should validate specific field by name', () => {
      expect(userValidator.validateField('firstName', '')).toBe('First name is required')
      expect(userValidator.validateField('lastName', '')).toBe('Last name is required')
      expect(userValidator.validateField('email', '')).toBe('Email is required')
      expect(userValidator.validateField('avatar', '')).toBeNull()
    })
  })
})

describe('isValidUser', () => {
  it('should return false for non-object', () => {
    expect(isValidUser(null)).toBe(false)
    expect(isValidUser(undefined)).toBe(false)
    expect(isValidUser('string')).toBe(false)
    expect(isValidUser(123)).toBe(false)
  })

  it('should return false for object missing required fields', () => {
    expect(isValidUser({})).toBe(false)
    expect(isValidUser({ id: '1' })).toBe(false)
  })

  it('should return true for valid user object', () => {
    const validUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(isValidUser(validUser)).toBe(true)
  })

  it('should return true for user with optional avatar', () => {
    const userWithAvatar = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'https://example.com/avatar.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(isValidUser(userWithAvatar)).toBe(true)
  })
})
