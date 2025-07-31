import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock Prisma client
const mockPrisma = {
	tag: {
		findMany: jest.fn(),
		count: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	item: {
		count: jest.fn(),
	},
	character: {
		count: jest.fn(),
	},
	skill: {
		count: jest.fn(),
	},
	archetype: {
		count: jest.fn(),
	},
	race: {
		count: jest.fn(),
	},
	$transaction: jest.fn(),
}

// Mock the prisma import
jest.mock('../src/index.js', () => ({
	prisma: mockPrisma,
}))

import {
	checkTagNameExistsService,
	createTagService,
	deleteTagService,
	getTagService,
	getTagsService,
	updateTagService,
} from '../src/services/tags.service.js'

describe('Tags Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getTagsService', () => {
		const mockTags = [
			{
				id: 1,
				name: 'Fantasy',
				createdAt: new Date('2023-01-01T00:00:00.000Z'),
				updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			},
			{
				id: 2,
				name: 'Adventure',
				createdAt: new Date('2023-01-02T00:00:00.000Z'),
				updatedAt: new Date('2023-01-02T00:00:00.000Z'),
			},
		]

		it('should return paginated tags with default parameters', async () => {
			// Mock the transaction to call the callback with the correct args
			mockPrisma.$transaction.mockImplementation(async (_queries) => {
				const findManyResult = mockTags
				const countResult = 2
				return [findManyResult, countResult]
			})

			const result = await getTagsService({})

			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)

			expect(result).toEqual({
				data: [
					{
						id: 1,
						name: 'Fantasy',
						createdAt: '2023-01-01T00:00:00.000Z',
						updatedAt: '2023-01-01T00:00:00.000Z',
					},
					{
						id: 2,
						name: 'Adventure',
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

		it('should return paginated tags with custom parameters', async () => {
			mockPrisma.$transaction.mockImplementation(async (_queries) => {
				return [mockTags.slice(0, 1), 2]
			})

			const result = await getTagsService({
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

			await getTagsService({
				search: { name: 'Fantasy' } as any,
			})

			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
		})

		it('should throw ValidationError for invalid page number', async () => {
			await expect(getTagsService({ page: 0 })).rejects.toThrow(ValidationError)
			await expect(getTagsService({ page: -1 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid page size', async () => {
			await expect(getTagsService({ pageSize: 0 })).rejects.toThrow(ValidationError)
			await expect(getTagsService({ pageSize: 101 })).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(getTagsService({})).rejects.toThrow('Failed to retrieve tags: Database error')
		})

		it('should preserve ValidationError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.$transaction.mockRejectedValue(validationError)

			await expect(getTagsService({})).rejects.toThrow(ValidationError)
		})
	})

	describe('getTagService', () => {
		const mockTag = {
			id: 1,
			name: 'Fantasy',
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
		}

		it('should return a tag by id', async () => {
			mockPrisma.tag.findUnique.mockResolvedValue(mockTag)

			const result = await getTagService(1)

			expect(mockPrisma.tag.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: {
					id: true,
					name: true,
					createdAt: true,
					updatedAt: true,
				},
			})

			expect(result).toEqual({
				id: 1,
				name: 'Fantasy',
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			})
		})

		it('should return null when tag not found', async () => {
			mockPrisma.tag.findUnique.mockResolvedValue(null)

			const result = await getTagService(999)

			expect(result).toBeNull()
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(getTagService(0)).rejects.toThrow(ValidationError)
			await expect(getTagService(-1)).rejects.toThrow(ValidationError)
			await expect(getTagService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.tag.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(getTagService(1)).rejects.toThrow('Failed to retrieve tag: Database error')
		})

		it('should preserve ValidationError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.tag.findUnique.mockRejectedValue(validationError)

			await expect(getTagService(1)).rejects.toThrow(ValidationError)
		})
	})

	describe('createTagService', () => {
		const mockCreatedTag = {
			id: 1,
			name: 'Fantasy',
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
		}

		it('should create a new tag', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)
			mockPrisma.tag.create.mockResolvedValue(mockCreatedTag)

			const result = await createTagService({ name: 'Fantasy' })

			expect(mockPrisma.tag.findFirst).toHaveBeenCalledWith({
				where: { name: 'Fantasy' },
				select: { id: true },
			})

			expect(mockPrisma.tag.create).toHaveBeenCalledWith({
				data: { name: 'Fantasy' },
				select: {
					id: true,
					name: true,
					createdAt: true,
					updatedAt: true,
				},
			})

			expect(result).toEqual({
				id: 1,
				name: 'Fantasy',
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			})
		})

		it('should trim tag name before creating', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)
			mockPrisma.tag.create.mockResolvedValue(mockCreatedTag)

			await createTagService({ name: '  Fantasy  ' })

			expect(mockPrisma.tag.findFirst).toHaveBeenCalledWith({
				where: { name: 'Fantasy' },
				select: { id: true },
			})

			expect(mockPrisma.tag.create).toHaveBeenCalledWith({
				data: { name: 'Fantasy' },
				select: expect.any(Object),
			})
		})

		it('should throw ValidationError for missing name', async () => {
			await expect(createTagService({ name: '' })).rejects.toThrow(ValidationError)
			await expect(createTagService({ name: '   ' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name type', async () => {
			await expect(createTagService({ name: undefined as any })).rejects.toThrow(ValidationError)
			await expect(createTagService({ name: null as any })).rejects.toThrow(ValidationError)
			await expect(createTagService({ name: 123 as any })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for name too long', async () => {
			const longName = 'a'.repeat(51)
			await expect(createTagService({ name: longName })).rejects.toThrow(ValidationError)
		})

		it('should throw BusinessLogicError when tag name already exists', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue({ id: 1 })

			await expect(createTagService({ name: 'Fantasy' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle Prisma unique constraint violation', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)
			const constraintError = new Error('Unique constraint violation')
			;(constraintError as any).code = 'P2002'
			mockPrisma.tag.create.mockRejectedValue(constraintError)

			await expect(createTagService({ name: 'Fantasy' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle database errors', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)
			mockPrisma.tag.create.mockRejectedValue(new Error('Database error'))

			await expect(createTagService({ name: 'Fantasy' })).rejects.toThrow('Failed to create tag: Database error')
		})

		it('should preserve ValidationError and BusinessLogicError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.tag.findFirst.mockRejectedValue(validationError)

			await expect(createTagService({ name: 'Fantasy' })).rejects.toThrow(ValidationError)
		})
	})

	describe('updateTagService', () => {
		const mockUpdatedTag = {
			id: 1,
			name: 'Updated Fantasy',
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-02T00:00:00.000Z'),
		}

		it('should update a tag', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)
			mockPrisma.tag.update.mockResolvedValue(mockUpdatedTag)

			const result = await updateTagService({ id: 1, name: 'Updated Fantasy' })

			expect(mockPrisma.tag.findFirst).toHaveBeenCalledWith({
				where: { name: 'Updated Fantasy', id: { not: 1 } },
				select: { id: true },
			})

			expect(mockPrisma.tag.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { name: 'Updated Fantasy' },
				select: {
					id: true,
					name: true,
					createdAt: true,
					updatedAt: true,
				},
			})

			expect(result).toEqual({
				id: 1,
				name: 'Updated Fantasy',
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-02T00:00:00.000Z',
			})
		})

		it('should trim tag name before updating', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)
			mockPrisma.tag.update.mockResolvedValue(mockUpdatedTag)

			await updateTagService({ id: 1, name: '  Updated Fantasy  ' })

			expect(mockPrisma.tag.findFirst).toHaveBeenCalledWith({
				where: { name: 'Updated Fantasy', id: { not: 1 } },
				select: { id: true },
			})

			expect(mockPrisma.tag.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { name: 'Updated Fantasy' },
				select: expect.any(Object),
			})
		})

		it('should update with partial data (name undefined)', async () => {
			mockPrisma.tag.update.mockResolvedValue(mockUpdatedTag)

			await updateTagService({ id: 1 })

			expect(mockPrisma.tag.findFirst).not.toHaveBeenCalled()
			expect(mockPrisma.tag.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {},
				select: expect.any(Object),
			})
		})

		it('should return null when tag not found', async () => {
			const notFoundError = new Error('Record not found')
			;(notFoundError as any).code = 'P2025'
			mockPrisma.tag.update.mockRejectedValue(notFoundError)

			const result = await updateTagService({ id: 999, name: 'Non-existent' })

			expect(result).toBeNull()
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(updateTagService({ id: 0, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateTagService({ id: -1, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateTagService({ id: 1.5, name: 'Test' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name type', async () => {
			await expect(updateTagService({ id: 1, name: 123 as any })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for empty name', async () => {
			await expect(updateTagService({ id: 1, name: '' })).rejects.toThrow(ValidationError)
			await expect(updateTagService({ id: 1, name: '   ' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for name too long', async () => {
			const longName = 'a'.repeat(51)
			await expect(updateTagService({ id: 1, name: longName })).rejects.toThrow(ValidationError)
		})

		it('should throw BusinessLogicError when tag name already exists for different tag', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue({ id: 2 })

			await expect(updateTagService({ id: 1, name: 'Existing Name' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle Prisma unique constraint violation', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)
			const constraintError = new Error('Unique constraint violation')
			;(constraintError as any).code = 'P2002'
			mockPrisma.tag.update.mockRejectedValue(constraintError)

			await expect(updateTagService({ id: 1, name: 'Fantasy' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle database errors', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)
			mockPrisma.tag.update.mockRejectedValue(new Error('Database error'))

			await expect(updateTagService({ id: 1, name: 'Test' })).rejects.toThrow(
				'Failed to update tag: Database error',
			)
		})

		it('should preserve ValidationError and BusinessLogicError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.tag.findFirst.mockRejectedValue(validationError)

			await expect(updateTagService({ id: 1, name: 'Test' })).rejects.toThrow(ValidationError)
		})
	})

	describe('deleteTagService', () => {
		const mockTransaction = jest.fn()

		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(mockTransaction)
		})

		it('should delete a tag successfully', async () => {
			const mockTx = {
				tag: {
					findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Fantasy' }),
					delete: jest.fn().mockResolvedValue(undefined),
				},
				item: { count: jest.fn().mockResolvedValue(0) },
				character: { count: jest.fn().mockResolvedValue(0) },
				skill: { count: jest.fn().mockResolvedValue(0) },
				archetype: { count: jest.fn().mockResolvedValue(0) },
				race: { count: jest.fn().mockResolvedValue(0) },
			}

			mockTransaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await deleteTagService(1)

			expect(mockTx.tag.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true, name: true },
			})

			expect(mockTx.tag.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			})
		})

		it('should throw EntityNotFoundError when tag does not exist', async () => {
			const mockTx = {
				tag: {
					findUnique: jest.fn().mockResolvedValue(null),
				},
			}

			mockTransaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(deleteTagService(999)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw BusinessLogicError when tag is being used', async () => {
			const mockTx = {
				tag: {
					findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Fantasy' }),
				},
				item: { count: jest.fn().mockResolvedValue(2) },
				character: { count: jest.fn().mockResolvedValue(1) },
				skill: { count: jest.fn().mockResolvedValue(0) },
				archetype: { count: jest.fn().mockResolvedValue(0) },
				race: { count: jest.fn().mockResolvedValue(0) },
			}

			mockTransaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(deleteTagService(1)).rejects.toThrow(BusinessLogicError)
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(deleteTagService(0)).rejects.toThrow(ValidationError)
			await expect(deleteTagService(-1)).rejects.toThrow(ValidationError)
			await expect(deleteTagService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockTransaction.mockRejectedValue(new Error('Database error'))

			await expect(deleteTagService(1)).rejects.toThrow('Failed to delete tag: Database error')
		})

		it('should preserve specific errors when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockTransaction.mockRejectedValue(validationError)

			await expect(deleteTagService(1)).rejects.toThrow(ValidationError)
		})
	})

	describe('checkTagNameExistsService', () => {
		it('should return true when tag name exists', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue({ id: 1 })

			const result = await checkTagNameExistsService('Fantasy')

			expect(mockPrisma.tag.findFirst).toHaveBeenCalledWith({
				where: { name: 'Fantasy' },
				select: { id: true },
			})

			expect(result).toBe(true)
		})

		it('should return false when tag name does not exist', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)

			const result = await checkTagNameExistsService('Non-existent')

			expect(result).toBe(false)
		})

		it('should exclude specific id when provided', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)

			await checkTagNameExistsService('Fantasy', 1)

			expect(mockPrisma.tag.findFirst).toHaveBeenCalledWith({
				where: { name: 'Fantasy', id: { not: 1 } },
				select: { id: true },
			})
		})

		it('should trim tag name before checking', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)

			await checkTagNameExistsService('  Fantasy  ')

			expect(mockPrisma.tag.findFirst).toHaveBeenCalledWith({
				where: { name: 'Fantasy' },
				select: { id: true },
			})
		})

		it('should throw ValidationError for invalid name', async () => {
			await expect(checkTagNameExistsService('')).rejects.toThrow(ValidationError)
			await expect(checkTagNameExistsService('   ')).rejects.toThrow(ValidationError)
			await expect(checkTagNameExistsService(null as any)).rejects.toThrow(ValidationError)
			await expect(checkTagNameExistsService(undefined as any)).rejects.toThrow(ValidationError)
			await expect(checkTagNameExistsService(123 as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid excludeId', async () => {
			await expect(checkTagNameExistsService('Fantasy', 0)).rejects.toThrow(ValidationError)
			await expect(checkTagNameExistsService('Fantasy', -1)).rejects.toThrow(ValidationError)
			await expect(checkTagNameExistsService('Fantasy', 1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.tag.findFirst.mockRejectedValue(new Error('Database error'))

			await expect(checkTagNameExistsService('Fantasy')).rejects.toThrow(
				'Failed to check tag name existence: Database error',
			)
		})
	})
})
