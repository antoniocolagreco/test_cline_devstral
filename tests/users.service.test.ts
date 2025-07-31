import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'
import bcrypt from 'bcrypt'

// Mock bcrypt
jest.mock('bcrypt')
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

// Mock Prisma client
const mockPrisma = {
	user: {
		findMany: jest.fn(),
		count: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	character: {
		count: jest.fn(),
	},
	image: {
		count: jest.fn(),
	},
	$transaction: jest.fn(),
}

// Mock the prisma import
jest.mock('../src/index.js', () => ({
	prisma: mockPrisma,
}))

import {
	checkUserEmailExistsService,
	createUserService,
	deleteUserService,
	getUserService,
	getUsersService,
	updateUserLastLoginService,
	updateUserService,
	verifyUserPasswordService,
} from '../src/services/users.service.js'

describe('Users Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getUsersService', () => {
		const mockUsers = [
			{
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				googleId: null,
				githubId: null,
				discordId: null,
				avatarPath: null,
				isVerified: true,
				isActive: true,
				lastLoginAt: new Date('2023-01-01T00:00:00.000Z'),
				createdAt: new Date('2023-01-01T00:00:00.000Z'),
				updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			},
			{
				id: 2,
				name: 'Jane Smith',
				email: 'jane@example.com',
				googleId: 'google123',
				githubId: null,
				discordId: null,
				avatarPath: '/avatars/jane.jpg',
				isVerified: false,
				isActive: true,
				lastLoginAt: null,
				createdAt: new Date('2023-01-02T00:00:00.000Z'),
				updatedAt: new Date('2023-01-02T00:00:00.000Z'),
			},
		]

		it('should return paginated users with default parameters', async () => {
			mockPrisma.$transaction.mockImplementation(async (_queries) => {
				return [mockUsers, 2]
			})

			const result = await getUsersService({})

			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)

			expect(result).toEqual({
				data: [
					{
						id: 1,
						name: 'John Doe',
						email: 'john@example.com',
						googleId: undefined,
						githubId: undefined,
						discordId: undefined,
						avatarPath: undefined,
						isVerified: true,
						isActive: true,
						lastLoginAt: '2023-01-01T00:00:00.000Z',
						createdAt: '2023-01-01T00:00:00.000Z',
						updatedAt: '2023-01-01T00:00:00.000Z',
					},
					{
						id: 2,
						name: 'Jane Smith',
						email: 'jane@example.com',
						googleId: 'google123',
						githubId: undefined,
						discordId: undefined,
						avatarPath: '/avatars/jane.jpg',
						isVerified: false,
						isActive: true,
						lastLoginAt: undefined,
						createdAt: '2023-01-02T00:00:00.000Z',
						updatedAt: '2023-01-02T00:00:00.000Z',
					},
				],
				pagination: {
					page: 1,
					pageSize: 10,
					total: 2,
					totalPages: 1,
				},
			})
		})

		it('should return paginated users with custom parameters', async () => {
			mockPrisma.$transaction.mockImplementation(async (_queries) => {
				return [mockUsers.slice(0, 1), 2]
			})

			const result = await getUsersService({
				page: 2,
				pageSize: 1,
				orderBy: { field: 'name', direction: 'desc' },
			})

			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)

			expect(result.pagination).toEqual({
				page: 2,
				pageSize: 1,
				total: 2,
				totalPages: 2,
			})
		})

		it('should handle search parameters', async () => {
			mockPrisma.$transaction.mockImplementation(async (_queries) => {
				return [[], 0]
			})

			await getUsersService({
				search: { name: 'John' } as any,
			})

			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
		})

		it('should throw ValidationError for invalid page number', async () => {
			await expect(getUsersService({ page: 0 })).rejects.toThrow(ValidationError)
			await expect(getUsersService({ page: -1 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid page size', async () => {
			await expect(getUsersService({ pageSize: 0 })).rejects.toThrow(ValidationError)
			await expect(getUsersService({ pageSize: 101 })).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(getUsersService({})).rejects.toThrow('Failed to retrieve users: Database error')
		})

		it('should preserve ValidationError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.$transaction.mockRejectedValue(validationError)

			await expect(getUsersService({})).rejects.toThrow(ValidationError)
		})
	})

	describe('getUserService', () => {
		const mockUser = {
			id: 1,
			name: 'John Doe',
			email: 'john@example.com',
			googleId: null,
			githubId: 'github123',
			discordId: null,
			avatarPath: '/avatars/john.jpg',
			isVerified: true,
			isActive: true,
			lastLoginAt: new Date('2023-01-01T00:00:00.000Z'),
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
		}

		it('should return a user by id', async () => {
			mockPrisma.user.findUnique.mockResolvedValue(mockUser)

			const result = await getUserService(1)

			expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: {
					id: true,
					name: true,
					email: true,
					password: false,
					googleId: true,
					githubId: true,
					discordId: true,
					avatarPath: true,
					isVerified: true,
					isActive: true,
					lastLoginAt: true,
					createdAt: true,
					updatedAt: true,
				},
			})

			expect(result).toEqual({
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				googleId: undefined,
				githubId: 'github123',
				discordId: undefined,
				avatarPath: '/avatars/john.jpg',
				isVerified: true,
				isActive: true,
				lastLoginAt: '2023-01-01T00:00:00.000Z',
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			})
		})

		it('should return null when user not found', async () => {
			mockPrisma.user.findUnique.mockResolvedValue(null)

			const result = await getUserService(999)

			expect(result).toBeNull()
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(getUserService(0)).rejects.toThrow(ValidationError)
			await expect(getUserService(-1)).rejects.toThrow(ValidationError)
			await expect(getUserService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(getUserService(1)).rejects.toThrow('Failed to retrieve user: Database error')
		})

		it('should preserve ValidationError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.user.findUnique.mockRejectedValue(validationError)

			await expect(getUserService(1)).rejects.toThrow(ValidationError)
		})
	})

	describe('createUserService', () => {
		const mockCreatedUser = {
			id: 1,
			name: 'John Doe',
			email: 'john@example.com',
			googleId: null,
			githubId: null,
			discordId: null,
			avatarPath: null,
			isVerified: false,
			isActive: true,
			lastLoginAt: null,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
		}

		beforeEach(() => {
			mockBcrypt.hash.mockResolvedValue('hashedpassword123' as never)
		})

		it('should create a new user', async () => {
			const mockTx = {
				user: {
					findFirst: jest.fn().mockResolvedValue(null),
					create: jest.fn().mockResolvedValue(mockCreatedUser),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			const result = await createUserService({
				name: 'John Doe',
				email: 'john@example.com',
				password: 'password123',
			})

			expect(mockTx.user.findFirst).toHaveBeenCalledWith({
				where: { email: 'john@example.com' },
				select: { id: true },
			})

			expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12)

			expect(mockTx.user.create).toHaveBeenCalledWith({
				data: {
					name: 'John Doe',
					email: 'john@example.com',
					password: 'hashedpassword123',
					isVerified: false,
					isActive: true,
				},
				select: expect.any(Object),
			})

			expect(result).toEqual({
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				googleId: undefined,
				githubId: undefined,
				discordId: undefined,
				avatarPath: undefined,
				isVerified: false,
				isActive: true,
				lastLoginAt: undefined,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			})
		})

		it('should trim and normalize data before creating', async () => {
			const mockTx = {
				user: {
					findFirst: jest.fn().mockResolvedValue(null),
					create: jest.fn().mockResolvedValue(mockCreatedUser),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			await createUserService({
				name: '  John Doe  ',
				email: '  JOHN@EXAMPLE.COM  ',
				password: 'password123',
			})

			expect(mockTx.user.findFirst).toHaveBeenCalledWith({
				where: { email: 'john@example.com' },
				select: { id: true },
			})

			expect(mockTx.user.create).toHaveBeenCalledWith({
				data: {
					name: 'John Doe',
					email: 'john@example.com',
					password: 'hashedpassword123',
					isVerified: false,
					isActive: true,
				},
				select: expect.any(Object),
			})
		})

		it('should throw ValidationError for missing name', async () => {
			await expect(
				createUserService({ name: '', email: 'john@example.com', password: 'password123' }),
			).rejects.toThrow(ValidationError)
			await expect(
				createUserService({ name: '   ', email: 'john@example.com', password: 'password123' }),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name type', async () => {
			await expect(
				createUserService({ name: undefined as any, email: 'john@example.com', password: 'password123' }),
			).rejects.toThrow(ValidationError)
			await expect(
				createUserService({ name: null as any, email: 'john@example.com', password: 'password123' }),
			).rejects.toThrow(ValidationError)
			await expect(
				createUserService({ name: 123 as any, email: 'john@example.com', password: 'password123' }),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for name length constraints', async () => {
			await expect(
				createUserService({ name: 'a', email: 'john@example.com', password: 'password123' }),
			).rejects.toThrow(ValidationError)
			await expect(
				createUserService({ name: 'a'.repeat(51), email: 'john@example.com', password: 'password123' }),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name pattern', async () => {
			await expect(
				createUserService({ name: 'John@Doe', email: 'john@example.com', password: 'password123' }),
			).rejects.toThrow(ValidationError)
			await expect(
				createUserService({ name: 'John#Doe', email: 'john@example.com', password: 'password123' }),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for missing email', async () => {
			await expect(createUserService({ name: 'John Doe', email: '', password: 'password123' })).rejects.toThrow(
				ValidationError,
			)
			await expect(
				createUserService({ name: 'John Doe', email: '   ', password: 'password123' }),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid email format', async () => {
			await expect(
				createUserService({ name: 'John Doe', email: 'invalid-email', password: 'password123' }),
			).rejects.toThrow(ValidationError)
			await expect(
				createUserService({ name: 'John Doe', email: '@example.com', password: 'password123' }),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid password', async () => {
			await expect(
				createUserService({ name: 'John Doe', email: 'john@example.com', password: '' }),
			).rejects.toThrow(ValidationError)
			await expect(
				createUserService({ name: 'John Doe', email: 'john@example.com', password: '123' }),
			).rejects.toThrow(ValidationError)
		})

		it('should throw BusinessLogicError when email already exists', async () => {
			const mockTx = {
				user: {
					findFirst: jest.fn().mockResolvedValue({ id: 1 }),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			await expect(
				createUserService({
					name: 'John Doe',
					email: 'john@example.com',
					password: 'password123',
				}),
			).rejects.toThrow(BusinessLogicError)
		})

		it('should handle Prisma unique constraint violation', async () => {
			const mockTx = {
				user: {
					findFirst: jest.fn().mockResolvedValue(null),
					create: jest
						.fn()
						.mockRejectedValue(Object.assign(new Error('Unique constraint violation'), { code: 'P2002' })),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			await expect(
				createUserService({
					name: 'John Doe',
					email: 'john@example.com',
					password: 'password123',
				}),
			).rejects.toThrow(BusinessLogicError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(
				createUserService({
					name: 'John Doe',
					email: 'john@example.com',
					password: 'password123',
				}),
			).rejects.toThrow('Failed to create user: Database error')
		})
	})

	describe('updateUserService', () => {
		const mockUpdatedUser = {
			id: 1,
			name: 'Updated John',
			email: 'updated@example.com',
			googleId: null,
			githubId: null,
			discordId: null,
			avatarPath: '/new-avatar.jpg',
			isVerified: true,
			isActive: true,
			lastLoginAt: new Date('2023-01-01T00:00:00.000Z'),
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-02T00:00:00.000Z'),
		}

		beforeEach(() => {
			mockBcrypt.hash.mockResolvedValue('newhashedpassword' as never)
		})

		it('should update a user with all fields', async () => {
			mockPrisma.user.findFirst.mockResolvedValue(null)
			mockPrisma.user.update.mockResolvedValue(mockUpdatedUser)

			const result = await updateUserService({
				id: 1,
				name: 'Updated John',
				email: 'updated@example.com',
				password: 'newpassword123',
				isVerified: true,
				isActive: true,
				avatarPath: '/new-avatar.jpg',
			})

			expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
				where: { email: 'updated@example.com', id: { not: 1 } },
				select: { id: true },
			})

			expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword123', 12)

			expect(mockPrisma.user.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: 'Updated John',
					email: 'updated@example.com',
					password: 'newhashedpassword',
					isVerified: true,
					isActive: true,
					avatarPath: '/new-avatar.jpg',
				},
				select: expect.any(Object),
			})

			expect(result).toEqual({
				id: 1,
				name: 'Updated John',
				email: 'updated@example.com',
				googleId: undefined,
				githubId: undefined,
				discordId: undefined,
				avatarPath: '/new-avatar.jpg',
				isVerified: true,
				isActive: true,
				lastLoginAt: '2023-01-01T00:00:00.000Z',
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-02T00:00:00.000Z',
			})
		})

		it('should update with partial data', async () => {
			mockPrisma.user.update.mockResolvedValue(mockUpdatedUser)

			await updateUserService({ id: 1, name: 'Updated John' })

			expect(mockPrisma.user.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { name: 'Updated John' },
				select: expect.any(Object),
			})
		})

		it('should return null when user not found', async () => {
			const notFoundError = Object.assign(new Error('Record not found'), { code: 'P2025' })
			mockPrisma.user.update.mockRejectedValue(notFoundError)

			const result = await updateUserService({ id: 999, name: 'Nonexistent User' })

			expect(result).toBeNull()
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(updateUserService({ id: 0, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateUserService({ id: -1, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateUserService({ id: 1.5, name: 'Test' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name', async () => {
			await expect(updateUserService({ id: 1, name: '' })).rejects.toThrow(ValidationError)
			await expect(updateUserService({ id: 1, name: 'a' })).rejects.toThrow(ValidationError)
			await expect(updateUserService({ id: 1, name: 'a'.repeat(51) })).rejects.toThrow(ValidationError)
			await expect(updateUserService({ id: 1, name: 'John@Doe' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid email', async () => {
			await expect(updateUserService({ id: 1, email: '' })).rejects.toThrow(ValidationError)
			await expect(updateUserService({ id: 1, email: 'invalid-email' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid password', async () => {
			await expect(updateUserService({ id: 1, password: 'short' })).rejects.toThrow(ValidationError)
		})

		it('should throw BusinessLogicError when email already exists for different user', async () => {
			mockPrisma.user.findFirst.mockResolvedValue({ id: 2 })

			await expect(updateUserService({ id: 1, email: 'existing@example.com' })).rejects.toThrow(
				BusinessLogicError,
			)
		})

		it('should handle Prisma unique constraint violation', async () => {
			mockPrisma.user.findFirst.mockResolvedValue(null)
			const constraintError = Object.assign(new Error('Unique constraint violation'), { code: 'P2002' })
			mockPrisma.user.update.mockRejectedValue(constraintError)

			await expect(updateUserService({ id: 1, email: 'test@example.com' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle database errors', async () => {
			mockPrisma.user.findFirst.mockResolvedValue(null)
			mockPrisma.user.update.mockRejectedValue(new Error('Database error'))

			await expect(updateUserService({ id: 1, name: 'Test' })).rejects.toThrow(
				'Failed to update user: Database error',
			)
		})
	})

	describe('deleteUserService', () => {
		it('should delete a user successfully', async () => {
			const mockTx = {
				user: {
					findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'John Doe', email: 'john@example.com' }),
					delete: jest.fn().mockResolvedValue(undefined),
				},
				character: { count: jest.fn().mockResolvedValue(0) },
				image: { count: jest.fn().mockResolvedValue(0) },
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await deleteUserService(1)

			expect(mockTx.user.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true, name: true, email: true },
			})

			expect(mockTx.user.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			})
		})

		it('should throw EntityNotFoundError when user does not exist', async () => {
			const mockTx = {
				user: {
					findUnique: jest.fn().mockResolvedValue(null),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(deleteUserService(999)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw BusinessLogicError when user has associated data', async () => {
			const mockTx = {
				user: {
					findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'John Doe', email: 'john@example.com' }),
				},
				character: { count: jest.fn().mockResolvedValue(2) },
				image: { count: jest.fn().mockResolvedValue(1) },
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(deleteUserService(1)).rejects.toThrow(BusinessLogicError)
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(deleteUserService(0)).rejects.toThrow(ValidationError)
			await expect(deleteUserService(-1)).rejects.toThrow(ValidationError)
			await expect(deleteUserService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(deleteUserService(1)).rejects.toThrow('Failed to delete user: Database error')
		})
	})

	describe('checkUserEmailExistsService', () => {
		it('should return true when email exists', async () => {
			mockPrisma.user.findFirst.mockResolvedValue({ id: 1 })

			const result = await checkUserEmailExistsService('john@example.com')

			expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
				where: { email: 'john@example.com' },
				select: { id: true },
			})

			expect(result).toBe(true)
		})

		it('should return false when email does not exist', async () => {
			mockPrisma.user.findFirst.mockResolvedValue(null)

			const result = await checkUserEmailExistsService('nonexistent@example.com')

			expect(result).toBe(false)
		})

		it('should exclude specific id when provided', async () => {
			mockPrisma.user.findFirst.mockResolvedValue(null)

			await checkUserEmailExistsService('john@example.com', 1)

			expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
				where: { email: 'john@example.com', id: { not: 1 } },
				select: { id: true },
			})
		})

		it('should trim and normalize email before checking', async () => {
			mockPrisma.user.findFirst.mockResolvedValue(null)

			await checkUserEmailExistsService('  JOHN@EXAMPLE.COM  ')

			expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
				where: { email: 'john@example.com' },
				select: { id: true },
			})
		})

		it('should throw ValidationError for invalid email', async () => {
			await expect(checkUserEmailExistsService('')).rejects.toThrow(ValidationError)
			await expect(checkUserEmailExistsService('   ')).rejects.toThrow(ValidationError)
			await expect(checkUserEmailExistsService(null as any)).rejects.toThrow(ValidationError)
			await expect(checkUserEmailExistsService(undefined as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid excludeId', async () => {
			await expect(checkUserEmailExistsService('john@example.com', 0)).rejects.toThrow(ValidationError)
			await expect(checkUserEmailExistsService('john@example.com', -1)).rejects.toThrow(ValidationError)
			await expect(checkUserEmailExistsService('john@example.com', 1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.user.findFirst.mockRejectedValue(new Error('Database error'))

			await expect(checkUserEmailExistsService('john@example.com')).rejects.toThrow(
				'Failed to check user email existence: Database error',
			)
		})
	})

	describe('verifyUserPasswordService', () => {
		const mockUser = {
			id: 1,
			name: 'John Doe',
			email: 'john@example.com',
			password: 'hashedpassword',
			googleId: null,
			githubId: null,
			discordId: null,
			avatarPath: null,
			isVerified: true,
			isActive: true,
			lastLoginAt: new Date('2023-01-01T00:00:00.000Z'),
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
		}

		beforeEach(() => {
			mockBcrypt.compare.mockResolvedValue(true as never)
		})

		it('should verify password and return user', async () => {
			mockPrisma.user.findFirst.mockResolvedValue(mockUser)
			mockPrisma.user.update.mockResolvedValue(undefined)

			const result = await verifyUserPasswordService('john@example.com', 'password123')

			expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
				where: { email: 'john@example.com', isActive: true },
				select: expect.objectContaining({
					password: true,
				}),
			})

			expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword')

			expect(mockPrisma.user.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { lastLoginAt: expect.any(Date) },
			})

			expect(result).toEqual(
				expect.objectContaining({
					id: 1,
					name: 'John Doe',
					email: 'john@example.com',
				}),
			)
		})

		it('should return null when user not found', async () => {
			mockPrisma.user.findFirst.mockResolvedValue(null)

			const result = await verifyUserPasswordService('nonexistent@example.com', 'password123')

			expect(result).toBeNull()
		})

		it('should return null when user has no password (OAuth user)', async () => {
			mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, password: null })

			const result = await verifyUserPasswordService('john@example.com', 'password123')

			expect(result).toBeNull()
		})

		it('should return null when password is invalid', async () => {
			mockPrisma.user.findFirst.mockResolvedValue(mockUser)
			mockBcrypt.compare.mockResolvedValue(false as never)

			const result = await verifyUserPasswordService('john@example.com', 'wrongpassword')

			expect(result).toBeNull()
		})

		it('should throw ValidationError for invalid input', async () => {
			await expect(verifyUserPasswordService('', 'password123')).rejects.toThrow(ValidationError)
			await expect(verifyUserPasswordService('john@example.com', '')).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.user.findFirst.mockRejectedValue(new Error('Database error'))

			await expect(verifyUserPasswordService('john@example.com', 'password123')).rejects.toThrow(
				'Failed to verify user password: Database error',
			)
		})
	})

	describe('updateUserLastLoginService', () => {
		it('should update user last login timestamp', async () => {
			mockPrisma.user.update.mockResolvedValue({ id: 1 })

			await updateUserLastLoginService(1)

			expect(mockPrisma.user.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { lastLoginAt: expect.any(Date) },
				select: { id: true },
			})
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(updateUserLastLoginService(0)).rejects.toThrow(ValidationError)
			await expect(updateUserLastLoginService(-1)).rejects.toThrow(ValidationError)
			await expect(updateUserLastLoginService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should throw EntityNotFoundError when user not found', async () => {
			const notFoundError = Object.assign(new Error('Record not found'), { code: 'P2025' })
			mockPrisma.user.update.mockRejectedValue(notFoundError)

			await expect(updateUserLastLoginService(999)).rejects.toThrow(EntityNotFoundError)
		})

		it('should handle database errors', async () => {
			mockPrisma.user.update.mockRejectedValue(new Error('Database error'))

			await expect(updateUserLastLoginService(1)).rejects.toThrow(
				'Failed to update user last login: Database error',
			)
		})
	})
})
