import ItemRarity from '@/constants/item-rarity.constant.js'
import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { transformSearchToQuery } from '@helpers/services.helper.js'
import type { CreateItem, GetItem, UpdateItem } from '@schemas/item.schema.js'
import type {
	CreateService,
	DeleteService,
	GetManyService,
	GetOneService,
	UpdateService,
} from '@shared-types/services.type.js'
import { prisma } from '../index.js'

/**
 * Service function to get many items with optional filtering, searching, and pagination
 * Includes related tags in the response for complete item information
 * @param params - Query parameters for filtering and pagination
 * @returns Promise<GetManyResult<GetItem>> - Paginated items response with tags
 * @throws ValidationError - When pagination parameters are invalid
 */
const getItemsService: GetManyService<GetItem> = async (params) => {
	const { page = 1, pageSize = 10, search, orderBy } = params

	// Validate pagination parameters to ensure reasonable limits
	if (page < 1) {
		throw new ValidationError('Page number must be greater than 0')
	}
	if (pageSize < 1 || pageSize > 100) {
		throw new ValidationError('Page size must be between 1 and 100')
	}

	const validatedPage = page
	const validatedPageSize = pageSize
	const skip = (validatedPage - 1) * validatedPageSize

	// Transform search object to Prisma query format for flexible searching
	const searchQuery = transformSearchToQuery(search)

	// Build orderBy clause with proper type safety and default sorting
	const orderByClause = orderBy ? ({ [orderBy.field]: orderBy.direction } as const) : ({ name: 'asc' } as const)

	try {
		// Use Prisma transaction to ensure data consistency between count and fetch
		const [items, total] = await prisma.$transaction([
			prisma.item.findMany({
				where: searchQuery,
				orderBy: orderByClause,
				skip,
				take: validatedPageSize,
				select: {
					id: true,
					name: true,
					description: true,
					rarity: true,
					isWeapon: true,
					isShield: true,
					isArmor: true,
					isAccessory: true,
					isConsumable: true,
					isQuestItem: true,
					isCraftingMaterial: true,
					isMiscellaneous: true,
					attack: true,
					defense: true,
					requiredStrength: true,
					requiredDexterity: true,
					requiredConstitution: true,
					requiredIntelligence: true,
					requiredWisdom: true,
					requiredCharisma: true,
					bonusStrength: true,
					bonusDexterity: true,
					bonusConstitution: true,
					bonusIntelligence: true,
					bonusWisdom: true,
					bonusCharisma: true,
					bonusHealth: true,
					durability: true,
					weight: true,
					createdAt: true,
					updatedAt: true,
					// Include related tags for complete item information
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
			}),
			prisma.item.count({ where: searchQuery }),
		])

		const totalPages = Math.ceil(total / validatedPageSize)

		// Transform item data to match API schema format
		const transformItem = (item: (typeof items)[0]): GetItem => ({
			...item,
			description: item.description || undefined, // Convert null to undefined for consistent API
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
		})

		return {
			data: items.map(transformItem),
			pagination: {
				page: validatedPage,
				pageSize: validatedPageSize,
				total,
				totalPages,
			},
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		throw new Error(`Failed to retrieve items: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to get a single item by ID with all related data
 * @param id - Item ID
 * @returns Promise<GetItem | null> - Item object with tags or null if not found
 * @throws ValidationError - When ID parameter is invalid
 */
const getItemService: GetOneService<GetItem> = async (id: number) => {
	// Validate input to ensure it's a positive integer
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Item ID must be a positive integer')
	}

	try {
		const item = await prisma.item.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				description: true,
				rarity: true,
				isWeapon: true,
				isShield: true,
				isArmor: true,
				isAccessory: true,
				isConsumable: true,
				isQuestItem: true,
				isCraftingMaterial: true,
				isMiscellaneous: true,
				attack: true,
				defense: true,
				requiredStrength: true,
				requiredDexterity: true,
				requiredConstitution: true,
				requiredIntelligence: true,
				requiredWisdom: true,
				requiredCharisma: true,
				bonusStrength: true,
				bonusDexterity: true,
				bonusConstitution: true,
				bonusIntelligence: true,
				bonusWisdom: true,
				bonusCharisma: true,
				bonusHealth: true,
				durability: true,
				weight: true,
				createdAt: true,
				updatedAt: true,
				// Include related tags for complete item information
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

		if (!item) {
			return null
		}

		// Transform and return item data
		return {
			...item,
			description: item.description || undefined, // Convert null to undefined
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		throw new Error(`Failed to retrieve item: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to create a new item with all stats and type flags
 * Validates item type consistency and stat requirements
 * @param data - Item creation data including all stats and type flags
 * @returns Promise<GetItem> - Created item object with associated tags
 * @throws ValidationError - When input data is invalid or item type configuration is inconsistent
 * @throws BusinessLogicError - When item name already exists
 */
const createItemService: CreateService<CreateItem, GetItem> = async (data) => {
	// Validate required fields
	if (!data.name || typeof data.name !== 'string') {
		throw new ValidationError('Item name is required and must be a string')
	}

	const trimmedName = data.name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Item name cannot be empty')
	}

	// Validate name length according to schema constraints
	if (trimmedName.length > 100) {
		throw new ValidationError('Item name cannot exceed 100 characters')
	}

	// Validate description if provided
	if (data.description !== undefined) {
		if (typeof data.description !== 'string') {
			throw new ValidationError('Item description must be a string')
		}
		if (data.description.trim().length > 500) {
			throw new ValidationError('Item description cannot exceed 500 characters')
		}
	}

	// Validate rarity enum
	const validRarities = Object.values(ItemRarity)
	if (!validRarities.includes(data.rarity)) {
		throw new ValidationError(`Item rarity must be one of: ${validRarities.join(', ')}`)
	}

	// Validate item type flags - at least one must be true
	const typeFlags = [
		data.isWeapon,
		data.isShield,
		data.isArmor,
		data.isAccessory,
		data.isConsumable,
		data.isQuestItem,
		data.isCraftingMaterial,
		data.isMiscellaneous,
	]

	if (!typeFlags.some((flag) => flag === true)) {
		throw new ValidationError('Item must have at least one type flag set to true')
	}

	// Validate numerical stat constraints
	const nonNegativeStats = [
		'attack',
		'defense',
		'requiredStrength',
		'requiredDexterity',
		'requiredConstitution',
		'requiredIntelligence',
		'requiredWisdom',
		'requiredCharisma',
		'bonusStrength',
		'bonusDexterity',
		'bonusConstitution',
		'bonusIntelligence',
		'bonusWisdom',
		'bonusCharisma',
		'bonusHealth',
		'weight',
	] as const

	for (const stat of nonNegativeStats) {
		const value = data[stat]
		if (!Number.isInteger(value) || value < 0) {
			throw new ValidationError(`${stat} must be a non-negative integer`)
		}
	}

	// Validate required stats max values (0-50)
	const requiredStats = [
		'requiredStrength',
		'requiredDexterity',
		'requiredConstitution',
		'requiredIntelligence',
		'requiredWisdom',
		'requiredCharisma',
	] as const

	for (const stat of requiredStats) {
		const value = data[stat]
		if (value > 50) {
			throw new ValidationError(`${stat} cannot exceed 50`)
		}
	}

	// Validate bonus stats max values (0-50)
	const bonusStats = [
		'bonusStrength',
		'bonusDexterity',
		'bonusConstitution',
		'bonusIntelligence',
		'bonusWisdom',
		'bonusCharisma',
		'bonusHealth',
	] as const

	for (const stat of bonusStats) {
		const value = data[stat]
		if (value > 50) {
			throw new ValidationError(`${stat} cannot exceed 50`)
		}
	}

	// Validate durability range (1-10000)
	if (!Number.isInteger(data.durability) || data.durability < 1 || data.durability > 10000) {
		throw new ValidationError('Durability must be an integer between 1 and 10000')
	}

	// Validate weight minimum (1)
	if (!Number.isInteger(data.weight) || data.weight < 1) {
		throw new ValidationError('Weight must be an integer of at least 1')
	}

	// Validate item type logic constraints
	validateItemTypeLogic(data)

	try {
		// Use transaction to ensure data consistency
		const item = await prisma.$transaction(async (tx) => {
			// Check if item name already exists (case-insensitive)
			const existingItem = await tx.item.findFirst({
				where: { name: trimmedName },
				select: { id: true },
			})

			if (existingItem) {
				throw new BusinessLogicError(`Item with name "${trimmedName}" already exists`)
			}

			// Create the item with all data
			const createdItem = await tx.item.create({
				data: {
					name: trimmedName,
					description: data.description?.trim() || null,
					rarity: data.rarity as any,
					isWeapon: data.isWeapon,
					isShield: data.isShield,
					isArmor: data.isArmor,
					isAccessory: data.isAccessory,
					isConsumable: data.isConsumable,
					isQuestItem: data.isQuestItem,
					isCraftingMaterial: data.isCraftingMaterial,
					isMiscellaneous: data.isMiscellaneous,
					attack: data.attack,
					defense: data.defense,
					requiredStrength: data.requiredStrength,
					requiredDexterity: data.requiredDexterity,
					requiredConstitution: data.requiredConstitution,
					requiredIntelligence: data.requiredIntelligence,
					requiredWisdom: data.requiredWisdom,
					requiredCharisma: data.requiredCharisma,
					bonusStrength: data.bonusStrength,
					bonusDexterity: data.bonusDexterity,
					bonusConstitution: data.bonusConstitution,
					bonusIntelligence: data.bonusIntelligence,
					bonusWisdom: data.bonusWisdom,
					bonusCharisma: data.bonusCharisma,
					bonusHealth: data.bonusHealth,
					durability: data.durability,
					weight: data.weight,
				},
				select: {
					id: true,
					name: true,
					description: true,
					rarity: true,
					isWeapon: true,
					isShield: true,
					isArmor: true,
					isAccessory: true,
					isConsumable: true,
					isQuestItem: true,
					isCraftingMaterial: true,
					isMiscellaneous: true,
					attack: true,
					defense: true,
					requiredStrength: true,
					requiredDexterity: true,
					requiredConstitution: true,
					requiredIntelligence: true,
					requiredWisdom: true,
					requiredCharisma: true,
					bonusStrength: true,
					bonusDexterity: true,
					bonusConstitution: true,
					bonusIntelligence: true,
					bonusWisdom: true,
					bonusCharisma: true,
					bonusHealth: true,
					durability: true,
					weight: true,
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

			return createdItem
		})

		// Transform and return the created item
		return {
			...item,
			description: item.description || undefined,
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError || error instanceof BusinessLogicError) {
			throw error
		}
		// Handle Prisma unique constraint violation as backup
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			throw new BusinessLogicError(`Item with name "${trimmedName}" already exists`)
		}
		throw new Error(`Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Validates item type logic constraints to ensure consistency
 * @param data - Item data to validate
 * @throws ValidationError - When item type configuration is inconsistent
 */
const validateItemTypeLogic = (data: CreateItem | UpdateItem): void => {
	// Weapons should have attack value > 0
	if (data.isWeapon && data.attack === 0) {
		throw new ValidationError('Weapons should have an attack value greater than 0')
	}

	// Armor and shields should have defense value > 0
	if ((data.isArmor || data.isShield) && data.defense === 0) {
		throw new ValidationError('Armor and shields should have a defense value greater than 0')
	}

	// Non-weapon items shouldn't have high attack values
	if (!data.isWeapon && data.attack && data.attack > 0) {
		throw new ValidationError('Non-weapon items should not have attack values')
	}

	// Consumables shouldn't have high durability
	if (data.isConsumable && data.durability && data.durability > 100) {
		throw new ValidationError('Consumable items should have lower durability (max 100)')
	}

	// Quest items should have high durability
	if (data.isQuestItem && data.durability && data.durability < 1000) {
		throw new ValidationError('Quest items should have high durability (min 1000)')
	}
}

/**
 * Service function to update an existing item and its associations
 * @param data - Item update data with ID and optional fields
 * @returns Promise<GetItem | null> - Updated item object or null if not found
 * @throws ValidationError - When input data is invalid or item type configuration is inconsistent
 * @throws BusinessLogicError - When item name already exists for different item
 */
const updateItemService: UpdateService<UpdateItem, GetItem> = async (data) => {
	const { id, name, description, rarity, ...otherFields } = data

	// Validate item ID
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Item ID must be a positive integer')
	}

	// Validate name if provided
	if (name !== undefined) {
		if (typeof name !== 'string') {
			throw new ValidationError('Item name must be a string')
		}

		const trimmedName = name.trim()
		if (trimmedName.length === 0) {
			throw new ValidationError('Item name cannot be empty')
		}

		if (trimmedName.length > 100) {
			throw new ValidationError('Item name cannot exceed 100 characters')
		}

		// Check if item name already exists for a different item
		const existingItem = await prisma.item.findFirst({
			where: {
				name: trimmedName,
				id: { not: id },
			},
			select: { id: true },
		})

		if (existingItem) {
			throw new BusinessLogicError(`Item with name "${trimmedName}" already exists`)
		}
	}

	// Validate description if provided
	if (description !== undefined) {
		if (typeof description !== 'string') {
			throw new ValidationError('Item description must be a string')
		}
		if (description.trim().length > 500) {
			throw new ValidationError('Item description cannot exceed 500 characters')
		}
	}

	// Validate rarity if provided
	if (rarity !== undefined) {
		const validRarities = Object.values(ItemRarity)
		if (!validRarities.includes(rarity)) {
			throw new ValidationError(`Item rarity must be one of: ${validRarities.join(', ')}`)
		}
	}

	// Validate numerical constraints for provided fields
	const statsToValidate = Object.entries(otherFields).filter(([_, value]) => value !== undefined)

	for (const [stat, value] of statsToValidate) {
		if (typeof value !== 'number' || !Number.isInteger(value)) {
			throw new ValidationError(`${stat} must be an integer`)
		}

		// Non-negative constraints
		const nonNegativeStats = [
			'attack',
			'defense',
			'requiredStrength',
			'requiredDexterity',
			'requiredConstitution',
			'requiredIntelligence',
			'requiredWisdom',
			'requiredCharisma',
			'bonusStrength',
			'bonusDexterity',
			'bonusConstitution',
			'bonusIntelligence',
			'bonusWisdom',
			'bonusCharisma',
			'bonusHealth',
			'weight',
		]

		if (nonNegativeStats.includes(stat) && value < 0) {
			throw new ValidationError(`${stat} must be non-negative`)
		}

		// Max value constraints
		const maxFiftyStats = [
			'requiredStrength',
			'requiredDexterity',
			'requiredConstitution',
			'requiredIntelligence',
			'requiredWisdom',
			'requiredCharisma',
			'bonusStrength',
			'bonusDexterity',
			'bonusConstitution',
			'bonusIntelligence',
			'bonusWisdom',
			'bonusCharisma',
			'bonusHealth',
		]

		if (maxFiftyStats.includes(stat) && value > 50) {
			throw new ValidationError(`${stat} cannot exceed 50`)
		}

		// Specific constraints
		if (stat === 'durability' && (value < 1 || value > 10000)) {
			throw new ValidationError('Durability must be between 1 and 10000')
		}

		if (stat === 'weight' && value < 1) {
			throw new ValidationError('Weight must be at least 1')
		}
	}

	// Validate item type logic if any type flags or stats are being updated
	const hasTypeUpdates = Object.keys(otherFields).some(
		(key) => key.startsWith('is') || ['attack', 'defense', 'durability'].includes(key),
	)

	if (hasTypeUpdates) {
		// Get current item data to merge with updates for validation
		const currentItem = await prisma.item.findUnique({
			where: { id },
			select: {
				isWeapon: true,
				isShield: true,
				isArmor: true,
				isAccessory: true,
				isConsumable: true,
				isQuestItem: true,
				isCraftingMaterial: true,
				isMiscellaneous: true,
				attack: true,
				defense: true,
				durability: true,
			},
		})

		if (currentItem) {
			const mergedData = { ...currentItem, ...otherFields }
			validateItemTypeLogic(mergedData as any)
		}
	}

	try {
		// Build update data object only with provided fields
		const updateData: Record<string, any> = {}
		if (name !== undefined) {
			updateData.name = name.trim()
		}
		if (description !== undefined) {
			updateData.description = description.trim() || null
		}
		if (rarity !== undefined) {
			updateData.rarity = rarity
		}

		// Add other fields to update data if provided
		for (const [key, value] of Object.entries(otherFields)) {
			if (value !== undefined) {
				updateData[key] = value
			}
		}

		// Update the item with proper error handling
		const item = await prisma.item.update({
			where: { id },
			data: updateData,
			select: {
				id: true,
				name: true,
				description: true,
				rarity: true,
				isWeapon: true,
				isShield: true,
				isArmor: true,
				isAccessory: true,
				isConsumable: true,
				isQuestItem: true,
				isCraftingMaterial: true,
				isMiscellaneous: true,
				attack: true,
				defense: true,
				requiredStrength: true,
				requiredDexterity: true,
				requiredConstitution: true,
				requiredIntelligence: true,
				requiredWisdom: true,
				requiredCharisma: true,
				bonusStrength: true,
				bonusDexterity: true,
				bonusConstitution: true,
				bonusIntelligence: true,
				bonusWisdom: true,
				bonusCharisma: true,
				bonusHealth: true,
				durability: true,
				weight: true,
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

		// Transform and return updated item
		return {
			...item,
			description: item.description || undefined,
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError || error instanceof BusinessLogicError) {
			throw error
		}
		// Handle Prisma record not found error
		if (error instanceof Error && 'code' in error && error.code === 'P2025') {
			return null
		}
		// Handle Prisma unique constraint violation
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			throw new BusinessLogicError(`Item with name "${name?.trim()}" already exists`)
		}
		throw new Error(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to delete an item by ID
 * Checks for references in other entities before deletion to maintain data integrity
 * @param id - Item ID to delete
 * @returns Promise<void>
 * @throws ValidationError - When ID parameter is invalid
 * @throws EntityNotFoundError - When item is not found
 * @throws BusinessLogicError - When item cannot be deleted due to references
 */
const deleteItemService: DeleteService = async (id: number) => {
	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Item ID must be a positive integer')
	}

	try {
		await prisma.$transaction(async (tx) => {
			// Check if item exists
			const existingItem = await tx.item.findUnique({
				where: { id },
				select: { id: true, name: true },
			})

			if (!existingItem) {
				throw new EntityNotFoundError('Item', id)
			}

			// Check if item is being used by characters in various equipment slots
			const [
				primaryWeaponCount,
				secondaryWeaponCount,
				shieldCount,
				armorCount,
				firstRingCount,
				secondRingCount,
				amuletCount,
				inventoryCount,
			] = await Promise.all([
				tx.character.count({ where: { primaryWeaponId: id } }),
				tx.character.count({ where: { secondaryWeaponId: id } }),
				tx.character.count({ where: { shieldId: id } }),
				tx.character.count({ where: { armorId: id } }),
				tx.character.count({ where: { firstRingId: id } }),
				tx.character.count({ where: { secondRingId: id } }),
				tx.character.count({ where: { amuletId: id } }),
				tx.character.count({ where: { items: { some: { id } } } }),
			])

			const totalReferences =
				primaryWeaponCount +
				secondaryWeaponCount +
				shieldCount +
				armorCount +
				firstRingCount +
				secondRingCount +
				amuletCount +
				inventoryCount

			if (totalReferences > 0) {
				const referenceDetails = [
					primaryWeaponCount > 0 ? `primary weapon: ${primaryWeaponCount}` : '',
					secondaryWeaponCount > 0 ? `secondary weapon: ${secondaryWeaponCount}` : '',
					shieldCount > 0 ? `shield: ${shieldCount}` : '',
					armorCount > 0 ? `armor: ${armorCount}` : '',
					firstRingCount > 0 ? `first ring: ${firstRingCount}` : '',
					secondRingCount > 0 ? `second ring: ${secondRingCount}` : '',
					amuletCount > 0 ? `amulet: ${amuletCount}` : '',
					inventoryCount > 0 ? `inventory: ${inventoryCount}` : '',
				]
					.filter((detail) => detail)
					.join(', ')

				throw new BusinessLogicError(
					`Cannot delete item "${existingItem.name}" as it is being used by characters (${referenceDetails})`,
				)
			}

			// Safe to delete - remove item and all its tag associations
			await tx.item.delete({
				where: { id },
			})
		})
	} catch (error) {
		if (
			error instanceof ValidationError ||
			error instanceof EntityNotFoundError ||
			error instanceof BusinessLogicError
		) {
			throw error
		}
		throw new Error(`Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to check if an item name already exists
 * Useful for validation before creating or updating items
 * @param name - Item name to check
 * @param excludeId - Optional ID to exclude from check (useful for updates)
 * @returns Promise<boolean> - True if name exists, false otherwise
 * @throws ValidationError - When name parameter is invalid
 */
const checkItemNameExistsService = async (name: string, excludeId?: number): Promise<boolean> => {
	// Validate input
	if (!name || typeof name !== 'string') {
		throw new ValidationError('Item name is required and must be a string')
	}

	const trimmedName = name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Item name cannot be empty')
	}

	if (excludeId !== undefined && (!Number.isInteger(excludeId) || excludeId <= 0)) {
		throw new ValidationError('Exclude ID must be a positive integer')
	}

	try {
		const existingItem = await prisma.item.findFirst({
			where: {
				name: trimmedName,
				...(excludeId && { id: { not: excludeId } }),
			},
			select: { id: true },
		})

		return !!existingItem
	} catch (error) {
		throw new Error(
			`Failed to check item name existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to associate tags with an item
 * @param itemId - ID of the item to associate tags with
 * @param tagIds - Array of tag IDs to associate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When item or tags don't exist
 */
const associateItemTagsService = async (itemId: number, tagIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(itemId) || itemId <= 0) {
		throw new ValidationError('Item ID must be a positive integer')
	}

	if (!Array.isArray(tagIds)) {
		throw new ValidationError('Tag IDs must be an array')
	}

	// Validate each tag ID
	for (const tagId of tagIds) {
		if (!Number.isInteger(tagId) || tagId <= 0) {
			throw new ValidationError(`Tag ID ${tagId} must be a positive integer`)
		}
	}

	// Remove duplicates
	const uniqueTagIds = [...new Set(tagIds)]

	try {
		await prisma.$transaction(async (tx) => {
			// Check if item exists
			const item = await tx.item.findUnique({
				where: { id: itemId },
				select: { id: true },
			})

			if (!item) {
				throw new EntityNotFoundError('Item', itemId)
			}

			// Check if all tags exist
			const existingTags = await tx.tag.findMany({
				where: { id: { in: uniqueTagIds } },
				select: { id: true },
			})

			const existingTagIds = existingTags.map((tag) => tag.id)
			const missingTagIds = uniqueTagIds.filter((id) => !existingTagIds.includes(id))

			if (missingTagIds.length > 0) {
				throw new EntityNotFoundError('Tags', missingTagIds.join(', '))
			}

			// Associate tags with item (connect operation)
			await tx.item.update({
				where: { id: itemId },
				data: {
					tags: {
						connect: uniqueTagIds.map((id) => ({ id })),
					},
				},
			})
		})
	} catch (error) {
		if (error instanceof ValidationError || error instanceof EntityNotFoundError) {
			throw error
		}
		throw new Error(
			`Failed to associate tags with item: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to dissociate tags from an item
 * @param itemId - ID of the item to dissociate tags from
 * @param tagIds - Array of tag IDs to dissociate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When item doesn't exist
 */
const dissociateItemTagsService = async (itemId: number, tagIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(itemId) || itemId <= 0) {
		throw new ValidationError('Item ID must be a positive integer')
	}

	if (!Array.isArray(tagIds)) {
		throw new ValidationError('Tag IDs must be an array')
	}

	// Validate each tag ID
	for (const tagId of tagIds) {
		if (!Number.isInteger(tagId) || tagId <= 0) {
			throw new ValidationError(`Tag ID ${tagId} must be a positive integer`)
		}
	}

	// Remove duplicates
	const uniqueTagIds = [...new Set(tagIds)]

	try {
		await prisma.$transaction(async (tx) => {
			// Check if item exists
			const item = await tx.item.findUnique({
				where: { id: itemId },
				select: { id: true },
			})

			if (!item) {
				throw new EntityNotFoundError('Item', itemId)
			}

			// Dissociate tags from item (disconnect operation)
			await tx.item.update({
				where: { id: itemId },
				data: {
					tags: {
						disconnect: uniqueTagIds.map((id) => ({ id })),
					},
				},
			})
		})
	} catch (error) {
		if (error instanceof ValidationError || error instanceof EntityNotFoundError) {
			throw error
		}
		throw new Error(
			`Failed to dissociate tags from item: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

export {
	associateItemTagsService,
	checkItemNameExistsService,
	createItemService,
	deleteItemService,
	dissociateItemTagsService,
	getItemService,
	getItemsService,
	updateItemService,
}
