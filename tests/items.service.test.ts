import ItemRarity from '../src/constants/item-rarity.constant.js'
import ValidationError from '../src/errors/validation.error.js'
import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'

// Mock Prisma client
const mockPrisma = {
	item: {
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
	createItemService,
	getItemService,
	getItemsService,
	updateItemService,
	deleteItemService,
	checkItemNameExistsService,
	associateItemTagsService,
	dissociateItemTagsService,
} from '../src/services/items.service.js'
import { transformSearchToQuery } from '../src/helpers/services.helper.js'

describe('Items Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(transformSearchToQuery as jest.Mock).mockReturnValue(undefined)

		// Default transaction implementation
		mockPrisma.$transaction.mockImplementation(async (queries: any) => {
			if (Array.isArray(queries)) {
				// For array format like [findMany, count] - return the resolved values
				return [await mockPrisma.item.findMany(), await mockPrisma.item.count()]
			}
			if (typeof queries === 'function') {
				return await queries(mockPrisma)
			}
			return queries
		})
	})

	describe('getItemsService', () => {
		const mockItem = {
			id: 1,
			name: 'Test Sword',
			description: 'A test sword',
			rarity: ItemRarity.COMMON,
			isWeapon: true,
			isShield: false,
			isArmor: false,
			isAccessory: false,
			isConsumable: false,
			isQuestItem: false,
			isCraftingMaterial: false,
			isMiscellaneous: false,
			attack: 10,
			defense: 0,
			requiredStrength: 5,
			requiredDexterity: 0,
			requiredConstitution: 0,
			requiredIntelligence: 0,
			requiredWisdom: 0,
			requiredCharisma: 0,
			bonusStrength: 0,
			bonusDexterity: 0,
			bonusConstitution: 0,
			bonusIntelligence: 0,
			bonusWisdom: 0,
			bonusCharisma: 0,
			bonusHealth: 0,
			durability: 100,
			weight: 5,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			tags: [{ id: 1, name: 'Weapon' }],
		}

		it('should return paginated items with default parameters', async () => {
			const mockItems = [mockItem]
			mockPrisma.item.findMany.mockResolvedValue(mockItems)
			mockPrisma.item.count.mockResolvedValue(1)

			const result = await getItemsService({})

			expect(mockPrisma.item.findMany).toHaveBeenCalledWith({
				where: undefined,
				orderBy: { name: 'asc' },
				skip: 0,
				take: 10,
				select: expect.objectContaining({
					id: true,
					name: true,
					description: true,
					rarity: true,
					tags: {
						select: { id: true, name: true },
						orderBy: { name: 'asc' },
					},
				}),
			})

			expect(result).toEqual({
				data: [
					{
						...mockItem,
						description: 'A test sword',
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
			await expect(getItemsService({ page: 0 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid page size', async () => {
			await expect(getItemsService({ pageSize: 0 })).rejects.toThrow(ValidationError)
			await expect(getItemsService({ pageSize: 101 })).rejects.toThrow(ValidationError)
		})

		it('should handle custom pagination parameters', async () => {
			const mockItems = [mockItem]
			mockPrisma.item.findMany.mockResolvedValue(mockItems)
			mockPrisma.item.count.mockResolvedValue(20)

			const result = await getItemsService({ page: 2, pageSize: 5 })

			expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
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
			const mockItems = [mockItem]
			mockPrisma.item.findMany.mockResolvedValue(mockItems)
			mockPrisma.item.count.mockResolvedValue(1)

			await getItemsService({ orderBy: { field: 'name', direction: 'desc' } })

			expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					orderBy: { name: 'desc' },
				}),
			)
		})

		it('should handle search query', async () => {
			const mockItems = [mockItem]
			const searchQuery = { name: { contains: 'sword' } }
			;(transformSearchToQuery as jest.Mock).mockReturnValue(searchQuery)

			mockPrisma.item.findMany.mockResolvedValue(mockItems)
			mockPrisma.item.count.mockResolvedValue(1)

			await getItemsService({
				search: { name: 'sword', rarity: ItemRarity.COMMON } as any,
			})

			expect(transformSearchToQuery).toHaveBeenCalledWith({
				name: 'sword',
				rarity: ItemRarity.COMMON,
			})
			expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: searchQuery,
				}),
			)
		})

		it('should handle null description', async () => {
			const itemWithNullDescription = { ...mockItem, description: null }
			mockPrisma.item.findMany.mockResolvedValue([itemWithNullDescription])
			mockPrisma.item.count.mockResolvedValue(1)

			const result = await getItemsService({})

			expect(result.data[0].description).toBeUndefined()
		})

		it('should rethrow ValidationError', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.$transaction.mockRejectedValue(validationError)

			await expect(getItemsService({})).rejects.toThrow('Test error')
		})

		it('should wrap other errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			await expect(getItemsService({})).rejects.toThrow('Failed to retrieve items')
		})
	})

	describe('getItemService', () => {
		const mockItem = {
			id: 1,
			name: 'Test Sword',
			description: 'A test sword',
			rarity: ItemRarity.COMMON,
			isWeapon: true,
			isShield: false,
			isArmor: false,
			isAccessory: false,
			isConsumable: false,
			isQuestItem: false,
			isCraftingMaterial: false,
			isMiscellaneous: false,
			attack: 10,
			defense: 0,
			requiredStrength: 5,
			requiredDexterity: 0,
			requiredConstitution: 0,
			requiredIntelligence: 0,
			requiredWisdom: 0,
			requiredCharisma: 0,
			bonusStrength: 0,
			bonusDexterity: 0,
			bonusConstitution: 0,
			bonusIntelligence: 0,
			bonusWisdom: 0,
			bonusCharisma: 0,
			bonusHealth: 0,
			durability: 100,
			weight: 5,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			tags: [{ id: 1, name: 'Weapon' }],
		}

		it('should throw ValidationError for invalid id', async () => {
			await expect(getItemService(0)).rejects.toThrow(ValidationError)
			await expect(getItemService(-1)).rejects.toThrow(ValidationError)
			await expect(getItemService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should return item when found', async () => {
			mockPrisma.item.findUnique.mockResolvedValue(mockItem)

			const result = await getItemService(1)

			expect(mockPrisma.item.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: expect.objectContaining({
					id: true,
					name: true,
					description: true,
					rarity: true,
					tags: expect.any(Object),
				}),
			})

			expect(result).toEqual({
				...mockItem,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			})
		})

		it('should return null when item not found', async () => {
			mockPrisma.item.findUnique.mockResolvedValue(null)

			const result = await getItemService(999)

			expect(result).toBeNull()
		})

		it('should handle null description', async () => {
			const itemWithNullDescription = { ...mockItem, description: null }
			mockPrisma.item.findUnique.mockResolvedValue(itemWithNullDescription)

			const result = await getItemService(1)

			expect(result?.description).toBeUndefined()
		})

		it('should rethrow ValidationError', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.item.findUnique.mockRejectedValue(validationError)

			await expect(getItemService(1)).rejects.toThrow('Test error')
		})

		it('should wrap other errors', async () => {
			mockPrisma.item.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(getItemService(1)).rejects.toThrow('Failed to retrieve item')
		})
	})

	describe('createItemService', () => {
		const validItemData = {
			name: 'Test Sword',
			description: 'A test sword',
			rarity: ItemRarity.COMMON,
			isWeapon: true,
			isShield: false,
			isArmor: false,
			isAccessory: false,
			isConsumable: false,
			isQuestItem: false,
			isCraftingMaterial: false,
			isMiscellaneous: false,
			attack: 10,
			defense: 0,
			requiredStrength: 5,
			requiredDexterity: 0,
			requiredConstitution: 0,
			requiredIntelligence: 0,
			requiredWisdom: 0,
			requiredCharisma: 0,
			bonusStrength: 0,
			bonusDexterity: 0,
			bonusConstitution: 0,
			bonusIntelligence: 0,
			bonusWisdom: 0,
			bonusCharisma: 0,
			bonusHealth: 0,
			durability: 100,
			weight: 5,
		}

		const mockCreatedItem = {
			id: 1,
			...validItemData,
			description: 'A test sword',
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-01T00:00:00.000Z'),
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
			await expect(createItemService({ name: '' } as any)).rejects.toThrow(ValidationError)
			await expect(createItemService({} as any)).rejects.toThrow(ValidationError)
			await expect(createItemService({ name: null } as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name type', async () => {
			await expect(createItemService({ name: 123 } as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for empty name', async () => {
			const dataWithEmptyName = { ...validItemData, name: '   ' }
			await expect(createItemService(dataWithEmptyName)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for name too long', async () => {
			const longName = 'a'.repeat(101)
			await expect(createItemService({ ...validItemData, name: longName })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid description type', async () => {
			await expect(createItemService({ ...validItemData, description: 123 } as any)).rejects.toThrow(
				ValidationError,
			)
		})

		it('should throw ValidationError for description too long', async () => {
			const longDescription = 'a'.repeat(501)
			await expect(createItemService({ ...validItemData, description: longDescription })).rejects.toThrow(
				ValidationError,
			)
		})

		it('should throw ValidationError for invalid rarity', async () => {
			await expect(createItemService({ ...validItemData, rarity: 'Invalid' as any })).rejects.toThrow(
				ValidationError,
			)
		})

		it('should throw ValidationError when no type flags are true', async () => {
			const noTypeData = {
				...validItemData,
				isWeapon: false,
				isShield: false,
				isArmor: false,
				isAccessory: false,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
			}
			await expect(createItemService(noTypeData)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for negative stats', async () => {
			await expect(createItemService({ ...validItemData, attack: -1 })).rejects.toThrow(ValidationError)
			await expect(createItemService({ ...validItemData, defense: -1 })).rejects.toThrow(ValidationError)
			await expect(createItemService({ ...validItemData, weight: -1 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for non-integer stats', async () => {
			await expect(createItemService({ ...validItemData, attack: 1.5 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for required stats exceeding 50', async () => {
			await expect(createItemService({ ...validItemData, requiredStrength: 51 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for bonus stats exceeding 50', async () => {
			await expect(createItemService({ ...validItemData, bonusStrength: 51 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid durability', async () => {
			await expect(createItemService({ ...validItemData, durability: 0 })).rejects.toThrow(ValidationError)
			await expect(createItemService({ ...validItemData, durability: 10001 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid weight', async () => {
			await expect(createItemService({ ...validItemData, weight: 0 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for weapon with zero attack', async () => {
			await expect(createItemService({ ...validItemData, isWeapon: true, attack: 0 })).rejects.toThrow(
				ValidationError,
			)
		})

		it('should throw ValidationError for armor with zero defense', async () => {
			await expect(
				createItemService({ ...validItemData, isWeapon: false, isArmor: true, attack: 0, defense: 0 }),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for shield with zero defense', async () => {
			await expect(
				createItemService({ ...validItemData, isWeapon: false, isShield: true, attack: 0, defense: 0 }),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for non-weapon with attack', async () => {
			await expect(
				createItemService({ ...validItemData, isWeapon: false, isMiscellaneous: true, attack: 10 }),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for consumable with high durability', async () => {
			await expect(
				createItemService({
					...validItemData,
					isWeapon: false,
					isConsumable: true,
					attack: 0,
					durability: 200,
				}),
			).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for quest item with low durability', async () => {
			await expect(
				createItemService({ ...validItemData, isWeapon: false, isQuestItem: true, attack: 0, durability: 500 }),
			).rejects.toThrow(ValidationError)
		})

		it('should create item successfully', async () => {
			mockPrisma.item.findFirst.mockResolvedValue(null)
			mockPrisma.item.create.mockResolvedValue(mockCreatedItem)

			const result = await createItemService(validItemData)

			expect(mockPrisma.item.findFirst).toHaveBeenCalledWith({
				where: { name: 'Test Sword' },
				select: { id: true },
			})

			expect(mockPrisma.item.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					name: 'Test Sword',
					description: 'A test sword',
					rarity: ItemRarity.COMMON,
				}),
				select: expect.objectContaining({
					id: true,
					name: true,
					description: true,
					tags: expect.any(Object),
				}),
			})

			expect(result).toEqual({
				...mockCreatedItem,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			})
		})

		it('should create item with trimmed name', async () => {
			mockPrisma.item.findFirst.mockResolvedValue(null)
			mockPrisma.item.create.mockResolvedValue(mockCreatedItem)

			await createItemService({ ...validItemData, name: '  Test Sword  ' })

			expect(mockPrisma.item.findFirst).toHaveBeenCalledWith({
				where: { name: 'Test Sword' },
				select: { id: true },
			})
		})

		it('should create item without description', async () => {
			const dataWithoutDescription = { ...validItemData }
			delete (dataWithoutDescription as any).description

			mockPrisma.item.findFirst.mockResolvedValue(null)
			mockPrisma.item.create.mockResolvedValue(mockCreatedItem)

			await createItemService(dataWithoutDescription)

			expect(mockPrisma.item.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					description: null,
				}),
				select: expect.any(Object),
			})
		})

		it('should throw BusinessLogicError when name already exists', async () => {
			mockPrisma.item.findFirst.mockResolvedValue({ id: 1 })

			await expect(createItemService(validItemData)).rejects.toThrow(BusinessLogicError)
		})

		it('should handle Prisma unique constraint violation', async () => {
			const prismaError = new Error('Unique constraint violation')
			;(prismaError as any).code = 'P2002'

			mockPrisma.item.findFirst.mockResolvedValue(null)
			mockPrisma.item.create.mockRejectedValue(prismaError)

			await expect(createItemService(validItemData)).rejects.toThrow(BusinessLogicError)
		})

		it('should rethrow ValidationError and BusinessLogicError', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.item.findFirst.mockRejectedValue(validationError)

			await expect(createItemService(validItemData)).rejects.toThrow('Test error')
		})

		it('should wrap other errors', async () => {
			mockPrisma.item.findFirst.mockRejectedValue(new Error('Database error'))

			await expect(createItemService(validItemData)).rejects.toThrow('Failed to create item')
		})
	})

	describe('updateItemService', () => {
		const mockUpdatedItem = {
			id: 1,
			name: 'Updated Sword',
			description: 'Updated description',
			rarity: ItemRarity.RARE,
			isWeapon: true,
			isShield: false,
			isArmor: false,
			isAccessory: false,
			isConsumable: false,
			isQuestItem: false,
			isCraftingMaterial: false,
			isMiscellaneous: false,
			attack: 15,
			defense: 0,
			requiredStrength: 10,
			requiredDexterity: 0,
			requiredConstitution: 0,
			requiredIntelligence: 0,
			requiredWisdom: 0,
			requiredCharisma: 0,
			bonusStrength: 5,
			bonusDexterity: 0,
			bonusConstitution: 0,
			bonusIntelligence: 0,
			bonusWisdom: 0,
			bonusCharisma: 0,
			bonusHealth: 0,
			durability: 150,
			weight: 7,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
			updatedAt: new Date('2023-01-02T00:00:00.000Z'),
			tags: [],
		}

		it('should throw ValidationError for invalid id', async () => {
			await expect(updateItemService({ id: 0, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateItemService({ id: -1, name: 'Test' })).rejects.toThrow(ValidationError)
			await expect(updateItemService({ id: 1.5, name: 'Test' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid name type', async () => {
			await expect(updateItemService({ id: 1, name: 123 } as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for empty name', async () => {
			await expect(updateItemService({ id: 1, name: '   ' })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for name too long', async () => {
			const longName = 'a'.repeat(101)
			await expect(updateItemService({ id: 1, name: longName })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid description type', async () => {
			await expect(updateItemService({ id: 1, description: 123 } as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for description too long', async () => {
			const longDescription = 'a'.repeat(501)
			await expect(updateItemService({ id: 1, description: longDescription })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid rarity', async () => {
			await expect(updateItemService({ id: 1, rarity: 'Invalid' as any })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for non-integer stats', async () => {
			await expect(updateItemService({ id: 1, attack: 1.5 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for negative stats', async () => {
			await expect(updateItemService({ id: 1, attack: -1 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for stats exceeding limits', async () => {
			await expect(updateItemService({ id: 1, requiredStrength: 51 })).rejects.toThrow(ValidationError)
			await expect(updateItemService({ id: 1, bonusStrength: 51 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid durability', async () => {
			await expect(updateItemService({ id: 1, durability: 0 })).rejects.toThrow(ValidationError)
			await expect(updateItemService({ id: 1, durability: 10001 })).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid weight', async () => {
			await expect(updateItemService({ id: 1, weight: 0 })).rejects.toThrow(ValidationError)
		})

		it('should update item successfully', async () => {
			mockPrisma.item.findFirst.mockResolvedValue(null)
			mockPrisma.item.update.mockResolvedValue(mockUpdatedItem)

			const result = await updateItemService({
				id: 1,
				name: 'Updated Sword',
				description: 'Updated description',
				rarity: ItemRarity.RARE,
			})

			expect(mockPrisma.item.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: 'Updated Sword',
					description: 'Updated description',
					rarity: ItemRarity.RARE,
				},
				select: expect.objectContaining({
					id: true,
					name: true,
					description: true,
					tags: expect.any(Object),
				}),
			})

			expect(result).toEqual({
				...mockUpdatedItem,
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-02T00:00:00.000Z',
			})
		})

		it('should update only provided fields', async () => {
			mockPrisma.item.update.mockResolvedValue(mockUpdatedItem)

			await updateItemService({ id: 1, name: 'Updated Sword' })

			expect(mockPrisma.item.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: 'Updated Sword',
				},
				select: expect.any(Object),
			})
		})

		it('should throw BusinessLogicError when name already exists for different item', async () => {
			mockPrisma.item.findFirst.mockResolvedValue({ id: 2 })

			await expect(updateItemService({ id: 1, name: 'Existing Name' })).rejects.toThrow(BusinessLogicError)
		})

		it('should validate item type logic when type flags are updated', async () => {
			mockPrisma.item.findUnique.mockResolvedValue({
				isWeapon: true,
				isShield: false,
				isArmor: false,
				isAccessory: false,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
				attack: 10,
				defense: 0,
				durability: 100,
			})

			await expect(updateItemService({ id: 1, attack: 0 })).rejects.toThrow(ValidationError)
		})

		it('should return null when item not found', async () => {
			const prismaError = new Error('Record not found')
			;(prismaError as any).code = 'P2025'

			mockPrisma.item.update.mockRejectedValue(prismaError)

			const result = await updateItemService({ id: 999, description: 'Test description' })

			expect(result).toBeNull()
		})

		it('should handle Prisma unique constraint violation', async () => {
			const prismaError = new Error('Unique constraint violation')
			;(prismaError as any).code = 'P2002'

			mockPrisma.item.findFirst.mockResolvedValue(null)
			mockPrisma.item.update.mockRejectedValue(prismaError)

			await expect(updateItemService({ id: 1, name: 'Test' })).rejects.toThrow(BusinessLogicError)
		})

		it('should wrap other errors', async () => {
			mockPrisma.item.update.mockRejectedValue(new Error('Database error'))

			await expect(updateItemService({ id: 1, name: 'Test' })).rejects.toThrow('Failed to update item')
		})
	})

	describe('deleteItemService', () => {
		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (fn: any) => {
				if (typeof fn === 'function') {
					return await fn(mockPrisma)
				}
				return fn
			})
		})

		it('should throw ValidationError for invalid id', async () => {
			await expect(deleteItemService(0)).rejects.toThrow(ValidationError)
			await expect(deleteItemService(-1)).rejects.toThrow(ValidationError)
			await expect(deleteItemService(1.5)).rejects.toThrow(ValidationError)
		})

		it('should delete item successfully', async () => {
			mockPrisma.item.findUnique.mockResolvedValue({ id: 1, name: 'Test Sword' })
			mockPrisma.character.count.mockResolvedValue(0)
			mockPrisma.item.delete.mockResolvedValue({ id: 1 })

			await deleteItemService(1)

			expect(mockPrisma.item.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true, name: true },
			})

			expect(mockPrisma.character.count).toHaveBeenCalledTimes(8) // All equipment slots + inventory

			expect(mockPrisma.item.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			})
		})

		it('should throw EntityNotFoundError when item not found', async () => {
			mockPrisma.item.findUnique.mockResolvedValue(null)

			await expect(deleteItemService(999)).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw BusinessLogicError when item is being used as primary weapon', async () => {
			mockPrisma.item.findUnique.mockResolvedValue({ id: 1, name: 'Test Sword' })
			mockPrisma.character.count
				.mockResolvedValueOnce(1) // primaryWeaponId
				.mockResolvedValue(0) // all others

			await expect(deleteItemService(1)).rejects.toThrow(BusinessLogicError)
		})

		it('should throw BusinessLogicError when item is being used in inventory', async () => {
			mockPrisma.item.findUnique.mockResolvedValue({ id: 1, name: 'Test Sword' })
			mockPrisma.character.count
				.mockResolvedValueOnce(0) // primaryWeaponId
				.mockResolvedValueOnce(0) // secondaryWeaponId
				.mockResolvedValueOnce(0) // shieldId
				.mockResolvedValueOnce(0) // armorId
				.mockResolvedValueOnce(0) // firstRingId
				.mockResolvedValueOnce(0) // secondRingId
				.mockResolvedValueOnce(0) // amuletId
				.mockResolvedValueOnce(3) // inventory

			await expect(deleteItemService(1)).rejects.toThrow(BusinessLogicError)
		})

		it('should rethrow specific errors', async () => {
			const validationError = new ValidationError('Test error')
			mockPrisma.item.findUnique.mockRejectedValue(validationError)

			await expect(deleteItemService(1)).rejects.toThrow('Test error')
		})

		it('should wrap other errors', async () => {
			mockPrisma.item.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(deleteItemService(1)).rejects.toThrow('Failed to delete item')
		})
	})

	describe('checkItemNameExistsService', () => {
		it('should throw ValidationError for invalid name', async () => {
			await expect(checkItemNameExistsService('')).rejects.toThrow(ValidationError)
			await expect(checkItemNameExistsService('   ')).rejects.toThrow(ValidationError)
			await expect(checkItemNameExistsService(null as any)).rejects.toThrow(ValidationError)
			await expect(checkItemNameExistsService(123 as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid excludeId', async () => {
			await expect(checkItemNameExistsService('Test', 0)).rejects.toThrow(ValidationError)
			await expect(checkItemNameExistsService('Test', -1)).rejects.toThrow(ValidationError)
			await expect(checkItemNameExistsService('Test', 1.5)).rejects.toThrow(ValidationError)
		})

		it('should return true when name exists', async () => {
			mockPrisma.item.findFirst.mockResolvedValue({ id: 1 })

			const result = await checkItemNameExistsService('Test Sword')

			expect(mockPrisma.item.findFirst).toHaveBeenCalledWith({
				where: { name: 'Test Sword' },
				select: { id: true },
			})

			expect(result).toBe(true)
		})

		it('should return false when name does not exist', async () => {
			mockPrisma.item.findFirst.mockResolvedValue(null)

			const result = await checkItemNameExistsService('Non-existent Sword')

			expect(result).toBe(false)
		})

		it('should exclude specified ID', async () => {
			mockPrisma.item.findFirst.mockResolvedValue(null)

			await checkItemNameExistsService('Test Sword', 1)

			expect(mockPrisma.item.findFirst).toHaveBeenCalledWith({
				where: {
					name: 'Test Sword',
					id: { not: 1 },
				},
				select: { id: true },
			})
		})

		it('should wrap errors', async () => {
			mockPrisma.item.findFirst.mockRejectedValue(new Error('Database error'))

			await expect(checkItemNameExistsService('Test')).rejects.toThrow('Failed to check item name existence')
		})
	})

	describe('associateItemTagsService', () => {
		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (fn: any) => {
				if (typeof fn === 'function') {
					return await fn(mockPrisma)
				}
				return fn
			})
		})

		it('should throw ValidationError for invalid item ID', async () => {
			await expect(associateItemTagsService(0, [1])).rejects.toThrow(ValidationError)
			await expect(associateItemTagsService(-1, [1])).rejects.toThrow(ValidationError)
			await expect(associateItemTagsService(1.5, [1])).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid tag IDs array', async () => {
			await expect(associateItemTagsService(1, null as any)).rejects.toThrow(ValidationError)
			await expect(associateItemTagsService(1, 'not-array' as any)).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid tag IDs', async () => {
			await expect(associateItemTagsService(1, [0])).rejects.toThrow(ValidationError)
			await expect(associateItemTagsService(1, [-1])).rejects.toThrow(ValidationError)
			await expect(associateItemTagsService(1, [1.5])).rejects.toThrow(ValidationError)
		})

		it('should associate tags successfully', async () => {
			mockPrisma.item.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.tag.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
			mockPrisma.item.update.mockResolvedValue({})

			await associateItemTagsService(1, [1, 2])

			expect(mockPrisma.item.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true },
			})

			expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
				where: { id: { in: [1, 2] } },
				select: { id: true },
			})

			expect(mockPrisma.item.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					tags: {
						connect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should handle duplicate tag IDs', async () => {
			mockPrisma.item.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.tag.findMany.mockResolvedValue([{ id: 1 }])
			mockPrisma.item.update.mockResolvedValue({})

			await associateItemTagsService(1, [1, 1, 1])

			expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
				where: { id: { in: [1] } },
				select: { id: true },
			})
		})

		it('should throw EntityNotFoundError when item not found', async () => {
			mockPrisma.item.findUnique.mockResolvedValue(null)

			await expect(associateItemTagsService(999, [1])).rejects.toThrow(EntityNotFoundError)
		})

		it('should throw EntityNotFoundError when tags not found', async () => {
			mockPrisma.item.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.tag.findMany.mockResolvedValue([{ id: 1 }])

			await expect(associateItemTagsService(1, [1, 999])).rejects.toThrow(EntityNotFoundError)
		})

		it('should wrap other errors', async () => {
			mockPrisma.item.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(associateItemTagsService(1, [1])).rejects.toThrow('Failed to associate tags with item')
		})
	})

	describe('dissociateItemTagsService', () => {
		beforeEach(() => {
			mockPrisma.$transaction.mockImplementation(async (fn: any) => {
				if (typeof fn === 'function') {
					return await fn(mockPrisma)
				}
				return fn
			})
		})

		it('should throw ValidationError for invalid item ID', async () => {
			await expect(dissociateItemTagsService(0, [1])).rejects.toThrow(ValidationError)
		})

		it('should throw ValidationError for invalid tag IDs', async () => {
			await expect(dissociateItemTagsService(1, [0])).rejects.toThrow(ValidationError)
		})

		it('should dissociate tags successfully', async () => {
			mockPrisma.item.findUnique.mockResolvedValue({ id: 1 })
			mockPrisma.item.update.mockResolvedValue({})

			await dissociateItemTagsService(1, [1, 2])

			expect(mockPrisma.item.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					tags: {
						disconnect: [{ id: 1 }, { id: 2 }],
					},
				},
			})
		})

		it('should throw EntityNotFoundError when item not found', async () => {
			mockPrisma.item.findUnique.mockResolvedValue(null)

			await expect(dissociateItemTagsService(999, [1])).rejects.toThrow(EntityNotFoundError)
		})

		it('should wrap other errors', async () => {
			mockPrisma.item.findUnique.mockRejectedValue(new Error('Database error'))

			await expect(dissociateItemTagsService(1, [1])).rejects.toThrow('Failed to dissociate tags from item')
		})
	})
})
