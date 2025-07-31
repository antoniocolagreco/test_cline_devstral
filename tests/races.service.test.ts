import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock Prisma client
const mockPrisma = {
	race: {
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
	skill: {
		findMany: jest.fn(),
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
	associateRaceSkillsService,
	associateRaceTagsService,
	checkRaceNameExistsService,
	createRaceService,
	deleteRaceService,
	dissociateRaceSkillsService,
	dissociateRaceTagsService,
	getRaceService,
	getRacesService,
	updateRaceService,
} from '../src/services/races.service.js'

describe('Races Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getRacesService', () => {
		const mockRaces = [
			{
				id: 1,
				name: 'Human',
				description: 'Versatile and adaptable race',
				healthModifier: 0,
				staminaModifier: 0,
				manaModifier: 0,
				strengthModifier: 0,
				dexterityModifier: 0,
				constitutionModifier: 0,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 1,
				createdAt: new Date('2023-01-01T00:00:00.000Z'),
				updatedAt: new Date('2023-01-01T00:00:00.000Z'),
				skills: [{ id: 1, name: 'Diplomacy' }],
				tags: [{ id: 1, name: 'Common' }],
			},
			{
				id: 2,
				name: 'Elf',
				description: null,
				healthModifier: -1,
				staminaModifier: 0,
				manaModifier: 2,
				strengthModifier: -1,
				dexterityModifier: 2,
				constitutionModifier: -1,
				intelligenceModifier: 1,
				wisdomModifier: 1,
				charismaModifier: 0,
				createdAt: new Date('2023-01-02T00:00:00.000Z'),
				updatedAt: new Date('2023-01-02T00:00:00.000Z'),
				skills: [{ id: 2, name: 'Archery' }],
				tags: [{ id: 2, name: 'Magical' }],
			},
		]

		it('should return paginated races with default parameters', async () => {
			mockPrisma.$transaction.mockImplementation(async (_queries) => {
				return [mockRaces, 2]
			})

			const result = await getRacesService({})

			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)

			expect(result).toEqual({
				data: [
					{
						id: 1,
						name: 'Human',
						description: 'Versatile and adaptable race',
						healthModifier: 0,
						staminaModifier: 0,
						manaModifier: 0,
						strengthModifier: 0,
						dexterityModifier: 0,
						constitutionModifier: 0,
						intelligenceModifier: 0,
						wisdomModifier: 0,
						charismaModifier: 1,
						createdAt: '2023-01-01T00:00:00.000Z',
						updatedAt: '2023-01-01T00:00:00.000Z',
						skills: [{ id: 1, name: 'Diplomacy' }],
						tags: [{ id: 1, name: 'Common' }],
					},
					{
						id: 2,
						name: 'Elf',
						description: undefined,
						healthModifier: -1,
						staminaModifier: 0,
						manaModifier: 2,
						strengthModifier: -1,
						dexterityModifier: 2,
						constitutionModifier: -1,
						intelligenceModifier: 1,
						wisdomModifier: 1,
						charismaModifier: 0,
						createdAt: '2023-01-02T00:00:00.000Z',
						updatedAt: '2023-01-02T00:00:00.000Z',
						skills: [{ id: 2, name: 'Archery' }],
						tags: [{ id: 2, name: 'Magical' }],
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

		it('should return paginated races with custom parameters', async () => {
			mockPrisma.$transaction.mockImplementation(async (_queries) => {
				return [mockRaces.slice(0, 1), 2]
			})

			const result = await getRacesService({
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

			await getRacesService({
				search: { name: 'Human' } as any,
			})

			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
		})

		it('should throw ValidationError for invalid page number', async () => {
			await expect(getRacesService({ page: 0 })).rejects.toThrow(ValidationError)
			await expect(getRacesService({ page: -1 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid page size', async () => {
			await expect(getRacesService({ pageSize: 0 })).rejects.toThrow(ValidationError)
			await expect(getRacesService({ pageSize: 101 })).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(getRacesService({})).rejects.toThrow('Failed to retrieve races: Database error')
		})

		it('should preserve ValidationError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.$transaction.mockRejectedValue(validationError)

			await expect(getRacesService({})).rejects.toThrow(ValidationError)
		})
	})

	describe('getRaceService', () => {
		const mockRace = {
			id: 1,
			name: 'Human',
			description: 'Versatile and adaptable race',
			healthModifier: 0,
			staminaModifier: 0,
			manaModifier: 0,
			strengthModifier: 0,
			dexterityModifier: 0,
			constitutionModifier: 0,
			intelligenceModifier: 0,
			wisdomModifier: 0,
			charismaModifier: 1,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			skills: [{ id: 1, name: 'Diplomacy' }],
			tags: [{ id: 1, name: 'Common' }],
		}

		it('should return a race by id', async () => {
			mockPrisma.race.findUnique.mockResolvedValue(mockRace)

			const result = await getRaceService(1)

			expect(mockPrisma.race.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: expect.objectContaining({
					id: true,
					name: true,
					description: true,
					healthModifier: true,
					staminaModifier: true,
					manaModifier: true,
					strengthModifier: true,
					dexterityModifier: true,
					constitutionModifier: true,
					intelligenceModifier: true,
					wisdomModifier: true,
					charismaModifier: true,
					createdAt: true,
					updatedAt: true,
					skills: expect.any(Object),
					tags: expect.any(Object),
				}),
			})

			expect(result).toEqual({
				id: 1,
				name: 'Human',
				description: 'Versatile and adaptable race',
				healthModifier: 0,
				staminaModifier: 0,
				manaModifier: 0,
				strengthModifier: 0,
				dexterityModifier: 0,
				constitutionModifier: 0,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 1,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
				skills: [{ id: 1, name: 'Diplomacy' }],
				tags: [{ id: 1, name: 'Common' }],
			})
		})

		it('should return null when race not found', async () => {
			mockPrisma.race.findUnique.mockResolvedValue(null)

			const result = await getRaceService(999)

			expect(result).toBeNull()
		})

		it('should convert null description to undefined', async () => {
			mockPrisma.race.findUnique.mockResolvedValue({
				...mockRace,
				description: null,
			})

			const result = await getRaceService(1)

			expect(result?.description).toBeUndefined()
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(getRaceService(0)).rejects.toThrow(ValidationError)
			await expect(getRaceService(-1)).rejects.toThrow(ValidationError)
			await expect(getRaceService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.race.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(getRaceService(1)).rejects.toThrow('Failed to retrieve race: Database error')
		})

		it('should preserve ValidationError when thrown', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.race.findUnique.mockRejectedValue(validationError)

			await expect(getRaceService(1)).rejects.toThrow(ValidationError)
		})
	})

	describe('createRaceService', () => {
		const mockCreatedRace = {
			id: 1,
			name: 'Human',
			description: 'Versatile and adaptable race',
			healthModifier: 0,
			staminaModifier: 0,
			manaModifier: 0,
			strengthModifier: 0,
			dexterityModifier: 0,
			constitutionModifier: 0,
			intelligenceModifier: 0,
			wisdomModifier: 0,
			charismaModifier: 1,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			skills: [],
			tags: [],
		}

		it('should create a new race', async () => {
			const mockTx = {
				race: {
					findFirst: jest.fn().mockResolvedValue(null),
					create: jest.fn().mockResolvedValue(mockCreatedRace),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			const result = await createRaceService({
				name: 'Human',
				description: 'Versatile and adaptable race',
				healthModifier: 0,
				staminaModifier: 0,
				manaModifier: 0,
				strengthModifier: 0,
				dexterityModifier: 0,
				constitutionModifier: 0,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 1,
			})

			expect(mockTx.race.findFirst).toHaveBeenCalledWith({
				where: { name: 'Human' },
				select: { id: true },
			})

			expect(mockTx.race.create).toHaveBeenCalledWith({
				data: {
					name: 'Human',
					description: 'Versatile and adaptable race',
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 1,
				},
				select: expect.any(Object),
			})

			expect(result).toEqual({
				id: 1,
				name: 'Human',
				description: 'Versatile and adaptable race',
				healthModifier: 0,
				staminaModifier: 0,
				manaModifier: 0,
				strengthModifier: 0,
				dexterityModifier: 0,
				constitutionModifier: 0,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 1,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
				skills: [],
				tags: [],
			})
		})

		it('should create a race without description', async () => {
			const mockTx = {
				race: {
					findFirst: jest.fn().mockResolvedValue(null),
					create: jest.fn().mockResolvedValue({ ...mockCreatedRace, description: null }),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			const result = await createRaceService({
				name: 'Human',
				healthModifier: 0,
				staminaModifier: 0,
				manaModifier: 0,
				strengthModifier: 0,
				dexterityModifier: 0,
				constitutionModifier: 0,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 1,
			})

			expect(mockTx.race.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					description: null,
				}),
				select: expect.any(Object),
			})

			expect(result.description).toBeUndefined()
		})

		it('should trim race name and description before creating', async () => {
			const mockTx = {
				race: {
					findFirst: jest.fn().mockResolvedValue(null),
					create: jest.fn().mockResolvedValue(mockCreatedRace),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			await createRaceService({
				name: '  Human  ',
				description: '  Versatile and adaptable race  ',
				healthModifier: 0,
				staminaModifier: 0,
				manaModifier: 0,
				strengthModifier: 0,
				dexterityModifier: 0,
				constitutionModifier: 0,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 1,
			})

			expect(mockTx.race.findFirst).toHaveBeenCalledWith({
				where: { name: 'Human' },
				select: { id: true },
			})

			expect(mockTx.race.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					name: 'Human',
					description: 'Versatile and adaptable race',
				}),
				select: expect.any(Object),
			})
		})

		it('should throw ValidationError for missing name', async () => {
			await expect(
				createRaceService({
					name: '',
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(ValidationError)

			await expect(
				createRaceService({
					name: '   ',
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name type', async () => {
			await expect(
				createRaceService({
					name: undefined as any,
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(ValidationError)

			await expect(
				createRaceService({
					name: 123 as any,
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for name too long', async () => {
			const longName = 'a'.repeat(51)
			await expect(
				createRaceService({
					name: longName,
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid description type', async () => {
			await expect(
				createRaceService({
					name: 'Human',
					description: 123 as any,
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for description too long', async () => {
			const longDescription = 'a'.repeat(501)
			await expect(
				createRaceService({
					name: 'Human',
					description: longDescription,
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid stat modifiers', async () => {
			// Test out of range values
			await expect(
				createRaceService({
					name: 'Human',
					healthModifier: 11, // Too high
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(ValidationError)

			await expect(
				createRaceService({
					name: 'Human',
					healthModifier: 0,
					staminaModifier: -11, // Too low
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(ValidationError)

			// Test non-integer values
			await expect(
				createRaceService({
					name: 'Human',
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 1.5, // Not an integer
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw BusinessLogicError when race name already exists', async () => {
			const mockTx = {
				race: {
					findFirst: jest.fn().mockResolvedValue({ id: 1 }),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			await expect(
				createRaceService({
					name: 'Human',
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(BusinessLogicError)
		})

		it('should handle Prisma unique constraint violation', async () => {
			const mockTx = {
				race: {
					findFirst: jest.fn().mockResolvedValue(null),
					create: jest
						.fn()
						.mockRejectedValue(Object.assign(new Error('Unique constraint violation'), { code: 'P2002' })),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			await expect(
				createRaceService({
					name: 'Human',
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow(BusinessLogicError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(
				createRaceService({
					name: 'Human',
					healthModifier: 0,
					staminaModifier: 0,
					manaModifier: 0,
					strengthModifier: 0,
					dexterityModifier: 0,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 0,
					charismaModifier: 0,
				}),
			).rejects.toThrow('Failed to create race: Database error')
		})
	})

	describe('updateRaceService', () => {
		const mockUpdatedRace = {
			id: 1,
			name: 'Updated Human',
			description: 'Updated description',
			healthModifier: 1,
			staminaModifier: 0,
			manaModifier: 0,
			strengthModifier: 0,
			dexterityModifier: 0,
			constitutionModifier: 0,
			intelligenceModifier: 0,
			wisdomModifier: 0,
			charismaModifier: 2,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-02T00:00:00.000Z'),
			skills: [],
			tags: [],
		}

		it('should update a race with all fields', async () => {
			mockPrisma.race.findFirst.mockResolvedValue(null)
			mockPrisma.race.update.mockResolvedValue(mockUpdatedRace)

			const result = await updateRaceService({
				id: 1,
				name: 'Updated Human',
				description: 'Updated description',
				healthModifier: 1,
				charismaModifier: 2,
			})

			expect(mockPrisma.race.findFirst).toHaveBeenCalledWith({
				where: { name: 'Updated Human', id: { not: 1 } },
				select: { id: true },
			})

			expect(mockPrisma.race.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: 'Updated Human',
					description: 'Updated description',
					healthModifier: 1,
					charismaModifier: 2,
				},
				select: expect.any(Object),
			})

			expect(result).toEqual({
				id: 1,
				name: 'Updated Human',
				description: 'Updated description',
				healthModifier: 1,
				staminaModifier: 0,
				manaModifier: 0,
				strengthModifier: 0,
				dexterityModifier: 0,
				constitutionModifier: 0,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 2,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-02T00:00:00.000Z',
				skills: [],
				tags: [],
			})
		})

		it('should update with partial data (name only)', async () => {
			mockPrisma.race.findFirst.mockResolvedValue(null)
			mockPrisma.race.update.mockResolvedValue(mockUpdatedRace)

			await updateRaceService({ id: 1, name: 'Updated Human' })

			expect(mockPrisma.race.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { name: 'Updated Human' },
				select: expect.any(Object),
			})
		})

		it('should update with stat modifiers only', async () => {
			mockPrisma.race.update.mockResolvedValue(mockUpdatedRace)

			await updateRaceService({
				id: 1,
				healthModifier: 1,
				charismaModifier: 2,
			})

			expect(mockPrisma.race.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					healthModifier: 1,
					charismaModifier: 2,
				},
				select: expect.any(Object),
			})
		})

		it('should set description to null when empty string provided', async () => {
			mockPrisma.race.update.mockResolvedValue(mockUpdatedRace)

			await updateRaceService({ id: 1, description: '   ' })

			expect(mockPrisma.race.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { description: null },
				select: expect.any(Object),
			})
		})

		it('should return null when race not found', async () => {
			const notFoundError = Object.assign(new Error('Record not found'), { code: 'P2025' })
			mockPrisma.race.update.mockRejectedValue(notFoundError)

			const result = await updateRaceService({ id: 999, name: 'Nonexistent Race' })

			expect(result).toBeNull()
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(updateRaceService({ id: 0, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateRaceService({ id: -1, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateRaceService({ id: 1.5, name: 'Test' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name', async () => {
			await expect(updateRaceService({ id: 1, name: '' })).rejects.toThrow(ValidationError)
			await expect(updateRaceService({ id: 1, name: '   ' })).rejects.toThrow(ValidationError)
			await expect(updateRaceService({ id: 1, name: 'a'.repeat(51) })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid stat modifiers', async () => {
			await expect(updateRaceService({ id: 1, healthModifier: 11 })).rejects.toThrow(ValidationError)
			await expect(updateRaceService({ id: 1, strengthModifier: -11 })).rejects.toThrow(ValidationError)
			await expect(updateRaceService({ id: 1, dexterityModifier: 1.5 })).rejects.toThrow(ValidationError)
		})

		it('should throw BusinessLogicError when race name already exists for different race', async () => {
			mockPrisma.race.findFirst.mockResolvedValue({ id: 2 })

			await expect(updateRaceService({ id: 1, name: 'Existing Name' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle Prisma unique constraint violation', async () => {
			mockPrisma.race.findFirst.mockResolvedValue(null)
			const constraintError = Object.assign(new Error('Unique constraint violation'), { code: 'P2002' })
			mockPrisma.race.update.mockRejectedValue(constraintError)

			await expect(updateRaceService({ id: 1, name: 'Human' })).rejects.toThrow(BusinessLogicError)
		})

		it('should handle database errors', async () => {
			mockPrisma.race.findFirst.mockResolvedValue(null)
			mockPrisma.race.update.mockRejectedValue(new Error('Database error'))

			await expect(updateRaceService({ id: 1, name: 'Test' })).rejects.toThrow(
				'Failed to update race: Database error',
			)
		})
	})

	describe('deleteRaceService', () => {
		it('should delete a race successfully', async () => {
			const mockTx = {
				race: {
					findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Human' }),
					delete: jest.fn().mockResolvedValue(undefined),
				},
				character: { count: jest.fn().mockResolvedValue(0) },
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await deleteRaceService(1)

			expect(mockTx.race.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true, name: true },
			})

			expect(mockTx.race.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			})
		})

		it('should throw EntityNotFoundError when race does not exist', async () => {
			const mockTx = {
				race: {
					findUnique: jest.fn().mockResolvedValue(null),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(deleteRaceService(999)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw BusinessLogicError when race is being used by characters', async () => {
			const mockTx = {
				race: {
					findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Human' }),
				},
				character: { count: jest.fn().mockResolvedValue(3) },
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(deleteRaceService(1)).rejects.toThrow(BusinessLogicError)
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(deleteRaceService(0)).rejects.toThrow(ValidationError)
			await expect(deleteRaceService(-1)).rejects.toThrow(ValidationError)
			await expect(deleteRaceService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(deleteRaceService(1)).rejects.toThrow('Failed to delete race: Database error')
		})
	})

	describe('checkRaceNameExistsService', () => {
		it('should return true when race name exists', async () => {
			mockPrisma.race.findFirst.mockResolvedValue({ id: 1 })

			const result = await checkRaceNameExistsService('Human')

			expect(mockPrisma.race.findFirst).toHaveBeenCalledWith({
				where: { name: 'Human' },
				select: { id: true },
			})

			expect(result).toBe(true)
		})

		it('should return false when race name does not exist', async () => {
			mockPrisma.race.findFirst.mockResolvedValue(null)

			const result = await checkRaceNameExistsService('Nonexistent Race')

			expect(result).toBe(false)
		})

		it('should exclude specific id when provided', async () => {
			mockPrisma.race.findFirst.mockResolvedValue(null)

			await checkRaceNameExistsService('Human', 1)

			expect(mockPrisma.race.findFirst).toHaveBeenCalledWith({
				where: { name: 'Human', id: { not: 1 } },
				select: { id: true },
			})
		})

		it('should throw ValidationError for invalid input', async () => {
			await expect(checkRaceNameExistsService('')).rejects.toThrow(ValidationError)
			await expect(checkRaceNameExistsService('   ')).rejects.toThrow(ValidationError)
			await expect(checkRaceNameExistsService(null as any)).rejects.toThrow(ValidationError)
			await expect(checkRaceNameExistsService('Human', 0)).rejects.toThrow(ValidationError)
		})
	})

	describe('associateRaceSkillsService', () => {
		it('should associate skills with race successfully', async () => {
			const mockTx = {
				race: {
					findUnique: jest.fn().mockResolvedValue({ id: 1 }),
					update: jest.fn().mockResolvedValue(undefined),
				},
				skill: {
					findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await associateRaceSkillsService(1, [1, 2])

			expect(mockTx.race.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					skills: {
						connect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should throw ValidationError for invalid input', async () => {
			await expect(associateRaceSkillsService(0, [1])).rejects.toThrow(ValidationError)
			await expect(associateRaceSkillsService(1, 'not-array' as any)).rejects.toThrow(ValidationError)
			await expect(associateRaceSkillsService(1, [0])).rejects.toThrow(ValidationError)
		})

		it('should throw EntityNotFoundError when race does not exist', async () => {
			const mockTx = {
				race: {
					findUnique: jest.fn().mockResolvedValue(null),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(associateRaceSkillsService(999, [1])).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw EntityNotFoundError when some skills do not exist', async () => {
			const mockTx = {
				race: {
					findUnique: jest.fn().mockResolvedValue({ id: 1 }),
				},
				skill: {
					findMany: jest.fn().mockResolvedValue([{ id: 1 }]), // Only skill 1 exists
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(associateRaceSkillsService(1, [1, 2])).rejects.toThrow(EntityNotFoundError)
		})
	})

	describe('dissociateRaceSkillsService', () => {
		it('should dissociate skills from race successfully', async () => {
			const mockTx = {
				race: {
					findUnique: jest.fn().mockResolvedValue({ id: 1 }),
					update: jest.fn().mockResolvedValue(undefined),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await dissociateRaceSkillsService(1, [1, 2])

			expect(mockTx.race.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					skills: {
						disconnect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should throw ValidationError for invalid input', async () => {
			await expect(dissociateRaceSkillsService(0, [1])).rejects.toThrow(ValidationError)
			await expect(dissociateRaceSkillsService(1, 'not-array' as any)).rejects.toThrow(ValidationError)
		})

		it('should throw EntityNotFoundError when race does not exist', async () => {
			const mockTx = {
				race: {
					findUnique: jest.fn().mockResolvedValue(null),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(dissociateRaceSkillsService(999, [1])).rejects.toThrow(EntityNotFoundError)
		})
	})

	describe('associateRaceTagsService', () => {
		it('should associate tags with race successfully', async () => {
			const mockTx = {
				race: {
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

			await associateRaceTagsService(1, [1, 2])

			expect(mockTx.race.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					tags: {
						connect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should throw ValidationError for invalid input', async () => {
			await expect(associateRaceTagsService(0, [1])).rejects.toThrow(ValidationError)
			await expect(associateRaceTagsService(1, 'not-array' as any)).rejects.toThrow(ValidationError)
		})

		it('should throw EntityNotFoundError when race does not exist', async () => {
			const mockTx = {
				race: {
					findUnique: jest.fn().mockResolvedValue(null),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(associateRaceTagsService(999, [1])).rejects.toThrow(EntityNotFoundError)
		})
	})

	describe('dissociateRaceTagsService', () => {
		it('should dissociate tags from race successfully', async () => {
			const mockTx = {
				race: {
					findUnique: jest.fn().mockResolvedValue({ id: 1 }),
					update: jest.fn().mockResolvedValue(undefined),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await dissociateRaceTagsService(1, [1, 2])

			expect(mockTx.race.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					tags: {
						disconnect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should throw ValidationError for invalid input', async () => {
			await expect(dissociateRaceTagsService(0, [1])).rejects.toThrow(ValidationError)
			await expect(dissociateRaceTagsService(1, 'not-array' as any)).rejects.toThrow(ValidationError)
		})

		it('should throw EntityNotFoundError when race does not exist', async () => {
			const mockTx = {
				race: {
					findUnique: jest.fn().mockResolvedValue(null),
				},
			}

			mockPrisma.$transaction.mockImplementation(async (callback) => {
				await callback(mockTx)
			})

			await expect(dissociateRaceTagsService(999, [1])).rejects.toThrow(EntityNotFoundError)
		})
	})
})
