import {
	createTagController,
	deleteTagController,
	getTagController,
	getTagsController,
	updateTagController,
} from '../src/controllers/tags.controller.js'
import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock services
jest.mock('../src/services/tags.service.js', () => ({
	getTagsService: jest.fn(),
	getTagService: jest.fn(),
	createTagService: jest.fn(),
	updateTagService: jest.fn(),
	deleteTagService: jest.fn(),
}))

import {
	createTagService,
	deleteTagService,
	getTagService,
	getTagsService,
	updateTagService,
} from '../src/services/tags.service.js'

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

describe('Tags Controller', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getTagsController', () => {
		const mockTagsResult = {
			data: [
				{
					id: 1,
					name: 'Adventure',
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
				{
					id: 2,
					name: 'Fantasy',
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

		it('should return paginated tags successfully', async () => {
			const mockGetTagsService = jest.mocked(getTagsService)
			mockGetTagsService.mockResolvedValue(mockTagsResult)

			const request = createMockRequest({
				query: { page: 1, pageSize: 10 },
			})
			const reply = createMockReply()

			await getTagsController(request, reply)

			expect(mockGetTagsService).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockTagsResult.data,
				pagination: mockTagsResult.pagination,
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetTagsService = jest.mocked(getTagsService)
			const validationError = new ValidationError('Page number must be greater than 0')
			mockGetTagsService.mockRejectedValue(validationError)

			const request = createMockRequest({
				query: { page: 0 },
			})
			const reply = createMockReply()

			await getTagsController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Page number must be greater than 0',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetTagsService = jest.mocked(getTagsService)
			mockGetTagsService.mockRejectedValue(new Error('Database connection failed'))

			const request = createMockRequest()
			const reply = createMockReply()

			await getTagsController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('getTagController', () => {
		const mockTag = {
			id: 1,
			name: 'Adventure',
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		it('should return a tag successfully', async () => {
			const mockGetTagService = jest.mocked(getTagService)
			mockGetTagService.mockResolvedValue(mockTag)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getTagController(request, reply)

			expect(mockGetTagService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockTag,
			})
		})

		it('should return 404 when tag not found', async () => {
			const mockGetTagService = jest.mocked(getTagService)
			mockGetTagService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await getTagController(request, reply)

			expect(mockGetTagService).toHaveBeenCalledWith(999)
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await getTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag ID must be a positive integer',
			})
		})

		it('should return 400 for negative ID', async () => {
			const request = createMockRequest({
				params: { id: '-1' },
			})
			const reply = createMockReply()

			await getTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag ID must be a positive integer',
			})
		})

		it('should return 400 for zero ID', async () => {
			const request = createMockRequest({
				params: { id: '0' },
			})
			const reply = createMockReply()

			await getTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetTagService = jest.mocked(getTagService)
			const validationError = new ValidationError('Service validation error')
			mockGetTagService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Service validation error',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetTagService = jest.mocked(getTagService)
			mockGetTagService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getTagController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('createTagController', () => {
		const mockCreatedTag = {
			id: 1,
			name: 'Adventure',
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		it('should create a tag successfully', async () => {
			const mockCreateTagService = jest.mocked(createTagService)
			mockCreateTagService.mockResolvedValue(mockCreatedTag)

			const request = createMockRequest({
				body: { name: 'Adventure' },
			})
			const reply = createMockReply()

			await createTagController(request, reply)

			expect(mockCreateTagService).toHaveBeenCalledWith({ name: 'Adventure' })
			expect(reply.status).toHaveBeenCalledWith(201)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockCreatedTag,
				message: 'Tag created successfully',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockCreateTagService = jest.mocked(createTagService)
			const validationError = new ValidationError('Tag name cannot be empty')
			mockCreateTagService.mockRejectedValue(validationError)

			const request = createMockRequest({
				body: { name: '' },
			})
			const reply = createMockReply()

			await createTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag name cannot be empty',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockCreateTagService = jest.mocked(createTagService)
			const businessError = new BusinessLogicError('Tag with name "Adventure" already exists')
			mockCreateTagService.mockRejectedValue(businessError)

			const request = createMockRequest({
				body: { name: 'Adventure' },
			})
			const reply = createMockReply()

			await createTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag with name "Adventure" already exists',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockCreateTagService = jest.mocked(createTagService)
			mockCreateTagService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				body: { name: 'Adventure' },
			})
			const reply = createMockReply()

			await createTagController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('updateTagController', () => {
		const mockUpdatedTag = {
			id: 1,
			name: 'Updated Adventure',
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-02T00:00:00.000Z',
		}

		it('should update a tag successfully', async () => {
			const mockUpdateTagService = jest.mocked(updateTagService)
			mockUpdateTagService.mockResolvedValue(mockUpdatedTag)

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'Updated Adventure' },
			})
			const reply = createMockReply()

			await updateTagController(request, reply)

			expect(mockUpdateTagService).toHaveBeenCalledWith({
				id: 1,
				name: 'Updated Adventure',
			})
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockUpdatedTag,
				message: 'Tag updated successfully',
			})
		})

		it('should return 404 when tag not found', async () => {
			const mockUpdateTagService = jest.mocked(updateTagService)
			mockUpdateTagService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
				body: { name: 'Updated Tag' },
			})
			const reply = createMockReply()

			await updateTagController(request, reply)

			expect(mockUpdateTagService).toHaveBeenCalledWith({
				id: 999,
				name: 'Updated Tag',
			})
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
				body: { name: 'Updated Tag' },
			})
			const reply = createMockReply()

			await updateTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag ID must be a positive integer',
			})
		})

		it('should handle empty body (partial update)', async () => {
			const mockUpdateTagService = jest.mocked(updateTagService)
			mockUpdateTagService.mockResolvedValue(mockUpdatedTag)

			const request = createMockRequest({
				params: { id: '1' },
				body: {},
			})
			const reply = createMockReply()

			await updateTagController(request, reply)

			expect(mockUpdateTagService).toHaveBeenCalledWith({ id: 1 })
			expect(reply.status).toHaveBeenCalledWith(200)
		})

		it('should handle ValidationError from service', async () => {
			const mockUpdateTagService = jest.mocked(updateTagService)
			const validationError = new ValidationError('Tag name cannot be empty')
			mockUpdateTagService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: '' },
			})
			const reply = createMockReply()

			await updateTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag name cannot be empty',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockUpdateTagService = jest.mocked(updateTagService)
			const businessError = new BusinessLogicError('Tag with name "Existing" already exists')
			mockUpdateTagService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'Existing' },
			})
			const reply = createMockReply()

			await updateTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag with name "Existing" already exists',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockUpdateTagService = jest.mocked(updateTagService)
			mockUpdateTagService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'Updated Tag' },
			})
			const reply = createMockReply()

			await updateTagController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('deleteTagController', () => {
		it('should delete a tag successfully', async () => {
			const mockDeleteTagService = jest.mocked(deleteTagService)
			mockDeleteTagService.mockResolvedValue()

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteTagController(request, reply)

			expect(mockDeleteTagService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				message: 'Tag deleted successfully',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await deleteTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockDeleteTagService = jest.mocked(deleteTagService)
			const validationError = new ValidationError('Tag ID must be a positive integer')
			mockDeleteTagService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Tag ID must be a positive integer',
			})
		})

		it('should handle EntityNotFoundError from service', async () => {
			const mockDeleteTagService = jest.mocked(deleteTagService)
			const entityError = new EntityNotFoundError('Tag', 999)
			mockDeleteTagService.mockRejectedValue(entityError)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await deleteTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: entityError.message,
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockDeleteTagService = jest.mocked(deleteTagService)
			const businessError = new BusinessLogicError(
				'Cannot delete tag "Adventure" as it is being used by 3 other entities',
			)
			mockDeleteTagService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteTagController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot delete tag "Adventure" as it is being used by 3 other entities',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockDeleteTagService = jest.mocked(deleteTagService)
			mockDeleteTagService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteTagController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})
})
