import ValidationError from '../src/errors/validation.error.js'

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

import { getArchetypeService, getArchetypesService } from '../src/services/archetypes.service.js'

describe('Archetypes Service (Basic)', () => {
	beforeEach(() => {
		jest.clearAllMocks()

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
	})

	describe('getArchetypeService', () => {
		it('should throw ValidationError for invalid id', async () => {
			await expect(getArchetypeService(0)).rejects.toThrow(ValidationError)
		})
	})
})
