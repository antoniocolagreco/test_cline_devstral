import {
	createItemController,
	deleteItemController,
	getItemController,
	getItemsController,
	updateItemController,
} from '../src/controllers/items.controller.js'
import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock services
jest.mock('../src/services/items.service.js', () => ({
	getItemsService: jest.fn(),
	getItemService: jest.fn(),
	createItemService: jest.fn(),
	updateItemService: jest.fn(),
	deleteItemService: jest.fn(),
}))

import {
	createItemService,
	deleteItemService,
	getItemService,
	getItemsService,
	updateItemService,
} from '../src/services/items.service.js'

// Mock Fastify objects
const createMockRequest = (overrides = {}) =>
	({
		log: {
			error: jest.fn(),
		},
		query: {},
		params: {},
		body: {},
		...overrides,
	}) as any

const createMockReply = () => {
	const reply = {
		status: jest.fn().mockReturnThis(),
		send: jest.fn().mockReturnThis(),
	}

	return reply as any
}

describe('Items Controller', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getItemsController', () => {
		const mockItemsResult = {
			data: [
				{
					id: 1,
					name: 'Iron Sword',
					description: 'A sturdy iron sword',
					rarity: 'Common' as const,
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
					requiredStrength: 8,
					requiredDexterity: 6,
					requiredConstitution: 5,
					requiredIntelligence: 3,
					requiredWisdom: 3,
					requiredCharisma: 3,
					bonusStrength: 0,
					bonusDexterity: 0,
					bonusConstitution: 0,
					bonusIntelligence: 0,
					bonusWisdom: 0,
					bonusCharisma: 0,
					bonusHealth: 0,
					durability: 100,
					weight: 3.5,
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
				{
					id: 2,
					name: 'Health Potion',
					description: 'Restores health when consumed',
					rarity: 'Common' as const,
					isWeapon: false,
					isShield: false,
					isArmor: false,
					isAccessory: false,
					isConsumable: true,
					isQuestItem: false,
					isCraftingMaterial: false,
					isMiscellaneous: false,
					attack: 0,
					defense: 0,
					requiredStrength: 1,
					requiredDexterity: 1,
					requiredConstitution: 1,
					requiredIntelligence: 1,
					requiredWisdom: 1,
					requiredCharisma: 1,
					bonusStrength: 0,
					bonusDexterity: 0,
					bonusConstitution: 0,
					bonusIntelligence: 0,
					bonusWisdom: 0,
					bonusCharisma: 0,
					bonusHealth: 50,
					durability: 1,
					weight: 0.2,
					createdAt: '2024-01-02T00:00:00.000Z',
					updatedAt: '2024-01-02T00:00:00.000Z',
				},
			],
			pagination: {
				page: 1,
				pageSize: 10,
				total: 2,
				totalPages: 1,
			},
		}

		it('should return paginated items successfully', async () => {
			const mockGetItemsService = jest.mocked(getItemsService)
			mockGetItemsService.mockResolvedValue(mockItemsResult)

			const request = createMockRequest({
				query: { page: 1, pageSize: 10 },
			})
			const reply = createMockReply()

			await getItemsController(request, reply)

			expect(mockGetItemsService).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockItemsResult.data,
				pagination: mockItemsResult.pagination,
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetItemsService = jest.mocked(getItemsService)
			const validationError = new ValidationError('Page number must be greater than 0')
			mockGetItemsService.mockRejectedValue(validationError)

			const request = createMockRequest({
				query: { page: 0 },
			})
			const reply = createMockReply()

			await getItemsController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Page number must be greater than 0',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetItemsService = jest.mocked(getItemsService)
			mockGetItemsService.mockRejectedValue(new Error('Database connection failed'))

			const request = createMockRequest()
			const reply = createMockReply()

			await getItemsController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('getItemController', () => {
		const mockItem = {
			id: 1,
			name: 'Iron Sword',
			description: 'A sturdy iron sword',
			rarity: 'Common' as const,
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
			requiredStrength: 8,
			requiredDexterity: 6,
			requiredConstitution: 5,
			requiredIntelligence: 3,
			requiredWisdom: 3,
			requiredCharisma: 3,
			bonusStrength: 0,
			bonusDexterity: 0,
			bonusConstitution: 0,
			bonusIntelligence: 0,
			bonusWisdom: 0,
			bonusCharisma: 0,
			bonusHealth: 0,
			durability: 100,
			weight: 3.5,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		it('should return an item successfully', async () => {
			const mockGetItemService = jest.mocked(getItemService)
			mockGetItemService.mockResolvedValue(mockItem)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getItemController(request, reply)

			expect(mockGetItemService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockItem,
			})
		})

		it('should return 404 when item not found', async () => {
			const mockGetItemService = jest.mocked(getItemService)
			mockGetItemService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await getItemController(request, reply)

			expect(mockGetItemService).toHaveBeenCalledWith(999)
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Item not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await getItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Item ID must be a positive integer',
			})
		})

		it('should return 400 for negative ID', async () => {
			const request = createMockRequest({
				params: { id: '-1' },
			})
			const reply = createMockReply()

			await getItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Item ID must be a positive integer',
			})
		})

		it('should return 400 for zero ID', async () => {
			const request = createMockRequest({
				params: { id: '0' },
			})
			const reply = createMockReply()

			await getItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Item ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetItemService = jest.mocked(getItemService)
			const validationError = new ValidationError('Service validation error')
			mockGetItemService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Service validation error',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetItemService = jest.mocked(getItemService)
			mockGetItemService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getItemController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('createItemController', () => {
		const mockCreatedItem = {
			id: 1,
			name: 'Iron Sword',
			description: 'A sturdy iron sword',
			rarity: 'Common' as const,
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
			requiredStrength: 8,
			requiredDexterity: 6,
			requiredConstitution: 5,
			requiredIntelligence: 3,
			requiredWisdom: 3,
			requiredCharisma: 3,
			bonusStrength: 0,
			bonusDexterity: 0,
			bonusConstitution: 0,
			bonusIntelligence: 0,
			bonusWisdom: 0,
			bonusCharisma: 0,
			bonusHealth: 0,
			durability: 100,
			weight: 3.5,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		const itemBody = {
			name: 'Iron Sword',
			description: 'A sturdy iron sword',
			rarity: 'Common' as const,
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
			requiredStrength: 8,
			requiredDexterity: 6,
			requiredConstitution: 5,
			requiredIntelligence: 3,
			requiredWisdom: 3,
			requiredCharisma: 3,
			bonusStrength: 0,
			bonusDexterity: 0,
			bonusConstitution: 0,
			bonusIntelligence: 0,
			bonusWisdom: 0,
			bonusCharisma: 0,
			bonusHealth: 0,
			durability: 100,
			weight: 3.5,
		}

		it('should create an item successfully', async () => {
			const mockCreateItemService = jest.mocked(createItemService)
			mockCreateItemService.mockResolvedValue(mockCreatedItem)

			const request = createMockRequest({
				body: itemBody,
			})
			const reply = createMockReply()

			await createItemController(request, reply)

			expect(mockCreateItemService).toHaveBeenCalledWith(itemBody)
			expect(reply.status).toHaveBeenCalledWith(201)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockCreatedItem,
				message: 'Item created successfully',
			})
		})

		it('should create a minimal item', async () => {
			const minimalBody = {
				name: 'Simple Item',
				rarity: 'Common' as const,
				isWeapon: false,
				isShield: false,
				isArmor: false,
				isAccessory: false,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: true,
				attack: 0,
				defense: 0,
				requiredStrength: 1,
				requiredDexterity: 1,
				requiredConstitution: 1,
				requiredIntelligence: 1,
				requiredWisdom: 1,
				requiredCharisma: 1,
				bonusStrength: 0,
				bonusDexterity: 0,
				bonusConstitution: 0,
				bonusIntelligence: 0,
				bonusWisdom: 0,
				bonusCharisma: 0,
				bonusHealth: 0,
				durability: 1,
				weight: 0.1,
			}

			const mockCreateItemService = jest.mocked(createItemService)
			mockCreateItemService.mockResolvedValue({
				...minimalBody,
				id: 1,
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-01-01T00:00:00.000Z',
			})

			const request = createMockRequest({
				body: minimalBody,
			})
			const reply = createMockReply()

			await createItemController(request, reply)

			expect(mockCreateItemService).toHaveBeenCalledWith(minimalBody)
			expect(reply.status).toHaveBeenCalledWith(201)
		})

		it('should handle ValidationError from service', async () => {
			const mockCreateItemService = jest.mocked(createItemService)
			const validationError = new ValidationError('Item name cannot be empty')
			mockCreateItemService.mockRejectedValue(validationError)

			const request = createMockRequest({
				body: { ...itemBody, name: '' },
			})
			const reply = createMockReply()

			await createItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Item name cannot be empty',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockCreateItemService = jest.mocked(createItemService)
			const businessError = new BusinessLogicError('Item with name "Iron Sword" already exists')
			mockCreateItemService.mockRejectedValue(businessError)

			const request = createMockRequest({
				body: itemBody,
			})
			const reply = createMockReply()

			await createItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Item with name "Iron Sword" already exists',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockCreateItemService = jest.mocked(createItemService)
			mockCreateItemService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				body: itemBody,
			})
			const reply = createMockReply()

			await createItemController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('updateItemController', () => {
		const mockUpdatedItem = {
			id: 1,
			name: 'Updated Iron Sword',
			description: 'An improved iron sword',
			rarity: 'Uncommon' as const,
			isWeapon: true,
			isShield: false,
			isArmor: false,
			isAccessory: false,
			isConsumable: false,
			isQuestItem: false,
			isCraftingMaterial: false,
			isMiscellaneous: false,
			attack: 12,
			defense: 0,
			requiredStrength: 9,
			requiredDexterity: 7,
			requiredConstitution: 6,
			requiredIntelligence: 3,
			requiredWisdom: 3,
			requiredCharisma: 3,
			bonusStrength: 1,
			bonusDexterity: 0,
			bonusConstitution: 0,
			bonusIntelligence: 0,
			bonusWisdom: 0,
			bonusCharisma: 0,
			bonusHealth: 0,
			durability: 120,
			weight: 3.8,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-02T00:00:00.000Z',
		}

		it('should update an item successfully', async () => {
			const mockUpdateItemService = jest.mocked(updateItemService)
			mockUpdateItemService.mockResolvedValue(mockUpdatedItem)

			const updateBody = {
				name: 'Updated Iron Sword',
				description: 'An improved iron sword',
				rarity: 'Uncommon' as const,
				attack: 12,
				bonusStrength: 1,
			}

			const request = createMockRequest({
				params: { id: '1' },
				body: updateBody,
			})
			const reply = createMockReply()

			await updateItemController(request, reply)

			expect(mockUpdateItemService).toHaveBeenCalledWith({
				id: 1,
				...updateBody,
			})
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockUpdatedItem,
				message: 'Item updated successfully',
			})
		})

		it('should return 404 when item not found', async () => {
			const mockUpdateItemService = jest.mocked(updateItemService)
			mockUpdateItemService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
				body: { name: 'Updated Item' },
			})
			const reply = createMockReply()

			await updateItemController(request, reply)

			expect(mockUpdateItemService).toHaveBeenCalledWith({
				id: 999,
				name: 'Updated Item',
			})
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Item not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
				body: { name: 'Updated Item' },
			})
			const reply = createMockReply()

			await updateItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Item ID must be a positive integer',
			})
		})

		it('should handle empty body (partial update)', async () => {
			const mockUpdateItemService = jest.mocked(updateItemService)
			mockUpdateItemService.mockResolvedValue(mockUpdatedItem)

			const request = createMockRequest({
				params: { id: '1' },
				body: {},
			})
			const reply = createMockReply()

			await updateItemController(request, reply)

			expect(mockUpdateItemService).toHaveBeenCalledWith({ id: 1 })
			expect(reply.status).toHaveBeenCalledWith(200)
		})

		it('should handle ValidationError from service', async () => {
			const mockUpdateItemService = jest.mocked(updateItemService)
			const validationError = new ValidationError('Invalid rarity value')
			mockUpdateItemService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { rarity: 'Invalid' },
			})
			const reply = createMockReply()

			await updateItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Invalid rarity value',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockUpdateItemService = jest.mocked(updateItemService)
			const businessError = new BusinessLogicError('Cannot update item stats: balance would be broken')
			mockUpdateItemService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { attack: 999 },
			})
			const reply = createMockReply()

			await updateItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot update item stats: balance would be broken',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockUpdateItemService = jest.mocked(updateItemService)
			mockUpdateItemService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'Updated Item' },
			})
			const reply = createMockReply()

			await updateItemController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('deleteItemController', () => {
		it('should delete an item successfully', async () => {
			const mockDeleteItemService = jest.mocked(deleteItemService)
			mockDeleteItemService.mockResolvedValue()

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteItemController(request, reply)

			expect(mockDeleteItemService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				message: 'Item deleted successfully',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await deleteItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Item ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockDeleteItemService = jest.mocked(deleteItemService)
			const validationError = new ValidationError('Item ID must be a positive integer')
			mockDeleteItemService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Item ID must be a positive integer',
			})
		})

		it('should handle EntityNotFoundError from service', async () => {
			const mockDeleteItemService = jest.mocked(deleteItemService)
			const entityError = new EntityNotFoundError('Item', 999)
			mockDeleteItemService.mockRejectedValue(entityError)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await deleteItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: entityError.message,
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockDeleteItemService = jest.mocked(deleteItemService)
			const businessError = new BusinessLogicError(
				'Cannot delete item "Iron Sword" as it is being used by characters',
			)
			mockDeleteItemService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteItemController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot delete item "Iron Sword" as it is being used by characters',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockDeleteItemService = jest.mocked(deleteItemService)
			mockDeleteItemService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteItemController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})
})
