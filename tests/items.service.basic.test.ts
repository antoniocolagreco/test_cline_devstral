import ItemRarity from '../src/constants/item-rarity.constant.js'
import ValidationError from '../src/errors/validation.error.js'

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

import { createItemService, getItemService, getItemsService } from '../src/services/items.service.js'

describe('Items Service (Basic)', () => {
	beforeEach(() => {
		jest.clearAllMocks()

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
	})

	describe('getItemService', () => {
		it('should throw ValidationError for invalid id', async () => {
			await expect(getItemService(0)).rejects.toThrow(ValidationError)
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

		it('should throw ValidationError for missing name', async () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { name: _, ...invalidData } = validItemData

			await expect(createItemService(invalidData as any)).rejects.toThrow(ValidationError)
		})
	})
})
