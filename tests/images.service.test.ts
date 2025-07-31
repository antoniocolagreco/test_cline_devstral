import ValidationError from '../src/errors/validation.error.js'

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

import { getImageService, getImagesService } from '../src/services/images.service.js'

describe('Images Service (Basic)', () => {
	beforeEach(() => {
		jest.clearAllMocks()

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
	})

	describe('getImageService', () => {
		it('should throw ValidationError for invalid id', async () => {
			await expect(getImageService(0)).rejects.toThrow(ValidationError)
		})
	})
})
