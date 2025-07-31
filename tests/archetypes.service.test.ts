import ValidationError from '../src/errors/validation.error.js'
import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'

// Mock Prisma client
const mockPrisma = {
	archetype: {
		findMany: jest.fn(),
		count: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	skill: {
		findMany: jest.fn(),
		count: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	tag: {
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
	getArchetypeService,
	getArchetypesService,
	createArchetypeService,
	updateArchetypeService,
	deleteArchetypeService,
	checkArchetypeNameExistsService,
	associateArchetypeSkillsService,
	dissociateArchetypeSkillsService,
	associateArchetypeTagsService,
	dissociateArchetypeTagsService,
} from '../src/services/archetypes.service.js'
import { transformSearchToQuery } from '../src/helpers/services.helper.js'

describe('Archetypes Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(transformSearchToQuery as jest.Mock).mockReturnValue(undefined)

		// Default transaction implementation
		mockPrisma.$transaction.mockImplementation(async (queries: any) => {
			if (Array.isArray(queries)) {
				// For array format like [findMany, count] - return the resolved values
				return [await mockPrisma.archetype.findMany(), await mockPrisma.archetype.count()]
			}
			if (typeof queries === 'function') {
				return await queries(mockPrisma)
			}
			return queries
		})
	})

	describe('getArchetypesService', () => {
		const mockArchetype = {
			id: 1,
			name: 'Test Archetype',
			description: 'A test archetype',
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			skills: [{ id: 1, name: 'Test Skill' }],
			tags: [{ id: 1, name: 'Test Tag' }],
		}

		it('should return paginated archetypes with default parameters', async () => {
			const mockArchetypes = [mockArchetype]
			mockPrisma.archetype.findMany.mockResolvedValue(mockArchetypes)
			mockPrisma.archetype.count.mockResolvedValue(1)

			const result = await getArchetypesService({})

			expect(mockPrisma.archetype.findMany).toHaveBeenCalledWith({
				where: undefined,
				orderBy: { name: 'asc' },
				skip: 0,
				take: 10,
				select: expect.objectContaining({
					id: true,
					name: true,
					description: true,
					skills: expect.any(Object),
					tags: expect.any(Object),
				}),
			})

			expect(result).toEqual({
				data: [
					{
						...mockArchetype,
						description: 'A test archetype',
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
			await expect(getArchetypesService({ page: 0 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid page size', async () => {
			await expect(getArchetypesService({ pageSize: 0 })).rejects.toThrow(ValidationError)
			await expect(getArchetypesService({ pageSize: 101 })).rejects.toThrow(ValidationError)
		})

		it('should handle custom pagination parameters', async () => {
			const mockArchetypes = [mockArchetype]
			mockPrisma.archetype.findMany.mockResolvedValue(mockArchetypes)
			mockPrisma.archetype.count.mockResolvedValue(20)

			const result = await getArchetypesService({ page: 2, pageSize: 5 })

			expect(mockPrisma.archetype.findMany).toHaveBeenCalledWith(
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
			const mockArchetypes = [mockArchetype]
			mockPrisma.archetype.findMany.mockResolvedValue(mockArchetypes)
			mockPrisma.archetype.count.mockResolvedValue(1)

			await getArchetypesService({ orderBy: { field: 'name', direction: 'desc' } })

			expect(mockPrisma.archetype.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					orderBy: { name: 'desc' },
				}),
			)
		})

		it('should handle search query', async () => {
			const mockArchetypes = [mockArchetype]
			const searchQuery = { name: { contains: 'test' } }
			;(transformSearchToQuery as jest.Mock).mockReturnValue(searchQuery)

			mockPrisma.archetype.findMany.mockResolvedValue(mockArchetypes)
			mockPrisma.archetype.count.mockResolvedValue(1)

			await getArchetypesService({
				search: { id: 1, name: 'test', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
			})

			expect(transformSearchToQuery).toHaveBeenCalledWith({
				id: 1,
				name: 'test',
				createdAt: '2023-01-01',
				updatedAt: '2023-01-01',
			})
			expect(mockPrisma.archetype.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: searchQuery,
				}),
			)
		})

		it('should handle null description', async () => {
			const archetypeWithNullDescription = { ...mockArchetype, description: null }
			mockPrisma.archetype.findMany.mockResolvedValue([archetypeWithNullDescription])
			mockPrisma.archetype.count.mockResolvedValue(1)

			const result = await getArchetypesService({})

			expect(result.data[0].description).toBeUndefined()
		})

		it('should rethrow ValidationError', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.$transaction.mockRejectedValue(validationError)

			await expect(getArchetypesService({})).rejects.toThrow('Test error')
		})

		it('should wrap other errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(getArchetypesService({})).rejects.toThrow('Failed to retrieve archetypes')
		})
	})

	describe('getArchetypeService', () => {
		const mockArchetype = {
			id: 1,
			name: 'Test Archetype',
			description: 'A test archetype',
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			skills: [{ id: 1, name: 'Test Skill' }],
			tags: [{ id: 1, name: 'Test Tag' }],
		}

		it('should throw ValidationError for invalid id', async () => {
			await expect(getArchetypeService(0)).rejects.toThrow(ValidationError)
			await expect(getArchetypeService(-1)).rejects.toThrow(ValidationError)
			await expect(getArchetypeService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should return archetype when found', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue(mockArchetype)

			const result = await getArchetypeService(1)

			expect(mockPrisma.archetype.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: expect.objectContaining({
					id: true,
					name: true,
					description: true,
					skills: expect.any(Object),
					tags: expect.any(Object),
				}),
			})

			expect(result).toEqual({
				...mockArchetype,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			})
		})

		it('should return null when archetype not found', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue(null)

			const result = await getArchetypeService(999)

			expect(result).toBeNull()
		})

		it('should handle null description', async () => {
			const archetypeWithNullDescription = { ...mockArchetype, description: null }
			mockPrisma.archetype.findUnique.mockResolvedValue(archetypeWithNullDescription)

			const result = await getArchetypeService(1)

			expect(result?.description).toBeUndefined()
		})

		it('should rethrow ValidationError', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.archetype.findUnique.mockRejectedValue(validationError)

			await expect(getArchetypeService(1)).rejects.toThrow('Test error')
		})

		it('should wrap other errors', async () => {
			mockPrisma.archetype.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(getArchetypeService(1)).rejects.toThrow('Failed to retrieve archetype')
		})
	})

	describe('createArchetypeService', () => {
		const mockCreatedArchetype = {
			id: 1,
			name: 'Test Archetype',
			description: 'A test archetype',
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			skills: [],
			tags: [],
		}

		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (fn: any) => {
				if (typeof fn === 'function') {
					return await fn(mockPrisma)
				}
				return fn
			})
		})

		it('should throw ValidationError for missing name', async () => {
			await expect(createArchetypeService({ name: '' } as any)).rejects.toThrow(ValidationError)
			await expect(createArchetypeService({} as any)).rejects.toThrow(ValidationError)
			await expect(createArchetypeService({ name: null } as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name type', async () => {
			await expect(createArchetypeService({ name: 123 } as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for empty name', async () => {
			await expect(createArchetypeService({ name: '   ' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for name too long', async () => {
			const longName = 'a'.repeat(51)
			await expect(createArchetypeService({ name: longName })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid description type', async () => {
			await expect(createArchetypeService({ name: 'Test', description: 123 } as any)).rejects.toThrow(
				ValidationError,
			)
		})

		it('should throw ValidationError for description too long', async () => {
			const longDescription = 'a'.repeat(501)
			await expect(createArchetypeService({ name: 'Test', description: longDescription })).rejects.toThrow(
				ValidationError,
			)
		})

		it('should create archetype successfully', async () => {
			mockPrisma.archetype.findFirst.mockResolvedValue(null)
			mockPrisma.archetype.create.mockResolvedValue(mockCreatedArchetype)

			const result = await createArchetypeService({ name: 'Test Archetype', description: 'A test archetype' })

			expect(mockPrisma.archetype.findFirst).toHaveBeenCalledWith({
				where: { name: 'Test Archetype' },
				select: { id: true },
			})

			expect(mockPrisma.archetype.create).toHaveBeenCalledWith({
				data: {
					name: 'Test Archetype',
					description: 'A test archetype',
				},
				select: expect.objectContaining({
					id: true,
					name: true,
					description: true,
					skills: expect.any(Object),
					tags: expect.any(Object),
				}),
			})

			expect(result).toEqual({
				...mockCreatedArchetype,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			})
		})

		it('should create archetype with trimmed name', async () => {
			mockPrisma.archetype.findFirst.mockResolvedValue(null)
			mockPrisma.archetype.create.mockResolvedValue(mockCreatedArchetype)

			await createArchetypeService({ name: '  Test Archetype  ' })

			expect(mockPrisma.archetype.findFirst).toHaveBeenCalledWith({
				where: { name: 'Test Archetype' },
				select: { id: true },
			})
		})

		it('should create archetype without description', async () => {
			mockPrisma.archetype.findFirst.mockResolvedValue(null)
			mockPrisma.archetype.create.mockResolvedValue(mockCreatedArchetype)

			await createArchetypeService({ name: 'Test Archetype' })

			expect(mockPrisma.archetype.create).toHaveBeenCalledWith({
				data: {
					name: 'Test Archetype',
					description: null,
				},
				select: expect.any(Object),
			})
		})

		it('should throw BusinessLogicError when name already exists', async () => {
			mockPrisma.archetype.findFirst.mockResolvedValue({ id: 1 })

			await expect(createArchetypeService({ name: 'Test Archetype' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle Prisma unique constraint violation', async () => {
			const prismaError = new Error('Unique constraint violation')
			;(prismaError as any).code = 'P2002'

			mockPrisma.archetype.findFirst.mockResolvedValue(null)
			mockPrisma.archetype.create.mockRejectedValue(prismaError)

			await expect(createArchetypeService({ name: 'Test Archetype' })).rejects.toThrow(BusinessLogicError)
		})

		it('should rethrow ValidationError and BusinessLogicError', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.archetype.findFirst.mockRejectedValue(validationError)

			await expect(createArchetypeService({ name: 'Test' })).rejects.toThrow('Test error')
		})

		it('should wrap other errors', async () => {
			mockPrisma.archetype.findFirst.mockRejectedValue(new Error('Database error'))

			await expect(createArchetypeService({ name: 'Test' })).rejects.toThrow('Failed to create archetype')
		})
	})

	describe('updateArchetypeService', () => {
		const mockUpdatedArchetype = {
			id: 1,
			name: 'Updated Archetype',
			description: 'Updated description',
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-02T00:00:00.000Z'),
			skills: [],
			tags: [],
		}

		it('should throw ValidationError for invalid id', async () => {
			await expect(updateArchetypeService({ id: 0, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateArchetypeService({ id: -1, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateArchetypeService({ id: 1.5, name: 'Test' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name type', async () => {
			await expect(updateArchetypeService({ id: 1, name: 123 } as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for empty name', async () => {
			await expect(updateArchetypeService({ id: 1, name: '   ' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for name too long', async () => {
			const longName = 'a'.repeat(51)
			await expect(updateArchetypeService({ id: 1, name: longName })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid description type', async () => {
			await expect(updateArchetypeService({ id: 1, description: 123 } as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for description too long', async () => {
			const longDescription = 'a'.repeat(501)
			await expect(updateArchetypeService({ id: 1, description: longDescription })).rejects.toThrow(
				ValidationError,
			)
		})

		it('should update archetype successfully', async () => {
			mockPrisma.archetype.findFirst.mockResolvedValue(null)
			mockPrisma.archetype.update.mockResolvedValue(mockUpdatedArchetype)

			const result = await updateArchetypeService({
				id: 1,
				name: 'Updated Archetype',
				description: 'Updated description',
			})

			expect(mockPrisma.archetype.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: 'Updated Archetype',
					description: 'Updated description',
				},
				select: expect.objectContaining({
					id: true,
					name: true,
					description: true,
					skills: expect.any(Object),
					tags: expect.any(Object),
				}),
			})

			expect(result).toEqual({
				...mockUpdatedArchetype,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-02T00:00:00.000Z',
			})
		})

		it('should update only provided fields', async () => {
			mockPrisma.archetype.update.mockResolvedValue(mockUpdatedArchetype)

			await updateArchetypeService({ id: 1, name: 'Updated Archetype' })

			expect(mockPrisma.archetype.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: 'Updated Archetype',
				},
				select: expect.any(Object),
			})
		})

		it('should throw BusinessLogicError when name already exists for different archetype', async () => {
			mockPrisma.archetype.findFirst.mockResolvedValue({ id: 2 })

			await expect(updateArchetypeService({ id: 1, name: 'Existing Name' })).rejects.toThrow(BusinessLogicError)
		})

		it('should return null when archetype not found', async () => {
			const prismaError = new Error('Record not found')
			;(prismaError as any).code = 'P2025'

			// Don't mock findFirst to avoid name validation
			mockPrisma.archetype.update.mockRejectedValue(prismaError)

			const result = await updateArchetypeService({ id: 999, description: 'Test description' })

			expect(result).toBeNull()
		})

		it('should handle Prisma unique constraint violation', async () => {
			const prismaError = new Error('Unique constraint violation')
			;(prismaError as any).code = 'P2002'

			mockPrisma.archetype.findFirst.mockResolvedValue(null)
			mockPrisma.archetype.update.mockRejectedValue(prismaError)

			await expect(updateArchetypeService({ id: 1, name: 'Test' })).rejects.toThrow(BusinessLogicError)
		})

		it('should wrap other errors', async () => {
			mockPrisma.archetype.update.mockRejectedValue(new Error('Database error'))

			await expect(updateArchetypeService({ id: 1, name: 'Test' })).rejects.toThrow('Failed to update archetype')
		})
	})

	describe('deleteArchetypeService', () => {
		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (fn: any) => {
				if (typeof fn === 'function') {
					return await fn(mockPrisma)
				}
				return fn
			})
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(deleteArchetypeService(0)).rejects.toThrow(ValidationError)
			await expect(deleteArchetypeService(-1)).rejects.toThrow(ValidationError)
			await expect(deleteArchetypeService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should delete archetype successfully', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue({ id: 1, name: 'Test Archetype' })
			mockPrisma.character.count.mockResolvedValue(0)
			mockPrisma.archetype.delete.mockResolvedValue({ id: 1 })

			await deleteArchetypeService(1)

			expect(mockPrisma.archetype.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true, name: true },
			})

			expect(mockPrisma.character.count).toHaveBeenCalledWith({
				where: { archetypeId: 1 },
			})

			expect(mockPrisma.archetype.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			})
		})

		it('should throw EntityNotFoundError when archetype not found', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue(null)

			await expect(deleteArchetypeService(999)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw BusinessLogicError when archetype is being used by characters', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue({ id: 1, name: 'Test Archetype' })
			mockPrisma.character.count.mockResolvedValue(5)

			await expect(deleteArchetypeService(1)).rejects.toThrow(BusinessLogicError)
		})

		it('should rethrow specific errors', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.archetype.findUnique.mockRejectedValue(validationError)

			await expect(deleteArchetypeService(1)).rejects.toThrow('Test error')
		})

		it('should wrap other errors', async () => {
			mockPrisma.archetype.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(deleteArchetypeService(1)).rejects.toThrow('Failed to delete archetype')
		})
	})

	describe('checkArchetypeNameExistsService', () => {
		it('should throw ValidationError for invalid name', async () => {
			await expect(checkArchetypeNameExistsService('')).rejects.toThrow(ValidationError)
			await expect(checkArchetypeNameExistsService('   ')).rejects.toThrow(ValidationError)
			await expect(checkArchetypeNameExistsService(null as any)).rejects.toThrow(ValidationError)
			await expect(checkArchetypeNameExistsService(123 as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid excludeId', async () => {
			await expect(checkArchetypeNameExistsService('Test', 0)).rejects.toThrow(ValidationError)
			await expect(checkArchetypeNameExistsService('Test', -1)).rejects.toThrow(ValidationError)
			await expect(checkArchetypeNameExistsService('Test', 1.5)).rejects.toThrow(ValidationError)
		})

		it('should return true when name exists', async () => {
			mockPrisma.archetype.findFirst.mockResolvedValue({ id: 1 })

			const result = await checkArchetypeNameExistsService('Test Archetype')

			expect(mockPrisma.archetype.findFirst).toHaveBeenCalledWith({
				where: { name: 'Test Archetype' },
				select: { id: true },
			})

			expect(result).toBe(true)
		})

		it('should return false when name does not exist', async () => {
			mockPrisma.archetype.findFirst.mockResolvedValue(null)

			const result = await checkArchetypeNameExistsService('Non-existent Archetype')

			expect(result).toBe(false)
		})

		it('should exclude specified ID', async () => {
			mockPrisma.archetype.findFirst.mockResolvedValue(null)

			await checkArchetypeNameExistsService('Test Archetype', 1)

			expect(mockPrisma.archetype.findFirst).toHaveBeenCalledWith({
				where: {
					name: 'Test Archetype',
					id: { not: 1 },
				},
				select: { id: true },
			})
		})

		it('should wrap errors', async () => {
			mockPrisma.archetype.findFirst.mockRejectedValue(new Error('Database error'))

			await expect(checkArchetypeNameExistsService('Test')).rejects.toThrow(
				'Failed to check archetype name existence',
			)
		})
	})

	describe('associateArchetypeSkillsService', () => {
		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (fn: any) => {
				if (typeof fn === 'function') {
					return await fn(mockPrisma)
				}
				return fn
			})
		})

		it('should throw ValidationError for invalid archetype ID', async () => {
			await expect(associateArchetypeSkillsService(0, [1])).rejects.toThrow(ValidationError)
			await expect(associateArchetypeSkillsService(-1, [1])).rejects.toThrow(ValidationError)
			await expect(associateArchetypeSkillsService(1.5, [1])).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid skill IDs array', async () => {
			await expect(associateArchetypeSkillsService(1, null as any)).rejects.toThrow(ValidationError)
			await expect(associateArchetypeSkillsService(1, 'not-array' as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid skill IDs', async () => {
			await expect(associateArchetypeSkillsService(1, [0])).rejects.toThrow(ValidationError)
			await expect(associateArchetypeSkillsService(1, [-1])).rejects.toThrow(ValidationError)
			await expect(associateArchetypeSkillsService(1, [1.5])).rejects.toThrow(ValidationError)
		})

		it('should associate skills successfully', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.skill.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
			mockPrisma.archetype.update.mockResolvedValue({})

			await associateArchetypeSkillsService(1, [1, 2])

			expect(mockPrisma.archetype.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true },
			})

			expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
				where: { id: { in: [1, 2] } },
				select: { id: true },
			})

			expect(mockPrisma.archetype.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					skills: {
						connect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should handle duplicate skill IDs', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.skill.findMany.mockResolvedValue([{ id: 1 }])
			mockPrisma.archetype.update.mockResolvedValue({})

			await associateArchetypeSkillsService(1, [1, 1, 1])

			expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
				where: { id: { in: [1] } },
				select: { id: true },
			})
		})

		it('should throw EntityNotFoundError when archetype not found', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue(null)

			await expect(associateArchetypeSkillsService(999, [1])).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw EntityNotFoundError when skills not found', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.skill.findMany.mockResolvedValue([{ id: 1 }])

			await expect(associateArchetypeSkillsService(1, [1, 999])).rejects.toThrow(EntityNotFoundError)
		})

		it('should wrap other errors', async () => {
			mockPrisma.archetype.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(associateArchetypeSkillsService(1, [1])).rejects.toThrow(
				'Failed to associate skills with archetype',
			)
		})
	})

	describe('dissociateArchetypeSkillsService', () => {
		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (fn: any) => {
				if (typeof fn === 'function') {
					return await fn(mockPrisma)
				}
				return fn
			})
		})

		it('should throw ValidationError for invalid archetype ID', async () => {
			await expect(dissociateArchetypeSkillsService(0, [1])).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid skill IDs', async () => {
			await expect(dissociateArchetypeSkillsService(1, [0])).rejects.toThrow(ValidationError)
		})

		it('should dissociate skills successfully', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.archetype.update.mockResolvedValue({})

			await dissociateArchetypeSkillsService(1, [1, 2])

			expect(mockPrisma.archetype.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					skills: {
						disconnect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should throw EntityNotFoundError when archetype not found', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue(null)

			await expect(dissociateArchetypeSkillsService(999, [1])).rejects.toThrow(EntityNotFoundError)
		})
	})

	describe('associateArchetypeTagsService', () => {
		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (fn: any) => {
				if (typeof fn === 'function') {
					return await fn(mockPrisma)
				}
				return fn
			})
		})

		it('should throw ValidationError for invalid archetype ID', async () => {
			await expect(associateArchetypeTagsService(0, [1])).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid tag IDs', async () => {
			await expect(associateArchetypeTagsService(1, [0])).rejects.toThrow(ValidationError)
		})

		it('should associate tags successfully', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.tag.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
			mockPrisma.archetype.update.mockResolvedValue({})

			await associateArchetypeTagsService(1, [1, 2])

			expect(mockPrisma.archetype.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					tags: {
						connect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should throw EntityNotFoundError when tags not found', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.tag.findMany.mockResolvedValue([{ id: 1 }])

			await expect(associateArchetypeTagsService(1, [1, 999])).rejects.toThrow(EntityNotFoundError)
		})
	})

	describe('dissociateArchetypeTagsService', () => {
		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (fn: any) => {
				if (typeof fn === 'function') {
					return await fn(mockPrisma)
				}
				return fn
			})
		})

		it('should dissociate tags successfully', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.archetype.update.mockResolvedValue({})

			await dissociateArchetypeTagsService(1, [1, 2])

			expect(mockPrisma.archetype.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					tags: {
						disconnect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should throw EntityNotFoundError when archetype not found', async () => {
			mockPrisma.archetype.findUnique.mockResolvedValue(null)

			await expect(dissociateArchetypeTagsService(999, [1])).rejects.toThrow(EntityNotFoundError)
		})
	})
})
