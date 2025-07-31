import {
	createUserController,
	deleteUserController,
	getUserController,
	getUsersController,
	updateUserController,
} from '../src/controllers/users.controller.js'
import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock services
jest.mock('../src/services/users.service.js', () => ({
	getUsersService: jest.fn(),
	getUserService: jest.fn(),
	createUserService: jest.fn(),
	updateUserService: jest.fn(),
	deleteUserService: jest.fn(),
}))

import {
	createUserService,
	deleteUserService,
	getUserService,
	getUsersService,
	updateUserService,
} from '../src/services/users.service.js'

// Mock Fastify objects
const createMockRequest = (overrides = {}) =>
	({
		log: {
			error: jest.fn(),
		},
		query: {},
		params: {},
		body: {},
		...overrides,
	}) as any

const createMockReply = () => {
	const reply = {
		status: jest.fn().mockReturnThis(),
		send: jest.fn().mockReturnThis(),
	}

	return reply as any
}

describe('Users Controller', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getUsersController', () => {
		const mockUsersResult = {
			data: [
				{
					id: 1,
					name: 'John Doe',
					email: 'john@example.com',
					isVerified: true,
					isActive: true,
					avatarPath: undefined,
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
				{
					id: 2,
					name: 'Jane Smith',
					email: 'jane@example.com',
					isVerified: false,
					isActive: true,
					avatarPath: '/avatars/jane.jpg',
					createdAt: '2024-01-02T00:00:00.000Z',
					updatedAt: '2024-01-02T00:00:00.000Z',
				},
			],
			pagination: {
				page: 1,
				pageSize: 10,
				total: 2,
				totalPages: 1,
			},
		}

		it('should return paginated users successfully', async () => {
			const mockGetUsersService = jest.mocked(getUsersService)
			mockGetUsersService.mockResolvedValue(mockUsersResult)

			const request = createMockRequest({
				query: { page: 1, pageSize: 10 },
			})
			const reply = createMockReply()

			await getUsersController(request, reply)

			expect(mockGetUsersService).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockUsersResult.data,
				pagination: mockUsersResult.pagination,
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetUsersService = jest.mocked(getUsersService)
			const validationError = new ValidationError('Page number must be greater than 0')
			mockGetUsersService.mockRejectedValue(validationError)

			const request = createMockRequest({
				query: { page: 0 },
			})
			const reply = createMockReply()

			await getUsersController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Page number must be greater than 0',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetUsersService = jest.mocked(getUsersService)
			mockGetUsersService.mockRejectedValue(new Error('Database connection failed'))

			const request = createMockRequest()
			const reply = createMockReply()

			await getUsersController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('getUserController', () => {
		const mockUser = {
			id: 1,
			name: 'John Doe',
			email: 'john@example.com',
			isVerified: true,
			isActive: true,
			avatarPath: undefined,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		it('should return a user successfully', async () => {
			const mockGetUserService = jest.mocked(getUserService)
			mockGetUserService.mockResolvedValue(mockUser)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getUserController(request, reply)

			expect(mockGetUserService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockUser,
			})
		})

		it('should return 404 when user not found', async () => {
			const mockGetUserService = jest.mocked(getUserService)
			mockGetUserService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await getUserController(request, reply)

			expect(mockGetUserService).toHaveBeenCalledWith(999)
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'User not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await getUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'User ID must be a positive integer',
			})
		})

		it('should return 400 for negative ID', async () => {
			const request = createMockRequest({
				params: { id: '-1' },
			})
			const reply = createMockReply()

			await getUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'User ID must be a positive integer',
			})
		})

		it('should return 400 for zero ID', async () => {
			const request = createMockRequest({
				params: { id: '0' },
			})
			const reply = createMockReply()

			await getUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'User ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetUserService = jest.mocked(getUserService)
			const validationError = new ValidationError('Service validation error')
			mockGetUserService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Service validation error',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetUserService = jest.mocked(getUserService)
			mockGetUserService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getUserController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('createUserController', () => {
		const mockCreatedUser = {
			id: 1,
			name: 'John Doe',
			email: 'john@example.com',
			isVerified: false,
			isActive: true,
			avatarPath: undefined,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		it('should create a user successfully', async () => {
			const mockCreateUserService = jest.mocked(createUserService)
			mockCreateUserService.mockResolvedValue(mockCreatedUser)

			const request = createMockRequest({
				body: {
					name: 'John Doe',
					email: 'john@example.com',
					password: 'password123',
				},
			})
			const reply = createMockReply()

			await createUserController(request, reply)

			expect(mockCreateUserService).toHaveBeenCalledWith({
				name: 'John Doe',
				email: 'john@example.com',
				password: 'password123',
			})
			expect(reply.status).toHaveBeenCalledWith(201)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockCreatedUser,
				message: 'User created successfully',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockCreateUserService = jest.mocked(createUserService)
			const validationError = new ValidationError('Email is required')
			mockCreateUserService.mockRejectedValue(validationError)

			const request = createMockRequest({
				body: { name: 'John Doe', password: 'password123' },
			})
			const reply = createMockReply()

			await createUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Email is required',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockCreateUserService = jest.mocked(createUserService)
			const businessError = new BusinessLogicError('User with email "john@example.com" already exists')
			mockCreateUserService.mockRejectedValue(businessError)

			const request = createMockRequest({
				body: {
					name: 'John Doe',
					email: 'john@example.com',
					password: 'password123',
				},
			})
			const reply = createMockReply()

			await createUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'User with email "john@example.com" already exists',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockCreateUserService = jest.mocked(createUserService)
			mockCreateUserService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				body: {
					name: 'John Doe',
					email: 'john@example.com',
					password: 'password123',
				},
			})
			const reply = createMockReply()

			await createUserController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('updateUserController', () => {
		const mockUpdatedUser = {
			id: 1,
			name: 'John Updated',
			email: 'john.updated@example.com',
			isVerified: true,
			isActive: true,
			avatarPath: '/avatars/john.jpg',
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-02T00:00:00.000Z',
		}

		it('should update a user successfully', async () => {
			const mockUpdateUserService = jest.mocked(updateUserService)
			mockUpdateUserService.mockResolvedValue(mockUpdatedUser)

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'John Updated', email: 'john.updated@example.com' },
			})
			const reply = createMockReply()

			await updateUserController(request, reply)

			expect(mockUpdateUserService).toHaveBeenCalledWith({
				id: 1,
				name: 'John Updated',
				email: 'john.updated@example.com',
			})
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockUpdatedUser,
				message: 'User updated successfully',
			})
		})

		it('should return 404 when user not found', async () => {
			const mockUpdateUserService = jest.mocked(updateUserService)
			mockUpdateUserService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
				body: { name: 'Updated Name' },
			})
			const reply = createMockReply()

			await updateUserController(request, reply)

			expect(mockUpdateUserService).toHaveBeenCalledWith({
				id: 999,
				name: 'Updated Name',
			})
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'User not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
				body: { name: 'Updated Name' },
			})
			const reply = createMockReply()

			await updateUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'User ID must be a positive integer',
			})
		})

		it('should handle empty body (partial update)', async () => {
			const mockUpdateUserService = jest.mocked(updateUserService)
			mockUpdateUserService.mockResolvedValue(mockUpdatedUser)

			const request = createMockRequest({
				params: { id: '1' },
				body: {},
			})
			const reply = createMockReply()

			await updateUserController(request, reply)

			expect(mockUpdateUserService).toHaveBeenCalledWith({ id: 1 })
			expect(reply.status).toHaveBeenCalledWith(200)
		})

		it('should handle ValidationError from service', async () => {
			const mockUpdateUserService = jest.mocked(updateUserService)
			const validationError = new ValidationError('Invalid email format')
			mockUpdateUserService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { email: 'invalid-email' },
			})
			const reply = createMockReply()

			await updateUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Invalid email format',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockUpdateUserService = jest.mocked(updateUserService)
			const businessError = new BusinessLogicError('Email already exists')
			mockUpdateUserService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { email: 'existing@example.com' },
			})
			const reply = createMockReply()

			await updateUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Email already exists',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockUpdateUserService = jest.mocked(updateUserService)
			mockUpdateUserService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'Updated Name' },
			})
			const reply = createMockReply()

			await updateUserController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('deleteUserController', () => {
		it('should delete a user successfully', async () => {
			const mockDeleteUserService = jest.mocked(deleteUserService)
			mockDeleteUserService.mockResolvedValue()

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteUserController(request, reply)

			expect(mockDeleteUserService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				message: 'User deleted successfully',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await deleteUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'User ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockDeleteUserService = jest.mocked(deleteUserService)
			const validationError = new ValidationError('User ID must be a positive integer')
			mockDeleteUserService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'User ID must be a positive integer',
			})
		})

		it('should handle EntityNotFoundError from service', async () => {
			const mockDeleteUserService = jest.mocked(deleteUserService)
			const entityError = new EntityNotFoundError('User', 999)
			mockDeleteUserService.mockRejectedValue(entityError)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await deleteUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: entityError.message,
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockDeleteUserService = jest.mocked(deleteUserService)
			const businessError = new BusinessLogicError('Cannot delete user as they have associated characters')
			mockDeleteUserService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteUserController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot delete user as they have associated characters',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockDeleteUserService = jest.mocked(deleteUserService)
			mockDeleteUserService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteUserController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})
})
