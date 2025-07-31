import {
	createArchetypeController,
	deleteArchetypeController,
	getArchetypeController,
	getArchetypesController,
	updateArchetypeController,
} from '../src/controllers/archetypes.controller.js'
import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock services
jest.mock('../src/services/archetypes.service.js', () => ({
	getArchetypesService: jest.fn(),
	getArchetypeService: jest.fn(),
	createArchetypeService: jest.fn(),
	updateArchetypeService: jest.fn(),
	deleteArchetypeService: jest.fn(),
}))

import {
	createArchetypeService,
	deleteArchetypeService,
	getArchetypeService,
	getArchetypesService,
	updateArchetypeService,
} from '../src/services/archetypes.service.js'

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

describe('Archetypes Controller', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getArchetypesController', () => {
		const mockArchetypesResult = {
			data: [
				{
					id: 1,
					name: 'Warrior',
					description: 'A skilled fighter',
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
				{
					id: 2,
					name: 'Mage',
					description: 'A master of magic',
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

		it('should return paginated archetypes successfully', async () => {
			const mockGetArchetypesService = jest.mocked(getArchetypesService)
			mockGetArchetypesService.mockResolvedValue(mockArchetypesResult)

			const request = createMockRequest({
				query: { page: 1, pageSize: 10 },
			})
			const reply = createMockReply()

			await getArchetypesController(request, reply)

			expect(mockGetArchetypesService).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockArchetypesResult.data,
				pagination: mockArchetypesResult.pagination,
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetArchetypesService = jest.mocked(getArchetypesService)
			const validationError = new ValidationError('Page number must be greater than 0')
			mockGetArchetypesService.mockRejectedValue(validationError)

			const request = createMockRequest({
				query: { page: 0 },
			})
			const reply = createMockReply()

			await getArchetypesController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Page number must be greater than 0',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetArchetypesService = jest.mocked(getArchetypesService)
			mockGetArchetypesService.mockRejectedValue(new Error('Database connection failed'))

			const request = createMockRequest()
			const reply = createMockReply()

			await getArchetypesController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('getArchetypeController', () => {
		const mockArchetype = {
			id: 1,
			name: 'Warrior',
			description: 'A skilled fighter',
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		it('should return an archetype successfully', async () => {
			const mockGetArchetypeService = jest.mocked(getArchetypeService)
			mockGetArchetypeService.mockResolvedValue(mockArchetype)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getArchetypeController(request, reply)

			expect(mockGetArchetypeService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockArchetype,
			})
		})

		it('should return 404 when archetype not found', async () => {
			const mockGetArchetypeService = jest.mocked(getArchetypeService)
			mockGetArchetypeService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await getArchetypeController(request, reply)

			expect(mockGetArchetypeService).toHaveBeenCalledWith(999)
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await getArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype ID must be a positive integer',
			})
		})

		it('should return 400 for negative ID', async () => {
			const request = createMockRequest({
				params: { id: '-1' },
			})
			const reply = createMockReply()

			await getArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype ID must be a positive integer',
			})
		})

		it('should return 400 for zero ID', async () => {
			const request = createMockRequest({
				params: { id: '0' },
			})
			const reply = createMockReply()

			await getArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetArchetypeService = jest.mocked(getArchetypeService)
			const validationError = new ValidationError('Service validation error')
			mockGetArchetypeService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Service validation error',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetArchetypeService = jest.mocked(getArchetypeService)
			mockGetArchetypeService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getArchetypeController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('createArchetypeController', () => {
		const mockCreatedArchetype = {
			id: 1,
			name: 'Warrior',
			description: 'A skilled fighter',
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		it('should create an archetype successfully', async () => {
			const mockCreateArchetypeService = jest.mocked(createArchetypeService)
			mockCreateArchetypeService.mockResolvedValue(mockCreatedArchetype)

			const request = createMockRequest({
				body: { name: 'Warrior', description: 'A skilled fighter' },
			})
			const reply = createMockReply()

			await createArchetypeController(request, reply)

			expect(mockCreateArchetypeService).toHaveBeenCalledWith({
				name: 'Warrior',
				description: 'A skilled fighter',
			})
			expect(reply.status).toHaveBeenCalledWith(201)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockCreatedArchetype,
				message: 'Archetype created successfully',
			})
		})

		it('should create an archetype without description', async () => {
			const mockCreatedArchetype = {
				id: 1,
				name: 'Warrior',
				description: undefined,
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-01-01T00:00:00.000Z',
			}

			const mockCreateArchetypeService = jest.mocked(createArchetypeService)
			mockCreateArchetypeService.mockResolvedValue(mockCreatedArchetype)

			const request = createMockRequest({
				body: { name: 'Warrior' },
			})
			const reply = createMockReply()

			await createArchetypeController(request, reply)

			expect(mockCreateArchetypeService).toHaveBeenCalledWith({ name: 'Warrior' })
			expect(reply.status).toHaveBeenCalledWith(201)
		})

		it('should handle ValidationError from service', async () => {
			const mockCreateArchetypeService = jest.mocked(createArchetypeService)
			const validationError = new ValidationError('Archetype name cannot be empty')
			mockCreateArchetypeService.mockRejectedValue(validationError)

			const request = createMockRequest({
				body: { name: '' },
			})
			const reply = createMockReply()

			await createArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype name cannot be empty',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockCreateArchetypeService = jest.mocked(createArchetypeService)
			const businessError = new BusinessLogicError('Archetype with name "Warrior" already exists')
			mockCreateArchetypeService.mockRejectedValue(businessError)

			const request = createMockRequest({
				body: { name: 'Warrior' },
			})
			const reply = createMockReply()

			await createArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype with name "Warrior" already exists',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockCreateArchetypeService = jest.mocked(createArchetypeService)
			mockCreateArchetypeService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				body: { name: 'Warrior' },
			})
			const reply = createMockReply()

			await createArchetypeController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('updateArchetypeController', () => {
		const mockUpdatedArchetype = {
			id: 1,
			name: 'Updated Warrior',
			description: 'An updated skilled fighter',
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-02T00:00:00.000Z',
		}

		it('should update an archetype successfully', async () => {
			const mockUpdateArchetypeService = jest.mocked(updateArchetypeService)
			mockUpdateArchetypeService.mockResolvedValue(mockUpdatedArchetype)

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'Updated Warrior', description: 'An updated skilled fighter' },
			})
			const reply = createMockReply()

			await updateArchetypeController(request, reply)

			expect(mockUpdateArchetypeService).toHaveBeenCalledWith({
				id: 1,
				name: 'Updated Warrior',
				description: 'An updated skilled fighter',
			})
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockUpdatedArchetype,
				message: 'Archetype updated successfully',
			})
		})

		it('should return 404 when archetype not found', async () => {
			const mockUpdateArchetypeService = jest.mocked(updateArchetypeService)
			mockUpdateArchetypeService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
				body: { name: 'Updated Archetype' },
			})
			const reply = createMockReply()

			await updateArchetypeController(request, reply)

			expect(mockUpdateArchetypeService).toHaveBeenCalledWith({
				id: 999,
				name: 'Updated Archetype',
			})
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
				body: { name: 'Updated Archetype' },
			})
			const reply = createMockReply()

			await updateArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype ID must be a positive integer',
			})
		})

		it('should handle empty body (partial update)', async () => {
			const mockUpdateArchetypeService = jest.mocked(updateArchetypeService)
			mockUpdateArchetypeService.mockResolvedValue(mockUpdatedArchetype)

			const request = createMockRequest({
				params: { id: '1' },
				body: {},
			})
			const reply = createMockReply()

			await updateArchetypeController(request, reply)

			expect(mockUpdateArchetypeService).toHaveBeenCalledWith({ id: 1 })
			expect(reply.status).toHaveBeenCalledWith(200)
		})

		it('should handle ValidationError from service', async () => {
			const mockUpdateArchetypeService = jest.mocked(updateArchetypeService)
			const validationError = new ValidationError('Archetype name cannot be empty')
			mockUpdateArchetypeService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: '' },
			})
			const reply = createMockReply()

			await updateArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype name cannot be empty',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockUpdateArchetypeService = jest.mocked(updateArchetypeService)
			const businessError = new BusinessLogicError('Archetype with name "Existing" already exists')
			mockUpdateArchetypeService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'Existing' },
			})
			const reply = createMockReply()

			await updateArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype with name "Existing" already exists',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockUpdateArchetypeService = jest.mocked(updateArchetypeService)
			mockUpdateArchetypeService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'Updated Archetype' },
			})
			const reply = createMockReply()

			await updateArchetypeController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('deleteArchetypeController', () => {
		it('should delete an archetype successfully', async () => {
			const mockDeleteArchetypeService = jest.mocked(deleteArchetypeService)
			mockDeleteArchetypeService.mockResolvedValue()

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteArchetypeController(request, reply)

			expect(mockDeleteArchetypeService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				message: 'Archetype deleted successfully',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await deleteArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockDeleteArchetypeService = jest.mocked(deleteArchetypeService)
			const validationError = new ValidationError('Archetype ID must be a positive integer')
			mockDeleteArchetypeService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Archetype ID must be a positive integer',
			})
		})

		it('should handle EntityNotFoundError from service', async () => {
			const mockDeleteArchetypeService = jest.mocked(deleteArchetypeService)
			const entityError = new EntityNotFoundError('Archetype', 999)
			mockDeleteArchetypeService.mockRejectedValue(entityError)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await deleteArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: entityError.message,
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockDeleteArchetypeService = jest.mocked(deleteArchetypeService)
			const businessError = new BusinessLogicError(
				'Cannot delete archetype "Warrior" as it is being used by 5 characters',
			)
			mockDeleteArchetypeService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteArchetypeController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot delete archetype "Warrior" as it is being used by 5 characters',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockDeleteArchetypeService = jest.mocked(deleteArchetypeService)
			mockDeleteArchetypeService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteArchetypeController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})
})
