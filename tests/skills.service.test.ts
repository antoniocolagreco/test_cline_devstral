import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock Prisma client
const mockPrisma = {
	skill: {
		findMany: jest.fn(),
		count: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	archetype: {
		count: jest.fn(),
	},
	race: {
		count: jest.fn(),
	},
	tag: {
		findMany: jest.fn(),
	},
	$transaction: jest.fn(),
}

// Mock the prisma import
jest.mock('../src/index.js', () => ({
	prisma: mockPrisma,
}))

import {
	associateSkillTagsService,
	checkSkillNameExistsService,
	createSkillService,
	deleteSkillService,
	dissociateSkillTagsService,
	getSkillService,
	getSkillsService,
	updateSkillService,
} from '../src/services/skills.service.js'

describe('Skills Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getSkillsService', () => {
		const mockSkills = [
			{
				id: 1,
				name: 'Fireball',
				description: 'A powerful fire spell',
				createdAt: new Date('2023-01-01T00:00:00.000Z'),
				updatedAt: new Date('2023-01-01T00:00:00.000Z'),
				tags: [
					{ id: 1, name: 'Fire' },
					{ id: 2, name: 'Magic' },
				],
			},
			{
				id: 2,
				name: 'Healing Light',
				description: null,
				createdAt: new Date('2023-01-02T00:00:00.000Z'),
				updatedAt: new Date('2023-01-02T00:00:00.000Z'),
				tags: [{ id: 3, name: 'Healing' }],
			},
		]

		it('should return paginated skills with default parameters', async () => {
			mockPrisma.$transaction.mockImplementation(async (_queries) => {
				return [mockSkills, 2]
			})

			const result = await getSkillsService({})

			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)

			expect(result).toEqual({
				data: [
					{
						id: 1,
						name: 'Fireball',
						description: 'A powerful fire spell',
						createdAt: '2023-01-01T00:00:00.000Z',
						updatedAt: '2023-01-01T00:00:00.000Z',
						tags: [
							{ id: 1, name: 'Fire' },
							{ id: 2, name: 'Magic' },
						],
					},
					{
						id: 2,
						name: 'Healing Light',
						description: undefined,
						createdAt: '2023-01-02T00:00:00.000Z',
						updatedAt: '2023-01-02T00:00:00.000Z',
						tags: [{ id: 3, name: 'Healing' }],
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

		it('should return paginated skills with custom parameters', async () => {
			mockPrisma.$transaction.mockImplementation(async (_queries) => {
				return [mockSkills.slice(0, 1), 2]
			})

			const result = await getSkillsService({
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

			await getSkillsService({
				search: { name: 'Fire' } as any,
			})

			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
		})

		it('should throw ValidationError for invalid page number', async () => {
			await expect(getSkillsService({ page: 0 })).rejects.toThrow(ValidationError)
			await expect(getSkillsService({ page: -1 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid page size', async () => {
			await expect(getSkillsService({ pageSize: 0 })).rejects.toThrow(ValidationError)
			await expect(getSkillsService({ pageSize: 101 })).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(getSkillsService({})).rejects.toThrow('Failed to retrieve skills: Database error')
		})

		it('should preserve ValidationError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.$transaction.mockRejectedValue(validationError)

			await expect(getSkillsService({})).rejects.toThrow(ValidationError)
		})
	})

	describe('getSkillService', () => {
		const mockSkill = {
			id: 1,
			name: 'Fireball',
			description: 'A powerful fire spell',
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			tags: [
				{ id: 1, name: 'Fire' },
				{ id: 2, name: 'Magic' },
			],
		}

		it('should return a skill by id', async () => {
			mockPrisma.skill.findUnique.mockResolvedValue(mockSkill)

			const result = await getSkillService(1)

			expect(mockPrisma.skill.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: {
					id: true,
					name: true,
					description: true,
					createdAt: true,
					updatedAt: true,
					tags: {
						select: {
							id: true,
							name: true,
						},
						orderBy: {
							name: 'asc',
						},
					},
				},
			})

			expect(result).toEqual({
				id: 1,
				name: 'Fireball',
				description: 'A powerful fire spell',
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
				tags: [
					{ id: 1, name: 'Fire' },
					{ id: 2, name: 'Magic' },
				],
			})
		})

		it('should return null when skill not found', async () => {
			mockPrisma.skill.findUnique.mockResolvedValue(null)

			const result = await getSkillService(999)

			expect(result).toBeNull()
		})

		it('should convert null description to undefined', async () => {
			mockPrisma.skill.findUnique.mockResolvedValue({
				...mockSkill,
				description: null,
			})

			const result = await getSkillService(1)

			expect(result?.description).toBeUndefined()
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(getSkillService(0)).rejects.toThrow(ValidationError)
			await expect(getSkillService(-1)).rejects.toThrow(ValidationError)
			await expect(getSkillService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.skill.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(getSkillService(1)).rejects.toThrow('Failed to retrieve skill: Database error')
		})

		it('should preserve ValidationError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.skill.findUnique.mockRejectedValue(validationError)

			await expect(getSkillService(1)).rejects.toThrow(ValidationError)
		})
	})

	describe('createSkillService', () => {
		const mockCreatedSkill = {
			id: 1,
			name: 'Fireball',
			description: 'A powerful fire spell',
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			tags: [],
		}

		it('should create a new skill', async () => {
			const mockTx = {
				skill: {
					findFirst: jest.fn().mockResolvedValue(null),
					create: jest.fn().mockResolvedValue(mockCreatedSkill),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			const result = await createSkillService({
				name: 'Fireball',
				description: 'A powerful fire spell',
			})

			expect(mockTx.skill.findFirst).toHaveBeenCalledWith({
				where: { name: 'Fireball' },
				select: { id: true },
			})

			expect(mockTx.skill.create).toHaveBeenCalledWith({
				data: {
					name: 'Fireball',
					description: 'A powerful fire spell',
				},
				select: expect.any(Object),
			})

			expect(result).toEqual({
				id: 1,
				name: 'Fireball',
				description: 'A powerful fire spell',
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
				tags: [],
			})
		})

		it('should create a skill without description', async () => {
			const mockTx = {
				skill: {
					findFirst: jest.fn().mockResolvedValue(null),
					create: jest.fn().mockResolvedValue({ ...mockCreatedSkill, description: null }),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			const result = await createSkillService({
				name: 'Fireball',
			})

			expect(mockTx.skill.create).toHaveBeenCalledWith({
				data: {
					name: 'Fireball',
					description: null,
				},
				select: expect.any(Object),
			})

			expect(result.description).toBeUndefined()
		})

		it('should trim skill name and description before creating', async () => {
			const mockTx = {
				skill: {
					findFirst: jest.fn().mockResolvedValue(null),
					create: jest.fn().mockResolvedValue(mockCreatedSkill),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			await createSkillService({
				name: '  Fireball  ',
				description: '  A powerful fire spell  ',
			})

			expect(mockTx.skill.findFirst).toHaveBeenCalledWith({
				where: { name: 'Fireball' },
				select: { id: true },
			})

			expect(mockTx.skill.create).toHaveBeenCalledWith({
				data: {
					name: 'Fireball',
					description: 'A powerful fire spell',
				},
				select: expect.any(Object),
			})
		})

		it('should throw ValidationError for missing name', async () => {
			await expect(createSkillService({ name: '' })).rejects.toThrow(ValidationError)
			await expect(createSkillService({ name: '   ' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name type', async () => {
			await expect(createSkillService({ name: undefined as any })).rejects.toThrow(ValidationError)
			await expect(createSkillService({ name: null as any })).rejects.toThrow(ValidationError)
			await expect(createSkillService({ name: 123 as any })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for name too long', async () => {
			const longName = 'a'.repeat(101)
			await expect(createSkillService({ name: longName })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid description type', async () => {
			await expect(createSkillService({ name: 'Fireball', description: 123 as any })).rejects.toThrow(
				ValidationError,
			)
		})

		it('should throw ValidationError for description too long', async () => {
			const longDescription = 'a'.repeat(501)
			await expect(createSkillService({ name: 'Fireball', description: longDescription })).rejects.toThrow(
				ValidationError,
			)
		})

		it('should throw BusinessLogicError when skill name already exists', async () => {
			const mockTx = {
				skill: {
					findFirst: jest.fn().mockResolvedValue({ id: 1 }),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			await expect(createSkillService({ name: 'Fireball' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle Prisma unique constraint violation', async () => {
			const mockTx = {
				skill: {
					findFirst: jest.fn().mockResolvedValue(null),
					create: jest
						.fn()
						.mockRejectedValue(Object.assign(new Error('Unique constraint violation'), { code: 'P2002' })),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			await expect(createSkillService({ name: 'Fireball' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(createSkillService({ name: 'Fireball' })).rejects.toThrow(
				'Failed to create skill: Database error',
			)
		})

		it('should preserve ValidationError and BusinessLogicError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.$transaction.mockRejectedValue(validationError)

			await expect(createSkillService({ name: 'Fireball' })).rejects.toThrow(ValidationError)
		})
	})

	describe('updateSkillService', () => {
		const mockUpdatedSkill = {
			id: 1,
			name: 'Updated Fireball',
			description: 'Updated description',
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-02T00:00:00.000Z'),
			tags: [],
		}

		it('should update a skill', async () => {
			mockPrisma.skill.findFirst.mockResolvedValue(null)
			mockPrisma.skill.update.mockResolvedValue(mockUpdatedSkill)

			const result = await updateSkillService({
				id: 1,
				name: 'Updated Fireball',
				description: 'Updated description',
			})

			expect(mockPrisma.skill.findFirst).toHaveBeenCalledWith({
				where: { name: 'Updated Fireball', id: { not: 1 } },
				select: { id: true },
			})

			expect(mockPrisma.skill.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: 'Updated Fireball',
					description: 'Updated description',
				},
				select: expect.any(Object),
			})

			expect(result).toEqual({
				id: 1,
				name: 'Updated Fireball',
				description: 'Updated description',
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-02T00:00:00.000Z',
				tags: [],
			})
		})

		it('should update with partial data (name only)', async () => {
			mockPrisma.skill.findFirst.mockResolvedValue(null)
			mockPrisma.skill.update.mockResolvedValue(mockUpdatedSkill)

			await updateSkillService({ id: 1, name: 'Updated Fireball' })

			expect(mockPrisma.skill.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { name: 'Updated Fireball' },
				select: expect.any(Object),
			})
		})

		it('should update with partial data (description only)', async () => {
			mockPrisma.skill.update.mockResolvedValue(mockUpdatedSkill)

			await updateSkillService({ id: 1, description: 'Updated description' })

			expect(mockPrisma.skill.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { description: 'Updated description' },
				select: expect.any(Object),
			})
		})

		it('should set description to null when empty string provided', async () => {
			mockPrisma.skill.update.mockResolvedValue(mockUpdatedSkill)

			await updateSkillService({ id: 1, description: '   ' })

			expect(mockPrisma.skill.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { description: null },
				select: expect.any(Object),
			})
		})

		it('should return null when skill not found', async () => {
			const notFoundError = Object.assign(new Error('Record not found'), { code: 'P2025' })
			mockPrisma.skill.update.mockRejectedValue(notFoundError)

			const result = await updateSkillService({ id: 999, name: 'Nonexistent Skill' })

			expect(result).toBeNull()
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(updateSkillService({ id: 0, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateSkillService({ id: -1, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateSkillService({ id: 1.5, name: 'Test' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name type', async () => {
			await expect(updateSkillService({ id: 1, name: 123 as any })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for empty name', async () => {
			await expect(updateSkillService({ id: 1, name: '' })).rejects.toThrow(ValidationError)
			await expect(updateSkillService({ id: 1, name: '   ' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for name too long', async () => {
			const longName = 'a'.repeat(101)
			await expect(updateSkillService({ id: 1, name: longName })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid description type', async () => {
			await expect(updateSkillService({ id: 1, description: 123 as any })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for description too long', async () => {
			const longDescription = 'a'.repeat(501)
			await expect(updateSkillService({ id: 1, description: longDescription })).rejects.toThrow(ValidationError)
		})

		it('should throw BusinessLogicError when skill name already exists for different skill', async () => {
			mockPrisma.skill.findFirst.mockResolvedValue({ id: 2 })

			await expect(updateSkillService({ id: 1, name: 'Existing Name' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle Prisma unique constraint violation', async () => {
			mockPrisma.skill.findFirst.mockResolvedValue(null)
			const constraintError = Object.assign(new Error('Unique constraint violation'), { code: 'P2002' })
			mockPrisma.skill.update.mockRejectedValue(constraintError)

			await expect(updateSkillService({ id: 1, name: 'Fireball' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle database errors', async () => {
			mockPrisma.skill.findFirst.mockResolvedValue(null)
			mockPrisma.skill.update.mockRejectedValue(new Error('Database error'))

			await expect(updateSkillService({ id: 1, name: 'Test' })).rejects.toThrow(
				'Failed to update skill: Database error',
			)
		})

		it('should preserve ValidationError and BusinessLogicError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.skill.findFirst.mockRejectedValue(validationError)

			await expect(updateSkillService({ id: 1, name: 'Test' })).rejects.toThrow(ValidationError)
		})
	})

	describe('deleteSkillService', () => {
		it('should delete a skill successfully', async () => {
			const mockTx = {
				skill: {
					findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Fireball' }),
					delete: jest.fn().mockResolvedValue(undefined),
				},
				archetype: { count: jest.fn().mockResolvedValue(0) },
				race: { count: jest.fn().mockResolvedValue(0) },
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await deleteSkillService(1)

			expect(mockTx.skill.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true, name: true },
			})

			expect(mockTx.skill.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			})
		})

		it('should throw EntityNotFoundError when skill does not exist', async () => {
			const mockTx = {
				skill: {
					findUnique: jest.fn().mockResolvedValue(null),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(deleteSkillService(999)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw BusinessLogicError when skill is being used', async () => {
			const mockTx = {
				skill: {
					findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Fireball' }),
				},
				archetype: { count: jest.fn().mockResolvedValue(2) },
				race: { count: jest.fn().mockResolvedValue(1) },
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(deleteSkillService(1)).rejects.toThrow(BusinessLogicError)
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(deleteSkillService(0)).rejects.toThrow(ValidationError)
			await expect(deleteSkillService(-1)).rejects.toThrow(ValidationError)
			await expect(deleteSkillService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(deleteSkillService(1)).rejects.toThrow('Failed to delete skill: Database error')
		})

		it('should preserve specific errors when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.$transaction.mockRejectedValue(validationError)

			await expect(deleteSkillService(1)).rejects.toThrow(ValidationError)
		})
	})

	describe('checkSkillNameExistsService', () => {
		it('should return true when skill name exists', async () => {
			mockPrisma.skill.findFirst.mockResolvedValue({ id: 1 })

			const result = await checkSkillNameExistsService('Fireball')

			expect(mockPrisma.skill.findFirst).toHaveBeenCalledWith({
				where: { name: 'Fireball' },
				select: { id: true },
			})

			expect(result).toBe(true)
		})

		it('should return false when skill name does not exist', async () => {
			mockPrisma.skill.findFirst.mockResolvedValue(null)

			const result = await checkSkillNameExistsService('Nonexistent Skill')

			expect(result).toBe(false)
		})

		it('should exclude specific id when provided', async () => {
			mockPrisma.skill.findFirst.mockResolvedValue(null)

			await checkSkillNameExistsService('Fireball', 1)

			expect(mockPrisma.skill.findFirst).toHaveBeenCalledWith({
				where: { name: 'Fireball', id: { not: 1 } },
				select: { id: true },
			})
		})

		it('should trim skill name before checking', async () => {
			mockPrisma.skill.findFirst.mockResolvedValue(null)

			await checkSkillNameExistsService('  Fireball  ')

			expect(mockPrisma.skill.findFirst).toHaveBeenCalledWith({
				where: { name: 'Fireball' },
				select: { id: true },
			})
		})

		it('should throw ValidationError for invalid name', async () => {
			await expect(checkSkillNameExistsService('')).rejects.toThrow(ValidationError)
			await expect(checkSkillNameExistsService('   ')).rejects.toThrow(ValidationError)
			await expect(checkSkillNameExistsService(null as any)).rejects.toThrow(ValidationError)
			await expect(checkSkillNameExistsService(undefined as any)).rejects.toThrow(ValidationError)
			await expect(checkSkillNameExistsService(123 as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid excludeId', async () => {
			await expect(checkSkillNameExistsService('Fireball', 0)).rejects.toThrow(ValidationError)
			await expect(checkSkillNameExistsService('Fireball', -1)).rejects.toThrow(ValidationError)
			await expect(checkSkillNameExistsService('Fireball', 1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.skill.findFirst.mockRejectedValue(new Error('Database error'))

			await expect(checkSkillNameExistsService('Fireball')).rejects.toThrow(
				'Failed to check skill name existence: Database error',
			)
		})
	})

	describe('associateSkillTagsService', () => {
		it('should associate tags with skill successfully', async () => {
			const mockTx = {
				skill: {
					findUnique: jest.fn().mockResolvedValue({ id: 1 }),
					update: jest.fn().mockResolvedValue(undefined),
				},
				tag: {
					findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await associateSkillTagsService(1, [1, 2])

			expect(mockTx.skill.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true },
			})

			expect(mockTx.tag.findMany).toHaveBeenCalledWith({
				where: { id: { in: [1, 2] } },
				select: { id: true },
			})

			expect(mockTx.skill.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					tags: {
						connect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should remove duplicate tag IDs', async () => {
			const mockTx = {
				skill: {
					findUnique: jest.fn().mockResolvedValue({ id: 1 }),
					update: jest.fn().mockResolvedValue(undefined),
				},
				tag: {
					findMany: jest.fn().mockResolvedValue([{ id: 1 }]),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await associateSkillTagsService(1, [1, 1, 1])

			expect(mockTx.tag.findMany).toHaveBeenCalledWith({
				where: { id: { in: [1] } },
				select: { id: true },
			})
		})

		it('should throw ValidationError for invalid skill ID', async () => {
			await expect(associateSkillTagsService(0, [1])).rejects.toThrow(ValidationError)
			await expect(associateSkillTagsService(-1, [1])).rejects.toThrow(ValidationError)
			await expect(associateSkillTagsService(1.5, [1])).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid tag IDs array', async () => {
			await expect(associateSkillTagsService(1, 'not-array' as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid tag ID', async () => {
			await expect(associateSkillTagsService(1, [0])).rejects.toThrow(ValidationError)
			await expect(associateSkillTagsService(1, [-1])).rejects.toThrow(ValidationError)
			await expect(associateSkillTagsService(1, [1.5])).rejects.toThrow(ValidationError)
		})

		it('should throw EntityNotFoundError when skill does not exist', async () => {
			const mockTx = {
				skill: {
					findUnique: jest.fn().mockResolvedValue(null),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(associateSkillTagsService(999, [1])).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw EntityNotFoundError when some tags do not exist', async () => {
			const mockTx = {
				skill: {
					findUnique: jest.fn().mockResolvedValue({ id: 1 }),
				},
				tag: {
					findMany: jest.fn().mockResolvedValue([{ id: 1 }]), // Only tag 1 exists, tag 2 is missing
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(associateSkillTagsService(1, [1, 2])).rejects.toThrow(EntityNotFoundError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(associateSkillTagsService(1, [1])).rejects.toThrow(
				'Failed to associate tags with skill: Database error',
			)
		})
	})

	describe('dissociateSkillTagsService', () => {
		it('should dissociate tags from skill successfully', async () => {
			const mockTx = {
				skill: {
					findUnique: jest.fn().mockResolvedValue({ id: 1 }),
					update: jest.fn().mockResolvedValue(undefined),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await dissociateSkillTagsService(1, [1, 2])

			expect(mockTx.skill.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true },
			})

			expect(mockTx.skill.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					tags: {
						disconnect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should remove duplicate tag IDs', async () => {
			const mockTx = {
				skill: {
					findUnique: jest.fn().mockResolvedValue({ id: 1 }),
					update: jest.fn().mockResolvedValue(undefined),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await dissociateSkillTagsService(1, [1, 1, 1])

			expect(mockTx.skill.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					tags: {
						disconnect: [{ id: 1 }],
					},
				},
			})
		})

		it('should throw ValidationError for invalid skill ID', async () => {
			await expect(dissociateSkillTagsService(0, [1])).rejects.toThrow(ValidationError)
			await expect(dissociateSkillTagsService(-1, [1])).rejects.toThrow(ValidationError)
			await expect(dissociateSkillTagsService(1.5, [1])).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid tag IDs array', async () => {
			await expect(dissociateSkillTagsService(1, 'not-array' as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid tag ID', async () => {
			await expect(dissociateSkillTagsService(1, [0])).rejects.toThrow(ValidationError)
			await expect(dissociateSkillTagsService(1, [-1])).rejects.toThrow(ValidationError)
			await expect(dissociateSkillTagsService(1, [1.5])).rejects.toThrow(ValidationError)
		})

		it('should throw EntityNotFoundError when skill does not exist', async () => {
			const mockTx = {
				skill: {
					findUnique: jest.fn().mockResolvedValue(null),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(dissociateSkillTagsService(999, [1])).rejects.toThrow(EntityNotFoundError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(dissociateSkillTagsService(1, [1])).rejects.toThrow(
				'Failed to dissociate tags from skill: Database error',
			)
		})
	})
})
