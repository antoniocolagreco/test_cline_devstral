import ValidationError from '../src/errors/validation.error.js'
import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import { Buffer } from 'node:buffer'

// Mock Prisma client
const mockPrisma = {
	image: {
		findMany: jest.fn(),
		count: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	user: {
		findUnique: jest.fn(),
		count: jest.fn(),
	},
	character: {
		count: jest.fn(),
	},
	$transaction: jest.fn(),
}

// Mock the prisma module
jest.mock('../src/index.js', () => ({
	prisma: mockPrisma,
}))

// Mock the services helper
jest.mock('../src/helpers/services.helper.js', () => ({
	transformSearchToQuery: jest.fn(),
}))

import {
	getImageService,
	getImagesService,
	createImageService,
	updateImageService,
	deleteImageService,
	getImageBufferService,
	getUserImagesService,
} from '../src/services/images.service.js'
import { transformSearchToQuery } from '../src/helpers/services.helper.js'

describe('Images Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(transformSearchToQuery as jest.Mock).mockReturnValue(undefined)

		// Default transaction implementation
		mockPrisma.$transaction.mockImplementation(async (queries: any) => {
			if (Array.isArray(queries)) {
				// For array format like [findMany, count] - return the resolved values
				return [await mockPrisma.image.findMany(), await mockPrisma.image.count()]
			}
			if (typeof queries === 'function') {
				return await queries(mockPrisma)
			}
			return queries
		})
	})

	describe('getImagesService', () => {
		const mockImage = {
			id: 1,
			filename: 'test.jpg',
			mimeType: 'image/jpeg',
			size: 1024,
			width: 800,
			height: 600,
			isPublic: true,
			userId: 1,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
		}

		it('should return paginated images with default parameters', async () => {
			const mockImages = [mockImage]
			mockPrisma.image.findMany.mockResolvedValue(mockImages)
			mockPrisma.image.count.mockResolvedValue(1)

			const result = await getImagesService({})

			expect(mockPrisma.image.findMany).toHaveBeenCalledWith({
				where: undefined,
				orderBy: { filename: 'asc' },
				skip: 0,
				take: 10,
				select: expect.objectContaining({
					id: true,
					filename: true,
					mimeType: true,
					size: true,
					width: true,
					height: true,
					isPublic: true,
					userId: true,
				}),
			})

			expect(result).toEqual({
				data: [
					{
						...mockImage,
						createdAt: '2023-01-01T00:00:00.000Z',
						updatedAt: '2023-01-01T00:00:00.000Z',
					},
				],
				pagination: {
					page: 1,
					pageSize: 10,
					total: 1,
					totalPages: 1,
				},
			})
		})

		it('should throw ValidationError for invalid page number', async () => {
			await expect(getImagesService({ page: 0 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid page size', async () => {
			await expect(getImagesService({ pageSize: 0 })).rejects.toThrow(ValidationError)
			await expect(getImagesService({ pageSize: 101 })).rejects.toThrow(ValidationError)
		})

		it('should handle custom pagination parameters', async () => {
			const mockImages = [mockImage]
			mockPrisma.image.findMany.mockResolvedValue(mockImages)
			mockPrisma.image.count.mockResolvedValue(20)

			const result = await getImagesService({ page: 2, pageSize: 5 })

			expect(mockPrisma.image.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					skip: 5,
					take: 5,
				}),
			)

			expect(result.pagination).toEqual({
				page: 2,
				pageSize: 5,
				total: 20,
				totalPages: 4,
			})
		})

		it('should handle custom orderBy', async () => {
			const mockImages = [mockImage]
			mockPrisma.image.findMany.mockResolvedValue(mockImages)
			mockPrisma.image.count.mockResolvedValue(1)

			await getImagesService({ orderBy: { field: 'size', direction: 'desc' } })

			expect(mockPrisma.image.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					orderBy: { size: 'desc' },
				}),
			)
		})

		it('should handle search query', async () => {
			const mockImages = [mockImage]
			const searchQuery = { filename: { contains: 'test' } }
			;(transformSearchToQuery as jest.Mock).mockReturnValue(searchQuery)

			mockPrisma.image.findMany.mockResolvedValue(mockImages)
			mockPrisma.image.count.mockResolvedValue(1)

			await getImagesService({
				search: {
					id: 1,
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					isPublic: true,
					createdAt: '2023-01-01T00:00:00.000Z',
					updatedAt: '2023-01-01T00:00:00.000Z',
				},
			})

			expect(transformSearchToQuery).toHaveBeenCalledWith({
				id: 1,
				filename: 'test.jpg',
				size: 1024,
				width: 800,
				height: 600,
				mimeType: 'image/jpeg',
				userId: 1,
				isPublic: true,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			})
			expect(mockPrisma.image.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: searchQuery,
				}),
			)
		})

		it('should rethrow ValidationError', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.$transaction.mockRejectedValue(validationError)

			await expect(getImagesService({})).rejects.toThrow('Test error')
		})

		it('should wrap other errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(getImagesService({})).rejects.toThrow('Failed to retrieve images')
		})
	})

	describe('getImageService', () => {
		const mockImage = {
			id: 1,
			filename: 'test.jpg',
			mimeType: 'image/jpeg',
			size: 1024,
			width: 800,
			height: 600,
			isPublic: true,
			userId: 1,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
		}

		it('should throw ValidationError for invalid id', async () => {
			await expect(getImageService(0)).rejects.toThrow(ValidationError)
			await expect(getImageService(-1)).rejects.toThrow(ValidationError)
			await expect(getImageService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should return image when found', async () => {
			mockPrisma.image.findUnique.mockResolvedValue(mockImage)

			const result = await getImageService(1)

			expect(mockPrisma.image.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: expect.objectContaining({
					id: true,
					filename: true,
					size: true,
					width: true,
					height: true,
					mimeType: true,
					userId: true,
					isPublic: true,
				}),
			})

			expect(result).toEqual({
				...mockImage,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			})
		})

		it('should return null when image not found', async () => {
			mockPrisma.image.findUnique.mockResolvedValue(null)

			const result = await getImageService(999)

			expect(result).toBeNull()
		})

		it('should rethrow ValidationError', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.image.findUnique.mockRejectedValue(validationError)

			await expect(getImageService(1)).rejects.toThrow('Test error')
		})

		it('should wrap other errors', async () => {
			mockPrisma.image.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(getImageService(1)).rejects.toThrow('Failed to retrieve image')
		})
	})

	describe('createImageService', () => {
		const mockCreatedImage = {
			id: 1,
			filename: 'test.jpg',
			size: 1024,
			width: 800,
			height: 600,
			mimeType: 'image/jpeg',
			userId: 1,
			isPublic: false,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
		}

		const validBuffer = Buffer.from('fake image data')

		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (fn: any) => {
				if (typeof fn === 'function') {
					return await fn(mockPrisma)
				}
				return fn
			})
		})

		it('should throw ValidationError for missing filename', async () => {
			await expect(
				createImageService({
					filename: '',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				} as any),
			).rejects.toThrow(ValidationError)
			await expect(
				createImageService({
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				} as any),
			).rejects.toThrow(ValidationError)
			await expect(
				createImageService({
					filename: null,
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				} as any),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid filename type', async () => {
			await expect(
				createImageService({
					filename: 123,
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				} as any),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for empty filename', async () => {
			await expect(
				createImageService({
					filename: '   ',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for filename too long', async () => {
			const longFilename = 'a'.repeat(256) + '.jpg'
			await expect(
				createImageService({
					filename: longFilename,
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for mismatched file extension', async () => {
			await expect(
				createImageService({
					filename: 'test.png',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid size', async () => {
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 0,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 5242881,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1.5,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid width', async () => {
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 0,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 2049,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid height', async () => {
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 0,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 2049,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid mimeType', async () => {
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/gif',
					userId: 1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid isPublic', async () => {
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					isPublic: 'true',
					buffer: validBuffer,
				} as any),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid userId', async () => {
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 0,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: -1,
					buffer: validBuffer,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid buffer', async () => {
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: 'not a buffer',
				} as any),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for mismatched buffer size', async () => {
			const wrongSizeBuffer = Buffer.from('wrong size')
			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: wrongSizeBuffer,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should create image successfully', async () => {
			const correctSizeBuffer = Buffer.alloc(1024)
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1, isActive: true })
			mockPrisma.image.count.mockResolvedValue(5)
			mockPrisma.image.findFirst.mockResolvedValue(null)
			mockPrisma.image.create.mockResolvedValue(mockCreatedImage)

			const result = await createImageService({
				filename: 'test.jpg',
				size: 1024,
				width: 800,
				height: 600,
				mimeType: 'image/jpeg',
				userId: 1,
				buffer: correctSizeBuffer,
			})

			expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true, isActive: true },
			})

			expect(mockPrisma.image.create).toHaveBeenCalledWith({
				data: {
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					isPublic: false,
					buffer: correctSizeBuffer,
				},
				select: expect.objectContaining({
					id: true,
					filename: true,
					size: true,
					width: true,
					height: true,
					mimeType: true,
					userId: true,
					isPublic: true,
				}),
			})

			expect(result).toEqual({
				...mockCreatedImage,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			})
		})

		it('should create image with isPublic true', async () => {
			const correctSizeBuffer = Buffer.alloc(1024)
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1, isActive: true })
			mockPrisma.image.count.mockResolvedValue(5)
			mockPrisma.image.findFirst.mockResolvedValue(null)
			mockPrisma.image.create.mockResolvedValue({ ...mockCreatedImage, isPublic: true })

			await createImageService({
				filename: 'test.jpg',
				size: 1024,
				width: 800,
				height: 600,
				mimeType: 'image/jpeg',
				userId: 1,
				isPublic: true,
				buffer: correctSizeBuffer,
			})

			expect(mockPrisma.image.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						isPublic: true,
					}),
				}),
			)
		})

		it('should accept different valid image formats', async () => {
			const correctSizeBuffer = Buffer.alloc(1024)
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1, isActive: true })
			mockPrisma.image.count.mockResolvedValue(5)
			mockPrisma.image.findFirst.mockResolvedValue(null)
			mockPrisma.image.create.mockResolvedValue(mockCreatedImage)

			// Test PNG
			await createImageService({
				filename: 'test.png',
				size: 1024,
				width: 800,
				height: 600,
				mimeType: 'image/png',
				userId: 1,
				buffer: correctSizeBuffer,
			})

			// Test WebP
			await createImageService({
				filename: 'test.webp',
				size: 1024,
				width: 800,
				height: 600,
				mimeType: 'image/webp',
				userId: 1,
				buffer: correctSizeBuffer,
			})

			expect(mockPrisma.image.create).toHaveBeenCalledTimes(2)
		})

		it('should throw EntityNotFoundError when user not found', async () => {
			const correctSizeBuffer = Buffer.alloc(1024)
			mockPrisma.user.findUnique.mockResolvedValue(null)

			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 999,
					buffer: correctSizeBuffer,
				}),
			).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw BusinessLogicError when user is inactive', async () => {
			const correctSizeBuffer = Buffer.alloc(1024)
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1, isActive: false })

			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: correctSizeBuffer,
				}),
			).rejects.toThrow(BusinessLogicError)
		})

		it('should throw BusinessLogicError when user reaches image limit', async () => {
			const correctSizeBuffer = Buffer.alloc(1024)
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1, isActive: true })
			mockPrisma.image.count.mockResolvedValue(100)

			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: correctSizeBuffer,
				}),
			).rejects.toThrow(BusinessLogicError)
		})

		it('should throw BusinessLogicError when filename already exists for user', async () => {
			const correctSizeBuffer = Buffer.alloc(1024)
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1, isActive: true })
			mockPrisma.image.count.mockResolvedValue(5)
			mockPrisma.image.findFirst.mockResolvedValue({ id: 2 })

			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: correctSizeBuffer,
				}),
			).rejects.toThrow(BusinessLogicError)
		})

		it('should handle Prisma unique constraint violation', async () => {
			const correctSizeBuffer = Buffer.alloc(1024)
			const prismaError = new Error('Unique constraint violation')
			;(prismaError as any).code = 'P2002'

			mockPrisma.user.findUnique.mockResolvedValue({ id: 1, isActive: true })
			mockPrisma.image.count.mockResolvedValue(5)
			mockPrisma.image.findFirst.mockResolvedValue(null)
			mockPrisma.image.create.mockRejectedValue(prismaError)

			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: correctSizeBuffer,
				}),
			).rejects.toThrow(BusinessLogicError)
		})

		it('should wrap other errors', async () => {
			const correctSizeBuffer = Buffer.alloc(1024)
			mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(
				createImageService({
					filename: 'test.jpg',
					size: 1024,
					width: 800,
					height: 600,
					mimeType: 'image/jpeg',
					userId: 1,
					buffer: correctSizeBuffer,
				}),
			).rejects.toThrow('Failed to create image')
		})
	})

	describe('updateImageService', () => {
		const mockUpdatedImage = {
			id: 1,
			filename: 'updated.jpg',
			size: 2048,
			width: 1024,
			height: 768,
			mimeType: 'image/jpeg',
			userId: 1,
			isPublic: true,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-02T00:00:00.000Z'),
		}

		it('should throw ValidationError for invalid id', async () => {
			await expect(updateImageService({ id: 0, filename: 'test.jpg' })).rejects.toThrow(ValidationError)
			await expect(updateImageService({ id: -1, filename: 'test.jpg' })).rejects.toThrow(ValidationError)
			await expect(updateImageService({ id: 1.5, filename: 'test.jpg' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid filename type', async () => {
			await expect(updateImageService({ id: 1, filename: 123 } as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for empty filename', async () => {
			await expect(updateImageService({ id: 1, filename: '   ' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for filename too long', async () => {
			const longFilename = 'a'.repeat(256) + '.jpg'
			await expect(updateImageService({ id: 1, filename: longFilename })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid size', async () => {
			await expect(updateImageService({ id: 1, size: 0 })).rejects.toThrow(ValidationError)
			await expect(updateImageService({ id: 1, size: 5242881 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid dimensions', async () => {
			await expect(updateImageService({ id: 1, width: 0 })).rejects.toThrow(ValidationError)
			await expect(updateImageService({ id: 1, width: 2049 })).rejects.toThrow(ValidationError)
			await expect(updateImageService({ id: 1, height: 0 })).rejects.toThrow(ValidationError)
			await expect(updateImageService({ id: 1, height: 2049 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid mimeType', async () => {
			await expect(updateImageService({ id: 1, mimeType: 'image/gif' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid isPublic', async () => {
			await expect(updateImageService({ id: 1, isPublic: 'true' } as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid userId', async () => {
			await expect(updateImageService({ id: 1, userId: 0 })).rejects.toThrow(ValidationError)
			await expect(updateImageService({ id: 1, userId: -1 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid buffer', async () => {
			await expect(updateImageService({ id: 1, buffer: 'not a buffer' } as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for mismatched buffer and size', async () => {
			const buffer = Buffer.from('test')
			await expect(updateImageService({ id: 1, buffer, size: 1000 })).rejects.toThrow(ValidationError)
		})

		it('should update image successfully', async () => {
			// Mock the necessary checks for successful filename update
			mockPrisma.image.findUnique.mockResolvedValue({ userId: 1 })
			mockPrisma.image.findFirst.mockResolvedValue(null) // No existing filename conflict
			mockPrisma.image.update.mockResolvedValue(mockUpdatedImage)

			const result = await updateImageService({ id: 1, filename: 'updated.jpg', size: 2048 })

			expect(mockPrisma.image.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { userId: true },
			})

			expect(mockPrisma.image.findFirst).toHaveBeenCalledWith({
				where: {
					filename: 'updated.jpg',
					userId: 1,
					id: { not: 1 },
				},
				select: { id: true },
			})

			expect(mockPrisma.image.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					filename: 'updated.jpg',
					size: 2048,
				},
				select: expect.objectContaining({
					id: true,
					filename: true,
					size: true,
					width: true,
					height: true,
					mimeType: true,
					userId: true,
					isPublic: true,
				}),
			})

			expect(result).toEqual({
				...mockUpdatedImage,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-02T00:00:00.000Z',
			})
		})

		it('should update only provided fields', async () => {
			// Don't mock any filename checks for update without filename
			mockPrisma.image.update.mockResolvedValue(mockUpdatedImage)

			await updateImageService({ id: 1, isPublic: true })

			expect(mockPrisma.image.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					isPublic: true,
				},
				select: expect.any(Object),
			})
		})

		it('should throw EntityNotFoundError when user not found for userId update', async () => {
			mockPrisma.user.findUnique.mockResolvedValue(null)

			await expect(updateImageService({ id: 1, userId: 999 })).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw BusinessLogicError when user is inactive for userId update', async () => {
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1, isActive: false })

			await expect(updateImageService({ id: 1, userId: 1 })).rejects.toThrow(BusinessLogicError)
		})

		it('should throw BusinessLogicError when filename already exists for user', async () => {
			mockPrisma.image.findUnique.mockResolvedValue({ userId: 1 })
			mockPrisma.image.findFirst.mockResolvedValue({ id: 2 })

			await expect(updateImageService({ id: 1, filename: 'existing.jpg' })).rejects.toThrow(BusinessLogicError)
		})

		it('should return null when image not found', async () => {
			const prismaError = new Error('Record not found')
			;(prismaError as any).code = 'P2025'

			// Don't mock filename checks for this test
			mockPrisma.image.update.mockRejectedValue(prismaError)

			const result = await updateImageService({ id: 999, size: 1000 })

			expect(result).toBeNull()
		})

		it('should handle Prisma unique constraint violation', async () => {
			const prismaError = new Error('Unique constraint violation')
			;(prismaError as any).code = 'P2002'

			// Don't mock filename checks for this test
			mockPrisma.image.update.mockRejectedValue(prismaError)

			await expect(updateImageService({ id: 1, size: 1000 })).rejects.toThrow(BusinessLogicError)
		})

		it('should wrap other errors', async () => {
			// Don't mock filename checks for this test
			mockPrisma.image.update.mockRejectedValue(new Error('Database error'))

			await expect(updateImageService({ id: 1, size: 1000 })).rejects.toThrow('Failed to update image')
		})
	})

	describe('deleteImageService', () => {
		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (fn: any) => {
				if (typeof fn === 'function') {
					return await fn(mockPrisma)
				}
				return fn
			})
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(deleteImageService(0)).rejects.toThrow(ValidationError)
			await expect(deleteImageService(-1)).rejects.toThrow(ValidationError)
			await expect(deleteImageService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should delete image successfully', async () => {
			mockPrisma.image.findUnique.mockResolvedValue({ id: 1, filename: 'test.jpg' })
			mockPrisma.image.delete.mockResolvedValue({ id: 1 })

			await deleteImageService(1)

			expect(mockPrisma.image.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true, filename: true },
			})

			expect(mockPrisma.image.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			})
		})

		it('should throw EntityNotFoundError when image not found', async () => {
			mockPrisma.image.findUnique.mockResolvedValue(null)

			await expect(deleteImageService(999)).rejects.toThrow(EntityNotFoundError)
		})

		it('should wrap other errors', async () => {
			mockPrisma.image.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(deleteImageService(1)).rejects.toThrow('Failed to delete image')
		})
	})

	describe('getImageBufferService', () => {
		it('should throw ValidationError for invalid id', async () => {
			await expect(getImageBufferService(0)).rejects.toThrow(ValidationError)
			await expect(getImageBufferService(-1)).rejects.toThrow(ValidationError)
			await expect(getImageBufferService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should return buffer when image found', async () => {
			const mockBuffer = new Uint8Array([1, 2, 3, 4])
			mockPrisma.image.findUnique.mockResolvedValue({ buffer: mockBuffer })

			const result = await getImageBufferService(1)

			expect(mockPrisma.image.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { buffer: true },
			})

			expect(result).toBeInstanceOf(Buffer)
			expect(result).toEqual(Buffer.from(mockBuffer))
		})

		it('should return null when image not found', async () => {
			mockPrisma.image.findUnique.mockResolvedValue(null)

			const result = await getImageBufferService(999)

			expect(result).toBeNull()
		})

		it('should return null when image has no buffer', async () => {
			mockPrisma.image.findUnique.mockResolvedValue({ buffer: null })

			const result = await getImageBufferService(1)

			expect(result).toBeNull()
		})

		it('should rethrow ValidationError', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.image.findUnique.mockRejectedValue(validationError)

			await expect(getImageBufferService(1)).rejects.toThrow('Test error')
		})

		it('should wrap other errors', async () => {
			mockPrisma.image.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(getImageBufferService(1)).rejects.toThrow('Failed to retrieve image buffer')
		})
	})

	describe('getUserImagesService', () => {
		const mockImage = {
			id: 1,
			filename: 'test.jpg',
			mimeType: 'image/jpeg',
			size: 1024,
			width: 800,
			height: 600,
			isPublic: true,
			userId: 1,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
		}

		it('should throw ValidationError for invalid userId', async () => {
			await expect(getUserImagesService(0)).rejects.toThrow(ValidationError)
			await expect(getUserImagesService(-1)).rejects.toThrow(ValidationError)
			await expect(getUserImagesService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid page number', async () => {
			await expect(getUserImagesService(1, { page: 0 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid page size', async () => {
			await expect(getUserImagesService(1, { pageSize: 0 })).rejects.toThrow(ValidationError)
			await expect(getUserImagesService(1, { pageSize: 101 })).rejects.toThrow(ValidationError)
		})

		it('should return user images with default parameters', async () => {
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.image.findMany.mockResolvedValue([mockImage])
			mockPrisma.image.count.mockResolvedValue(1)

			const result = await getUserImagesService(1)

			expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true },
			})

			expect(mockPrisma.image.findMany).toHaveBeenCalledWith({
				where: { userId: 1 },
				orderBy: { filename: 'asc' },
				skip: 0,
				take: 10,
				select: expect.any(Object),
			})

			expect(result).toEqual({
				data: [
					{
						...mockImage,
						createdAt: '2023-01-01T00:00:00.000Z',
						updatedAt: '2023-01-01T00:00:00.000Z',
					},
				],
				pagination: {
					page: 1,
					pageSize: 10,
					total: 1,
					totalPages: 1,
				},
			})
		})

		it('should handle custom pagination and ordering', async () => {
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.image.findMany.mockResolvedValue([mockImage])
			mockPrisma.image.count.mockResolvedValue(15)

			const result = await getUserImagesService(1, {
				page: 2,
				pageSize: 5,
				orderBy: { field: 'size', direction: 'desc' },
			})

			expect(mockPrisma.image.findMany).toHaveBeenCalledWith({
				where: { userId: 1 },
				orderBy: { size: 'desc' },
				skip: 5,
				take: 5,
				select: expect.any(Object),
			})

			expect(result.pagination).toEqual({
				page: 2,
				pageSize: 5,
				total: 15,
				totalPages: 3,
			})
		})

		it('should throw EntityNotFoundError when user not found', async () => {
			mockPrisma.user.findUnique.mockResolvedValue(null)

			await expect(getUserImagesService(999)).rejects.toThrow(EntityNotFoundError)
		})

		it('should wrap other errors', async () => {
			mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(getUserImagesService(1)).rejects.toThrow('Failed to retrieve user images')
		})
	})
})
