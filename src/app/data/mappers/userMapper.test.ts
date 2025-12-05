// =============================================================================
// User Mapper Tests
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userMapper, type UserApiDto, type PaginatedApiResponse } from './userMapper'
import type { User, CreateUserDto, UpdateUserDto } from '@/app/domain/entities/user.model'

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234-5678-9012',
})

describe('userMapper', () => {
  describe('toDomain', () => {
    it('converts API DTO to domain model', () => {
      const dto: UserApiDto = {
        id: 1,
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        avatar: 'https://example.com/avatar.jpg',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-16T12:00:00Z',
      }

      const result = userMapper.toDomain(dto)

      expect(result).toEqual({
        id: '1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://example.com/avatar.jpg',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T12:00:00Z'),
      })
    })

    it('handles string id', () => {
      const dto: UserApiDto = {
        id: 'abc-123',
        email: 'jane@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
      }

      const result = userMapper.toDomain(dto)

      expect(result.id).toBe('abc-123')
    })

    it('uses current date when timestamps are missing', () => {
      const before = new Date()

      const dto: UserApiDto = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      }

      const result = userMapper.toDomain(dto)
      const after = new Date()

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('handles undefined avatar', () => {
      const dto: UserApiDto = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      }

      const result = userMapper.toDomain(dto)

      expect(result.avatar).toBeUndefined()
    })
  })

  describe('toDomainList', () => {
    it('converts array of DTOs to domain models', () => {
      const dtos: UserApiDto[] = [
        { id: 1, email: 'user1@example.com', first_name: 'User', last_name: 'One' },
        { id: 2, email: 'user2@example.com', first_name: 'User', last_name: 'Two' },
      ]

      const result = userMapper.toDomainList(dtos)

      expect(result).toHaveLength(2)
      expect(result[0].email).toBe('user1@example.com')
      expect(result[1].email).toBe('user2@example.com')
    })

    it('returns empty array for empty input', () => {
      const result = userMapper.toDomainList([])

      expect(result).toEqual([])
    })
  })

  describe('toApiDto', () => {
    it('converts domain model to API DTO', () => {
      const user: User = {
        id: '1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://example.com/avatar.jpg',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T12:00:00Z'),
      }

      const result = userMapper.toApiDto(user)

      expect(result).toEqual({
        id: '1',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        avatar: 'https://example.com/avatar.jpg',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-16T12:00:00.000Z',
      })
    })

    it('handles undefined dates', () => {
      const user: User = {
        id: '1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      } as User

      const result = userMapper.toApiDto(user)

      expect(result.created_at).toBeUndefined()
      expect(result.updated_at).toBeUndefined()
    })
  })

  describe('toCreateApiDto', () => {
    it('converts CreateUserDto to API format', () => {
      const dto: CreateUserDto = {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        avatar: 'https://example.com/new-avatar.jpg',
      }

      const result = userMapper.toCreateApiDto(dto)

      expect(result).toEqual({
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        avatar: 'https://example.com/new-avatar.jpg',
      })
    })

    it('handles undefined avatar', () => {
      const dto: CreateUserDto = {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
      }

      const result = userMapper.toCreateApiDto(dto)

      expect(result.avatar).toBeUndefined()
    })
  })

  describe('toUpdateApiDto', () => {
    it('includes only defined fields', () => {
      const dto: UpdateUserDto = {
        firstName: 'Updated',
      }

      const result = userMapper.toUpdateApiDto(dto)

      expect(result).toEqual({
        first_name: 'Updated',
      })
      expect(result.email).toBeUndefined()
      expect(result.last_name).toBeUndefined()
    })

    it('includes all fields when all are defined', () => {
      const dto: UpdateUserDto = {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
        avatar: 'https://example.com/updated.jpg',
      }

      const result = userMapper.toUpdateApiDto(dto)

      expect(result).toEqual({
        email: 'updated@example.com',
        first_name: 'Updated',
        last_name: 'User',
        avatar: 'https://example.com/updated.jpg',
      })
    })

    it('returns empty object when no fields defined', () => {
      const dto: UpdateUserDto = {}

      const result = userMapper.toUpdateApiDto(dto)

      expect(result).toEqual({})
    })
  })

  describe('toPaginatedDomain', () => {
    it('converts paginated API response to domain', () => {
      const response: PaginatedApiResponse<UserApiDto> = {
        data: [
          { id: 1, email: 'user1@example.com', first_name: 'User', last_name: 'One' },
          { id: 2, email: 'user2@example.com', first_name: 'User', last_name: 'Two' },
        ],
        page: 1,
        per_page: 10,
        total: 50,
        total_pages: 5,
      }

      const result = userMapper.toPaginatedDomain(response)

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({ email: 'user1@example.com' }),
          expect.objectContaining({ email: 'user2@example.com' }),
        ]),
        page: 1,
        pageSize: 10,
        total: 50,
        totalPages: 5,
      })
    })
  })

  describe('createOfflineUser', () => {
    it('creates user with offline_ prefix id', () => {
      const dto: CreateUserDto = {
        email: 'offline@example.com',
        firstName: 'Offline',
        lastName: 'User',
      }

      const result = userMapper.createOfflineUser(dto)

      expect(result.id).toMatch(/^offline_/)
      expect(result.email).toBe('offline@example.com')
      expect(result.firstName).toBe('Offline')
      expect(result.lastName).toBe('User')
    })

    it('sets current timestamps', () => {
      const before = new Date()

      const dto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }

      const result = userMapper.createOfflineUser(dto)
      const after = new Date()

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('applyUpdate', () => {
    let existingUser: User

    beforeEach(() => {
      existingUser = {
        id: '1',
        email: 'original@example.com',
        firstName: 'Original',
        lastName: 'User',
        avatar: 'https://example.com/original.jpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }
    })

    it('updates only specified fields', () => {
      const dto: UpdateUserDto = {
        firstName: 'Updated',
      }

      const result = userMapper.applyUpdate(existingUser, dto)

      expect(result.firstName).toBe('Updated')
      expect(result.lastName).toBe('User') // lastName from existingUser
      expect(result.email).toBe('original@example.com')
    })

    it('updates all fields when all specified', () => {
      const dto: UpdateUserDto = {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        avatar: 'https://example.com/updated.jpg',
      }

      const result = userMapper.applyUpdate(existingUser, dto)

      expect(result.email).toBe('updated@example.com')
      expect(result.firstName).toBe('Updated')
      expect(result.lastName).toBe('Name')
      expect(result.avatar).toBe('https://example.com/updated.jpg')
    })

    it('preserves original id and createdAt', () => {
      const dto: UpdateUserDto = {
        firstName: 'Updated',
      }

      const result = userMapper.applyUpdate(existingUser, dto)

      expect(result.id).toBe('1')
      expect(result.createdAt).toEqual(new Date('2024-01-01'))
    })

    it('updates updatedAt timestamp', () => {
      const before = new Date()

      const dto: UpdateUserDto = {
        firstName: 'Updated',
      }

      const result = userMapper.applyUpdate(existingUser, dto)
      const after = new Date()

      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('handles undefined avatar in update (removes avatar)', () => {
      const dto: UpdateUserDto = {
        avatar: undefined,
      }

      const result = userMapper.applyUpdate(existingUser, dto)

      // undefined in dto means keep existing
      expect(result.avatar).toBe('https://example.com/original.jpg')
    })
  })

  describe('isOfflineUser', () => {
    it('returns true for offline users', () => {
      const user: User = {
        id: 'offline_abc-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(userMapper.isOfflineUser(user)).toBe(true)
    })

    it('returns false for online users', () => {
      const user: User = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(userMapper.isOfflineUser(user)).toBe(false)
    })
  })

  describe('getDisplayName', () => {
    it('returns full name with space', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(userMapper.getDisplayName(user)).toBe('John Doe')
    })

    it('concatenates names with space', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        firstName: '  John  ',
        lastName: '  Doe  ',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // getDisplayName concatenates and trims the result
      const result = userMapper.getDisplayName(user)
      expect(result).toContain('John')
      expect(result).toContain('Doe')
    })
  })

  describe('getInitials', () => {
    it('returns uppercase initials', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        firstName: 'john',
        lastName: 'doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(userMapper.getInitials(user)).toBe('JD')
    })

    it('handles missing first name', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        firstName: '',
        lastName: 'Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(userMapper.getInitials(user)).toBe('D')
    })

    it('handles missing last name', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(userMapper.getInitials(user)).toBe('J')
    })
  })
})
