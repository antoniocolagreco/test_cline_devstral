import { Buffer } from 'node:buffer'

import {
	createImageController,
	deleteImageController,
	getImageController,
	getImagesController,
	updateImageController,
} from '../src/controllers/images.controller.js'
import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock services
jest.mock('../src/services/images.service.js', () => ({
	getImagesService: jest.fn(),
	getImageService: jest.fn(),
	createImageService: jest.fn(),
	updateImageService: jest.fn(),
	deleteImageService: jest.fn(),
}))

import {
	createImageService,
	deleteImageService,
	getImageService,
	getImagesService,
	updateImageService,
} from '../src/services/images.service.js'

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

describe('Images Controller', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getImagesController', () => {
		const mockImagesResult = {
			data: [
				{
					id: 1,
					filename: 'avatar1.jpg',
					size: 102400,
					width: 256,
					height: 256,
					mimeType: 'image/jpeg' as const,
					userId: 1,
					isPublic: true,
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
				{
					id: 2,
					filename: 'background.png',
					size: 512000,
					width: 1024,
					height: 768,
					mimeType: 'image/png' as const,
					userId: 2,
					isPublic: false,
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

		it('should return paginated images successfully', async () => {
			const mockGetImagesService = jest.mocked(getImagesService)
			mockGetImagesService.mockResolvedValue(mockImagesResult)

			const request = createMockRequest({
				query: { page: 1, pageSize: 10 },
			})
			const reply = createMockReply()

			await getImagesController(request, reply)

			expect(mockGetImagesService).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockImagesResult.data,
				pagination: mockImagesResult.pagination,
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetImagesService = jest.mocked(getImagesService)
			const validationError = new ValidationError('Page number must be greater than 0')
			mockGetImagesService.mockRejectedValue(validationError)

			const request = createMockRequest({
				query: { page: 0 },
			})
			const reply = createMockReply()

			await getImagesController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Page number must be greater than 0',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetImagesService = jest.mocked(getImagesService)
			mockGetImagesService.mockRejectedValue(new Error('Database connection failed'))

			const request = createMockRequest()
			const reply = createMockReply()

			await getImagesController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('getImageController', () => {
		const mockImage = {
			id: 1,
			filename: 'avatar1.jpg',
			size: 102400,
			width: 256,
			height: 256,
			mimeType: 'image/jpeg' as const,
			userId: 1,
			isPublic: true,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		it('should return an image successfully', async () => {
			const mockGetImageService = jest.mocked(getImageService)
			mockGetImageService.mockResolvedValue(mockImage)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getImageController(request, reply)

			expect(mockGetImageService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockImage,
			})
		})

		it('should return 404 when image not found', async () => {
			const mockGetImageService = jest.mocked(getImageService)
			mockGetImageService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await getImageController(request, reply)

			expect(mockGetImageService).toHaveBeenCalledWith(999)
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Image not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await getImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Image ID must be a positive integer',
			})
		})

		it('should return 400 for negative ID', async () => {
			const request = createMockRequest({
				params: { id: '-1' },
			})
			const reply = createMockReply()

			await getImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Image ID must be a positive integer',
			})
		})

		it('should return 400 for zero ID', async () => {
			const request = createMockRequest({
				params: { id: '0' },
			})
			const reply = createMockReply()

			await getImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Image ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetImageService = jest.mocked(getImageService)
			const validationError = new ValidationError('Service validation error')
			mockGetImageService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Service validation error',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetImageService = jest.mocked(getImageService)
			mockGetImageService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getImageController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('createImageController', () => {
		const mockCreatedImage = {
			id: 1,
			filename: 'avatar1.jpg',
			size: 102400,
			width: 256,
			height: 256,
			mimeType: 'image/jpeg' as const,
			userId: 1,
			isPublic: true,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		const imageBuffer = Buffer.from('fake-image-data')

		it('should create an image successfully', async () => {
			const mockCreateImageService = jest.mocked(createImageService)
			mockCreateImageService.mockResolvedValue(mockCreatedImage)

			const request = createMockRequest({
				body: {
					filename: 'avatar1.jpg',
					size: 102400,
					width: 256,
					height: 256,
					mimeType: 'image/jpeg',
					userId: 1,
					isPublic: true,
					buffer: imageBuffer,
				},
			})
			const reply = createMockReply()

			await createImageController(request, reply)

			expect(mockCreateImageService).toHaveBeenCalledWith({
				filename: 'avatar1.jpg',
				size: 102400,
				width: 256,
				height: 256,
				mimeType: 'image/jpeg',
				userId: 1,
				isPublic: true,
				buffer: imageBuffer,
			})
			expect(reply.status).toHaveBeenCalledWith(201)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockCreatedImage,
				message: 'Image created successfully',
			})
		})

		it('should create an image with default isPublic', async () => {
			const mockCreateImageService = jest.mocked(createImageService)
			mockCreateImageService.mockResolvedValue({ ...mockCreatedImage, isPublic: false })

			const request = createMockRequest({
				body: {
					filename: 'avatar1.jpg',
					size: 102400,
					width: 256,
					height: 256,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: imageBuffer,
				},
			})
			const reply = createMockReply()

			await createImageController(request, reply)

			expect(mockCreateImageService).toHaveBeenCalledWith({
				filename: 'avatar1.jpg',
				size: 102400,
				width: 256,
				height: 256,
				mimeType: 'image/jpeg',
				userId: 1,
				buffer: imageBuffer,
			})
			expect(reply.status).toHaveBeenCalledWith(201)
		})

		it('should handle ValidationError from service', async () => {
			const mockCreateImageService = jest.mocked(createImageService)
			const validationError = new ValidationError('Filename cannot be empty')
			mockCreateImageService.mockRejectedValue(validationError)

			const request = createMockRequest({
				body: {
					filename: '',
					size: 102400,
					width: 256,
					height: 256,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: imageBuffer,
				},
			})
			const reply = createMockReply()

			await createImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Filename cannot be empty',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockCreateImageService = jest.mocked(createImageService)
			const businessError = new BusinessLogicError('File size exceeds maximum allowed')
			mockCreateImageService.mockRejectedValue(businessError)

			const request = createMockRequest({
				body: {
					filename: 'avatar1.jpg',
					size: 10240000, // 10MB
					width: 256,
					height: 256,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: imageBuffer,
				},
			})
			const reply = createMockReply()

			await createImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'File size exceeds maximum allowed',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockCreateImageService = jest.mocked(createImageService)
			mockCreateImageService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				body: {
					filename: 'avatar1.jpg',
					size: 102400,
					width: 256,
					height: 256,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: imageBuffer,
				},
			})
			const reply = createMockReply()

			await createImageController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('updateImageController', () => {
		const mockUpdatedImage = {
			id: 1,
			filename: 'updated-avatar.jpg',
			size: 204800,
			width: 512,
			height: 512,
			mimeType: 'image/jpeg' as const,
			userId: 1,
			isPublic: false,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-02T00:00:00.000Z',
		}

		it('should update an image successfully', async () => {
			const mockUpdateImageService = jest.mocked(updateImageService)
			mockUpdateImageService.mockResolvedValue(mockUpdatedImage)

			const request = createMockRequest({
				params: { id: '1' },
				body: { filename: 'updated-avatar.jpg', isPublic: false },
			})
			const reply = createMockReply()

			await updateImageController(request, reply)

			expect(mockUpdateImageService).toHaveBeenCalledWith({
				id: 1,
				filename: 'updated-avatar.jpg',
				isPublic: false,
			})
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockUpdatedImage,
				message: 'Image updated successfully',
			})
		})

		it('should return 404 when image not found', async () => {
			const mockUpdateImageService = jest.mocked(updateImageService)
			mockUpdateImageService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
				body: { filename: 'updated.jpg' },
			})
			const reply = createMockReply()

			await updateImageController(request, reply)

			expect(mockUpdateImageService).toHaveBeenCalledWith({
				id: 999,
				filename: 'updated.jpg',
			})
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Image not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
				body: { filename: 'updated.jpg' },
			})
			const reply = createMockReply()

			await updateImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Image ID must be a positive integer',
			})
		})

		it('should handle empty body (partial update)', async () => {
			const mockUpdateImageService = jest.mocked(updateImageService)
			mockUpdateImageService.mockResolvedValue(mockUpdatedImage)

			const request = createMockRequest({
				params: { id: '1' },
				body: {},
			})
			const reply = createMockReply()

			await updateImageController(request, reply)

			expect(mockUpdateImageService).toHaveBeenCalledWith({ id: 1 })
			expect(reply.status).toHaveBeenCalledWith(200)
		})

		it('should handle ValidationError from service', async () => {
			const mockUpdateImageService = jest.mocked(updateImageService)
			const validationError = new ValidationError('Invalid mime type')
			mockUpdateImageService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { mimeType: 'invalid/type' },
			})
			const reply = createMockReply()

			await updateImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Invalid mime type',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockUpdateImageService = jest.mocked(updateImageService)
			const businessError = new BusinessLogicError('Cannot modify image owned by another user')
			mockUpdateImageService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { userId: 999 },
			})
			const reply = createMockReply()

			await updateImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot modify image owned by another user',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockUpdateImageService = jest.mocked(updateImageService)
			mockUpdateImageService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
				body: { filename: 'updated.jpg' },
			})
			const reply = createMockReply()

			await updateImageController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('deleteImageController', () => {
		it('should delete an image successfully', async () => {
			const mockDeleteImageService = jest.mocked(deleteImageService)
			mockDeleteImageService.mockResolvedValue()

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteImageController(request, reply)

			expect(mockDeleteImageService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				message: 'Image deleted successfully',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await deleteImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Image ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockDeleteImageService = jest.mocked(deleteImageService)
			const validationError = new ValidationError('Image ID must be a positive integer')
			mockDeleteImageService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Image ID must be a positive integer',
			})
		})

		it('should handle EntityNotFoundError from service', async () => {
			const mockDeleteImageService = jest.mocked(deleteImageService)
			const entityError = new EntityNotFoundError('Image', 999)
			mockDeleteImageService.mockRejectedValue(entityError)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await deleteImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: entityError.message,
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockDeleteImageService = jest.mocked(deleteImageService)
			const businessError = new BusinessLogicError('Cannot delete image as it is being used by characters')
			mockDeleteImageService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteImageController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot delete image as it is being used by characters',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockDeleteImageService = jest.mocked(deleteImageService)
			mockDeleteImageService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteImageController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})
})
