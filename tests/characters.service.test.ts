import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock Prisma client
const mockPrisma = {
	character: {
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
	},
	race: {
		findUnique: jest.fn(),
	},
	archetype: {
		findUnique: jest.fn(),
	},
	$transaction: jest.fn(),
}

// Mock the prisma module
jest.mock('../src/index.js', () => ({
	prisma: mockPrisma,
}))

import {
	createCharacterService,
	deleteCharacterService,
	getCharacterService,
	getCharactersService,
	updateCharacterService,
} from '../src/services/characters.service.js'

describe('Characters Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()

		// Default transaction implementation
		mockPrisma.$transaction.mockImplementation(async (queries: any) => {
			if (Array.isArray(queries)) {
				// For array format like [findMany, count] - return the resolved values
				return [await mockPrisma.character.findMany(), await mockPrisma.character.count()]
			}
			if (typeof queries === 'function') {
				return await queries(mockPrisma)
			}
			return queries
		})
	})

	describe('getCharactersService', () => {
		const mockCharacter = {
			id: 1,
			name: 'Test Warrior',
			surname: 'Brave',
			nickname: 'Hero',
			description: 'A brave warrior',
			avatarPath: '/avatars/warrior.png',
			health: 100,
			stamina: 80,
			mana: 50,
			strength: 15,
			dexterity: 12,
			constitution: 14,
			intelligence: 10,
			wisdom: 11,
			charisma: 13,
			isPublic: true,
			raceId: 1,
			archetypeId: 1,
			userId: 1,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			race: {
				healthModifier: 10,
				staminaModifier: 5,
				manaModifier: 0,
				strengthModifier: 2,
				dexterityModifier: 1,
				constitutionModifier: 2,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 1,
			},
			primaryWeapon: null,
			secondaryWeapon: null,
			shield: null,
			armor: null,
			firstRing: null,
			secondRing: null,
			amulet: null,
		}

		it('should return paginated characters with default parameters', async () => {
			const mockCharacters = [mockCharacter]
			mockPrisma.character.findMany.mockResolvedValue(mockCharacters)
			mockPrisma.character.count.mockResolvedValue(1)

			const result = await getCharactersService({})

			expect(mockPrisma.character.findMany).toHaveBeenCalledWith({
				where: undefined,
				orderBy: { name: 'asc' },
				skip: 0,
				take: 10,
				select: expect.objectContaining({
					id: true,
					name: true,
				}),
			})

			expect(result).toEqual({
				data: [
					expect.objectContaining({
						id: 1,
						name: 'Test Warrior',
						surname: 'Brave',
						nickname: 'Hero',
						createdAt: '2023-01-01T00:00:00.000Z',
						updatedAt: '2023-01-01T00:00:00.000Z',
					}),
				],
				pagination: {
					page: 1,
					pageSize: 10,
					total: 1,
					totalPages: 1,
				},
			})
		})

		it('should return paginated characters with custom parameters', async () => {
			const mockCharacters = [mockCharacter]
			mockPrisma.character.findMany.mockResolvedValue(mockCharacters)
			mockPrisma.character.count.mockResolvedValue(1)

			const result = await getCharactersService({ page: 2, pageSize: 5 })

			expect(mockPrisma.character.findMany).toHaveBeenCalledWith({
				where: undefined,
				orderBy: { name: 'asc' },
				skip: 5,
				take: 5,
				select: expect.any(Object),
			})

			expect(result.pagination).toEqual({
				page: 2,
				pageSize: 5,
				total: 1,
				totalPages: 1,
			})
		})

		it('should handle search parameters', async () => {
			const mockCharacters = [mockCharacter]
			mockPrisma.character.findMany.mockResolvedValue(mockCharacters)
			mockPrisma.character.count.mockResolvedValue(1)

			await getCharactersService({ search: { name: 'Test' } as any })

			expect(mockPrisma.character.findMany).toHaveBeenCalledWith({
				where: { name: { contains: 'Test' } },
				orderBy: { name: 'asc' },
				skip: 0,
				take: 10,
				select: expect.any(Object),
			})
		})

		it('should handle custom orderBy parameters', async () => {
			const mockCharacters = [mockCharacter]
			mockPrisma.character.findMany.mockResolvedValue(mockCharacters)
			mockPrisma.character.count.mockResolvedValue(1)

			await getCharactersService({ orderBy: { field: 'createdAt', direction: 'desc' } })

			expect(mockPrisma.character.findMany).toHaveBeenCalledWith({
				where: undefined,
				orderBy: { createdAt: 'desc' },
				skip: 0,
				take: 10,
				select: expect.any(Object),
			})
		})

		it('should throw ValidationError for invalid page number', async () => {
			await expect(getCharactersService({ page: 0 })).rejects.toThrow(ValidationError)
			await expect(getCharactersService({ page: -1 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid pageSize', async () => {
			await expect(getCharactersService({ pageSize: 0 })).rejects.toThrow(ValidationError)
			await expect(getCharactersService({ pageSize: 101 })).rejects.toThrow(ValidationError)
		})

		it('should handle ValidationError from transformSearchToQuery', async () => {
			// Re-throwing a ValidationError should preserve it
			mockPrisma.$transaction.mockRejectedValue(new ValidationError('Custom validation error'))

			await expect(getCharactersService({})).rejects.toThrow(ValidationError)
			await expect(getCharactersService({})).rejects.toThrow('Custom validation error')
		})
	})

	describe('getCharacterService', () => {
		const mockCharacter = {
			id: 1,
			name: 'Test Warrior',
			surname: 'Brave',
			nickname: 'Hero',
			description: 'A brave warrior',
			avatarPath: '/avatars/warrior.png',
			health: 100,
			stamina: 80,
			mana: 50,
			strength: 15,
			dexterity: 12,
			constitution: 14,
			intelligence: 10,
			wisdom: 11,
			charisma: 13,
			isPublic: true,
			raceId: 1,
			archetypeId: 1,
			userId: 1,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			race: {
				healthModifier: 10,
				staminaModifier: 5,
				manaModifier: 0,
				strengthModifier: 2,
				dexterityModifier: 1,
				constitutionModifier: 2,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 1,
			},
			primaryWeapon: null,
			secondaryWeapon: null,
			shield: null,
			armor: null,
			firstRing: null,
			secondRing: null,
			amulet: null,
		}

		it('should return character when found', async () => {
			mockPrisma.character.findUnique.mockResolvedValue(mockCharacter)

			const result = await getCharacterService(1)

			expect(mockPrisma.character.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: expect.any(Object),
			})

			expect(result).toEqual(
				expect.objectContaining({
					id: 1,
					name: 'Test Warrior',
					surname: 'Brave',
					nickname: 'Hero',
				}),
			)
		})

		it('should return null when character not found', async () => {
			mockPrisma.character.findUnique.mockResolvedValue(null)

			const result = await getCharacterService(1)

			expect(result).toBeNull()
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(getCharacterService(0)).rejects.toThrow(ValidationError)
			await expect(getCharacterService(-1)).rejects.toThrow(ValidationError)
			await expect(getCharacterService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should handle ValidationError properly', async () => {
			// Re-throwing a ValidationError should preserve it
			mockPrisma.character.findUnique.mockRejectedValue(new ValidationError('Custom validation error'))

			await expect(getCharacterService(1)).rejects.toThrow(ValidationError)
			await expect(getCharacterService(1)).rejects.toThrow('Custom validation error')
		})
	})

	describe('createCharacterService', () => {
		const validCharacterData = {
			name: 'Test Warrior',
			surname: 'Brave',
			nickname: 'Hero',
			description: 'A brave warrior',
			avatarPath: '/avatars/warrior.png',
			health: 100,
			stamina: 80,
			mana: 50,
			strength: 15,
			dexterity: 12,
			constitution: 14,
			intelligence: 10,
			wisdom: 11,
			charisma: 13,
			isPublic: true,
			raceId: 1,
			archetypeId: 1,
			userId: 1,
		}

		const mockCreatedCharacter = {
			id: 1,
			...validCharacterData,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			race: {
				healthModifier: 10,
				staminaModifier: 5,
				manaModifier: 0,
				strengthModifier: 2,
				dexterityModifier: 1,
				constitutionModifier: 2,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 1,
			},
			primaryWeapon: null,
			secondaryWeapon: null,
			shield: null,
			armor: null,
			firstRing: null,
			secondRing: null,
			amulet: null,
		}

		beforeEach(() => {
			// Mock successful creation flow
			mockPrisma.$transaction.mockImplementation(async (callback) => {
				const tx = {
					user: {
						findUnique: jest.fn().mockResolvedValue({ id: 1, isActive: true }),
					},
					race: {
						findUnique: jest.fn().mockResolvedValue({ id: 1 }),
					},
					archetype: {
						findUnique: jest.fn().mockResolvedValue({ id: 1 }),
					},
					character: {
						findFirst: jest.fn().mockResolvedValue(null),
						create: jest.fn().mockResolvedValue({ id: 1 }),
					},
				}
				return await callback(tx)
			})

			// Mock getCharacterService call
			mockPrisma.character.findUnique.mockResolvedValue(mockCreatedCharacter)
		})

		it('should create character successfully', async () => {
			const result = await createCharacterService(validCharacterData)

			expect(result).toEqual(
				expect.objectContaining({
					id: 1,
					name: 'Test Warrior',
					surname: 'Brave',
				}),
			)
		})

		it('should throw ValidationError for missing required fields', async () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { name: _, ...invalidData } = validCharacterData

			await expect(createCharacterService(invalidData as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid stat values', async () => {
			const invalidData = { ...validCharacterData, strength: 0 }

			await expect(createCharacterService(invalidData)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for stat values exceeding maximum', async () => {
			const invalidData = { ...validCharacterData, strength: 21 }

			await expect(createCharacterService(invalidData)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid resource values', async () => {
			const invalidData = { ...validCharacterData, health: 0 }

			await expect(createCharacterService(invalidData)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid boolean field', async () => {
			const invalidData = { ...validCharacterData, isPublic: 'true' as any }

			await expect(createCharacterService(invalidData)).rejects.toThrow(ValidationError)
		})

		it('should throw EntityNotFoundError when user does not exist', async () => {
			mockPrisma.$transaction.mockImplementation(async (callback) => {
				const tx = {
					user: {
						findUnique: jest.fn().mockResolvedValue(null),
					},
				}
				return await callback(tx)
			})

			await expect(createCharacterService(validCharacterData)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw BusinessLogicError when user is inactive', async () => {
			mockPrisma.$transaction.mockImplementation(async (callback) => {
				const tx = {
					user: {
						findUnique: jest.fn().mockResolvedValue({ id: 1, isActive: false }),
					},
				}
				return await callback(tx)
			})

			await expect(createCharacterService(validCharacterData)).rejects.toThrow(BusinessLogicError)
		})

		it('should throw EntityNotFoundError when race does not exist', async () => {
			mockPrisma.$transaction.mockImplementation(async (callback) => {
				const tx = {
					user: {
						findUnique: jest.fn().mockResolvedValue({ id: 1, isActive: true }),
					},
					race: {
						findUnique: jest.fn().mockResolvedValue(null),
					},
				}
				return await callback(tx)
			})

			await expect(createCharacterService(validCharacterData)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw EntityNotFoundError when archetype does not exist', async () => {
			mockPrisma.$transaction.mockImplementation(async (callback) => {
				const tx = {
					user: {
						findUnique: jest.fn().mockResolvedValue({ id: 1, isActive: true }),
					},
					race: {
						findUnique: jest.fn().mockResolvedValue({ id: 1 }),
					},
					archetype: {
						findUnique: jest.fn().mockResolvedValue(null),
					},
				}
				return await callback(tx)
			})

			await expect(createCharacterService(validCharacterData)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw ValidationError for invalid avatarPath type', async () => {
			const invalidData = { ...validCharacterData, avatarPath: 123 as any }

			await expect(createCharacterService(invalidData)).rejects.toThrow(ValidationError)
		})

		it('should create character with empty avatarPath', async () => {
			const dataWithEmptyPath = { ...validCharacterData, avatarPath: '   ' }

			const result = await createCharacterService(dataWithEmptyPath)

			expect(result).toEqual(
				expect.objectContaining({
					id: 1,
					name: 'Test Warrior',
				}),
			)
		})

		it('should create character without optional fields', async () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { surname, nickname, description, avatarPath, ...minimalData } = validCharacterData

			const result = await createCharacterService(minimalData)

			expect(result).toEqual(
				expect.objectContaining({
					id: 1,
					name: 'Test Warrior',
				}),
			)
		})

		it('should throw error when created character cannot be retrieved', async () => {
			// Mock successful creation but getCharacterService returns null
			mockPrisma.character.findUnique.mockResolvedValue(null)

			await expect(createCharacterService(validCharacterData)).rejects.toThrow(
				'Failed to retrieve created character',
			)
		})
	})

	describe('updateCharacterService', () => {
		const mockExistingCharacter = {
			id: 1,
			name: 'Old Name',
			surname: 'Old Surname',
			nickname: 'Old Nick',
			description: 'Old description',
			avatarPath: '/old/path.png',
			health: 90,
			stamina: 70,
			mana: 40,
			strength: 14,
			dexterity: 11,
			constitution: 13,
			intelligence: 9,
			wisdom: 10,
			charisma: 12,
			isPublic: false,
			raceId: 1,
			archetypeId: 1,
			userId: 1,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-02T00:00:00.000Z'),
			race: {
				healthModifier: 10,
				staminaModifier: 5,
				manaModifier: 0,
				strengthModifier: 2,
				dexterityModifier: 1,
				constitutionModifier: 2,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 1,
			},
			primaryWeapon: null,
			secondaryWeapon: null,
			shield: null,
			armor: null,
			firstRing: null,
			secondRing: null,
			amulet: null,
		}

		beforeEach(() => {
			// Mock successful update flow
			mockPrisma.character.findUnique.mockResolvedValue(mockExistingCharacter)
			mockPrisma.character.update.mockResolvedValue({ id: 1 })
			mockPrisma.character.findFirst.mockResolvedValue(null)
		})

		it('should update character successfully', async () => {
			const updateData = {
				id: 1,
				name: 'Updated Name',
				surname: 'Updated Surname',
			}

			const result = await updateCharacterService(updateData)

			expect(mockPrisma.character.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: 'Updated Name',
					surname: 'Updated Surname',
				},
				select: { id: true },
			})

			expect(result).toEqual(expect.objectContaining({ id: 1 }))
		})

		it('should return null when character not found', async () => {
			const updateData = { id: 999, name: 'New Name' }

			// Mock Prisma P2025 error (record not found)
			const prismaError = new Error('Record to update not found')
			;(prismaError as any).code = 'P2025'
			mockPrisma.character.update.mockRejectedValue(prismaError)

			const result = await updateCharacterService(updateData)

			expect(result).toBeNull()
		})

		it('should throw ValidationError for invalid id', async () => {
			const updateData = { id: 0, name: 'New Name' }

			await expect(updateCharacterService(updateData)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid stat values', async () => {
			const updateData = { id: 1, strength: 0 }

			await expect(updateCharacterService(updateData)).rejects.toThrow(ValidationError)
		})

		it('should throw EntityNotFoundError when referenced user does not exist', async () => {
			const updateData = { id: 1, userId: 999 }

			mockPrisma.user.findUnique.mockResolvedValue(null)

			await expect(updateCharacterService(updateData)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw BusinessLogicError when trying to assign to inactive user', async () => {
			const updateData = { id: 1, userId: 2 }

			mockPrisma.user.findUnique.mockResolvedValue({ id: 2, isActive: false })

			await expect(updateCharacterService(updateData)).rejects.toThrow(BusinessLogicError)
		})

		it('should throw EntityNotFoundError when referenced race does not exist', async () => {
			const updateData = { id: 1, raceId: 999 }

			mockPrisma.race.findUnique.mockResolvedValue(null)

			await expect(updateCharacterService(updateData)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw EntityNotFoundError when referenced archetype does not exist', async () => {
			const updateData = { id: 1, archetypeId: 999 }

			mockPrisma.archetype.findUnique.mockResolvedValue(null)

			await expect(updateCharacterService(updateData)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw BusinessLogicError when character name already exists for user', async () => {
			const updateData = { id: 1, name: 'Existing Name' }

			mockPrisma.character.findFirst.mockResolvedValue({ id: 2 })

			await expect(updateCharacterService(updateData)).rejects.toThrow(BusinessLogicError)
		})

		it('should throw ValidationError for invalid avatarPath type', async () => {
			const updateData = { id: 1, avatarPath: 123 as any }

			await expect(updateCharacterService(updateData)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid boolean type', async () => {
			const updateData = { id: 1, isPublic: 'true' as any }

			await expect(updateCharacterService(updateData)).rejects.toThrow(ValidationError)
		})

		it('should update character with empty avatarPath', async () => {
			const updateData = { id: 1, avatarPath: '   ' }

			const result = await updateCharacterService(updateData)

			expect(mockPrisma.character.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					avatarPath: null,
				},
				select: { id: true },
			})

			expect(result).toEqual(expect.objectContaining({ id: 1 }))
		})

		it('should update character when current character has different userId', async () => {
			const updateData = { id: 1, name: 'New Name', userId: 2 }

			// Mock character with different userId
			mockPrisma.character.findUnique.mockResolvedValue({
				...mockExistingCharacter,
				userId: 1, // Different from updateData.userId
			})

			// Mock user validation
			mockPrisma.user.findUnique.mockResolvedValue({ id: 2, isActive: true })

			const result = await updateCharacterService(updateData)

			expect(result).toEqual(expect.objectContaining({ id: 1 }))
		})

		it('should check name uniqueness when only name is updated (no userId change)', async () => {
			const updateData = { id: 1, name: 'New Name' }

			// Mock current character
			mockPrisma.character.findUnique.mockResolvedValue({
				...mockExistingCharacter,
				userId: 1,
			})

			// Mock no existing character with same name
			mockPrisma.character.findFirst.mockResolvedValue(null)

			const result = await updateCharacterService(updateData)

			expect(mockPrisma.character.findFirst).toHaveBeenCalledWith({
				where: {
					name: 'New Name',
					userId: 1, // Using current character's userId
					id: { not: 1 },
				},
				select: { id: true },
			})

			expect(result).toEqual(expect.objectContaining({ id: 1 }))
		})

		it('should throw error when updated character cannot be retrieved', async () => {
			const updateData = { id: 1, name: 'New Name' }

			// Mock successful update but getCharacterService returns null
			mockPrisma.character.findUnique.mockResolvedValueOnce(mockExistingCharacter)
			mockPrisma.character.findUnique.mockResolvedValueOnce(null) // After update

			await expect(updateCharacterService(updateData)).rejects.toThrow('Failed to retrieve updated character')
		})

		it('should handle Prisma unique constraint violation', async () => {
			const updateData = { id: 1, name: 'Duplicate Name' }

			// Mock Prisma P2002 error (unique constraint violation)
			const prismaError = new Error('Unique constraint failed')
			;(prismaError as any).code = 'P2002'
			mockPrisma.character.update.mockRejectedValue(prismaError)

			await expect(updateCharacterService(updateData)).rejects.toThrow(BusinessLogicError)
		})
	})

	describe('deleteCharacterService', () => {
		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (callback) => {
				const tx = {
					character: {
						findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Test Character' }),
						delete: jest.fn().mockResolvedValue({ id: 1 }),
					},
				}
				return await callback(tx)
			})
		})

		it('should delete character successfully', async () => {
			await deleteCharacterService(1)

			expect(mockPrisma.$transaction).toHaveBeenCalled()
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(deleteCharacterService(0)).rejects.toThrow(ValidationError)
			await expect(deleteCharacterService(-1)).rejects.toThrow(ValidationError)
			await expect(deleteCharacterService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should throw EntityNotFoundError when character does not exist', async () => {
			mockPrisma.$transaction.mockImplementation(async (callback) => {
				const tx = {
					character: {
						findUnique: jest.fn().mockResolvedValue(null),
					},
				}
				return await callback(tx)
			})

			await expect(deleteCharacterService(1)).rejects.toThrow(EntityNotFoundError)
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(deleteCharacterService(1)).rejects.toThrow('Failed to delete character')
		})
	})
})
