import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { transformSearchToQuery } from '@helpers/services.helper.js'
import type { CreateCharacter, GetCharacter, UpdateCharacter } from '@schemas/character.schema.js'
import type {
	CreateService,
	DeleteService,
	GetManyService,
	GetOneService,
	UpdateService,
} from '@shared-types/services.type.js'
import { prisma } from '../index.js'

/**
 * Helper function to calculate aggregate stats based on base stats, race modifiers, and equipped items
 */
const calculateAggregateStats = (character: {
	health: number
	stamina: number
	mana: number
	strength: number
	dexterity: number
	constitution: number
	intelligence: number
	wisdom: number
	charisma: number
	race: {
		healthModifier: number
		staminaModifier: number
		manaModifier: number
		strengthModifier: number
		dexterityModifier: number
		constitutionModifier: number
		intelligenceModifier: number
		wisdomModifier: number
		charismaModifier: number
	}
	primaryWeapon?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	secondaryWeapon?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	shield?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	armor?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	firstRing?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	secondRing?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	amulet?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
}) => {
	const items = [
		character.primaryWeapon,
		character.secondaryWeapon,
		character.shield,
		character.armor,
		character.firstRing,
		character.secondRing,
		character.amulet,
	].filter(Boolean)

	const totalItemBonuses = items.reduce(
		(acc, item) => {
			if (item) {
				acc.health += item.bonusHealth
				acc.strength += item.bonusStrength
				acc.dexterity += item.bonusDexterity
				acc.constitution += item.bonusConstitution
				acc.intelligence += item.bonusIntelligence
				acc.wisdom += item.bonusWisdom
				acc.charisma += item.bonusCharisma
			}
			return acc
		},
		{ health: 0, strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
	)

	return {
		aggregateHealth: character.health + character.race.healthModifier + totalItemBonuses.health,
		aggregateStamina: character.stamina + character.race.staminaModifier,
		aggregateMana: character.mana + character.race.manaModifier,
		aggregateStrength: character.strength + character.race.strengthModifier + totalItemBonuses.strength,
		aggregateDexterity: character.dexterity + character.race.dexterityModifier + totalItemBonuses.dexterity,
		aggregateConstitution:
			character.constitution + character.race.constitutionModifier + totalItemBonuses.constitution,
		aggregateIntelligence:
			character.intelligence + character.race.intelligenceModifier + totalItemBonuses.intelligence,
		aggregateWisdom: character.wisdom + character.race.wisdomModifier + totalItemBonuses.wisdom,
		aggregateCharisma: character.charisma + character.race.charismaModifier + totalItemBonuses.charisma,
	}
}

/**
 * Service function to get many characters with optional filtering, searching, and pagination
 * Includes all related data for complete character information
 * @param params - Query parameters for filtering and pagination
 * @returns Promise<GetManyResult<GetCharacter>> - Paginated characters response with all relations
 * @throws ValidationError - When pagination parameters are invalid
 */
const getCharactersService: GetManyService<GetCharacter> = async (params) => {
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
		const [characters, total] = await prisma.$transaction([
			prisma.character.findMany({
				where: searchQuery,
				orderBy: orderByClause,
				skip,
				take: validatedPageSize,
				select: {
					id: true,
					name: true,
					surname: true,
					nickname: true,
					description: true,
					avatarPath: true,
					health: true,
					stamina: true,
					mana: true,
					strength: true,
					dexterity: true,
					constitution: true,
					intelligence: true,
					wisdom: true,
					charisma: true,
					isPublic: true,
					raceId: true,
					archetypeId: true,
					userId: true,
					createdAt: true,
					updatedAt: true,
					race: {
						select: {
							strengthModifier: true,
							dexterityModifier: true,
							constitutionModifier: true,
							intelligenceModifier: true,
							wisdomModifier: true,
							charismaModifier: true,
							healthModifier: true,
							staminaModifier: true,
							manaModifier: true,
						},
					},
					primaryWeapon: {
						select: {
							bonusStrength: true,
							bonusDexterity: true,
							bonusConstitution: true,
							bonusIntelligence: true,
							bonusWisdom: true,
							bonusCharisma: true,
							bonusHealth: true,
						},
					},
					secondaryWeapon: {
						select: {
							bonusStrength: true,
							bonusDexterity: true,
							bonusConstitution: true,
							bonusIntelligence: true,
							bonusWisdom: true,
							bonusCharisma: true,
							bonusHealth: true,
						},
					},
					shield: {
						select: {
							bonusStrength: true,
							bonusDexterity: true,
							bonusConstitution: true,
							bonusIntelligence: true,
							bonusWisdom: true,
							bonusCharisma: true,
							bonusHealth: true,
						},
					},
					armor: {
						select: {
							bonusStrength: true,
							bonusDexterity: true,
							bonusConstitution: true,
							bonusIntelligence: true,
							bonusWisdom: true,
							bonusCharisma: true,
							bonusHealth: true,
						},
					},
					firstRing: {
						select: {
							bonusStrength: true,
							bonusDexterity: true,
							bonusConstitution: true,
							bonusIntelligence: true,
							bonusWisdom: true,
							bonusCharisma: true,
							bonusHealth: true,
						},
					},
					secondRing: {
						select: {
							bonusStrength: true,
							bonusDexterity: true,
							bonusConstitution: true,
							bonusIntelligence: true,
							bonusWisdom: true,
							bonusCharisma: true,
							bonusHealth: true,
						},
					},
					amulet: {
						select: {
							bonusStrength: true,
							bonusDexterity: true,
							bonusConstitution: true,
							bonusIntelligence: true,
							bonusWisdom: true,
							bonusCharisma: true,
							bonusHealth: true,
						},
					},
				},
			}),
			prisma.character.count({ where: searchQuery }),
		])

		const totalPages = Math.ceil(total / validatedPageSize)

		// Transform character data to match API schema format
		const transformCharacter = (character: (typeof characters)[0]): GetCharacter => {
			const aggregateStats = calculateAggregateStats(character)

			return {
				id: character.id,
				name: character.name,
				surname: character.surname || undefined,
				nickname: character.nickname || undefined,
				description: character.description || undefined,
				avatarPath: character.avatarPath || undefined,
				health: character.health,
				stamina: character.stamina,
				mana: character.mana,
				strength: character.strength,
				dexterity: character.dexterity,
				constitution: character.constitution,
				intelligence: character.intelligence,
				wisdom: character.wisdom,
				charisma: character.charisma,
				...aggregateStats,
				isPublic: character.isPublic,
				raceId: character.raceId,
				archetypeId: character.archetypeId,
				userId: character.userId,
				createdAt: character.createdAt.toISOString(),
				updatedAt: character.updatedAt.toISOString(),
			}
		}

		return {
			data: characters.map(transformCharacter),
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
		throw new Error(`Failed to retrieve characters: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to get a single character by ID with all related data
 * @param id - Character ID
 * @returns Promise<GetCharacter | null> - Character object with full details or null if not found
 * @throws ValidationError - When ID parameter is invalid
 */
const getCharacterService: GetOneService<GetCharacter> = async (id: number) => {
	// Validate input to ensure it's a positive integer
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Character ID must be a positive integer')
	}

	try {
		const character = await prisma.character.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				surname: true,
				nickname: true,
				description: true,
				avatarPath: true,
				health: true,
				stamina: true,
				mana: true,
				strength: true,
				dexterity: true,
				constitution: true,
				intelligence: true,
				wisdom: true,
				charisma: true,
				isPublic: true,
				raceId: true,
				archetypeId: true,
				userId: true,
				createdAt: true,
				updatedAt: true,
				race: {
					select: {
						healthModifier: true,
						staminaModifier: true,
						manaModifier: true,
						strengthModifier: true,
						dexterityModifier: true,
						constitutionModifier: true,
						intelligenceModifier: true,
						wisdomModifier: true,
						charismaModifier: true,
					},
				},
				primaryWeapon: {
					select: {
						bonusStrength: true,
						bonusDexterity: true,
						bonusConstitution: true,
						bonusIntelligence: true,
						bonusWisdom: true,
						bonusCharisma: true,
						bonusHealth: true,
					},
				},
				secondaryWeapon: {
					select: {
						bonusStrength: true,
						bonusDexterity: true,
						bonusConstitution: true,
						bonusIntelligence: true,
						bonusWisdom: true,
						bonusCharisma: true,
						bonusHealth: true,
					},
				},
				shield: {
					select: {
						bonusStrength: true,
						bonusDexterity: true,
						bonusConstitution: true,
						bonusIntelligence: true,
						bonusWisdom: true,
						bonusCharisma: true,
						bonusHealth: true,
					},
				},
				armor: {
					select: {
						bonusStrength: true,
						bonusDexterity: true,
						bonusConstitution: true,
						bonusIntelligence: true,
						bonusWisdom: true,
						bonusCharisma: true,
						bonusHealth: true,
					},
				},
				firstRing: {
					select: {
						bonusStrength: true,
						bonusDexterity: true,
						bonusConstitution: true,
						bonusIntelligence: true,
						bonusWisdom: true,
						bonusCharisma: true,
						bonusHealth: true,
					},
				},
				secondRing: {
					select: {
						bonusStrength: true,
						bonusDexterity: true,
						bonusConstitution: true,
						bonusIntelligence: true,
						bonusWisdom: true,
						bonusCharisma: true,
						bonusHealth: true,
					},
				},
				amulet: {
					select: {
						bonusStrength: true,
						bonusDexterity: true,
						bonusConstitution: true,
						bonusIntelligence: true,
						bonusWisdom: true,
						bonusCharisma: true,
						bonusHealth: true,
					},
				},
			},
		})

		if (!character) {
			return null
		}

		// Calculate aggregate stats
		const aggregateStats = calculateAggregateStats(character)

		// Transform and return character data
		return {
			id: character.id,
			name: character.name,
			surname: character.surname || undefined,
			nickname: character.nickname || undefined,
			description: character.description || undefined,
			avatarPath: character.avatarPath || undefined,
			health: character.health,
			stamina: character.stamina,
			mana: character.mana,
			strength: character.strength,
			dexterity: character.dexterity,
			constitution: character.constitution,
			intelligence: character.intelligence,
			wisdom: character.wisdom,
			charisma: character.charisma,
			...aggregateStats,
			isPublic: character.isPublic,
			raceId: character.raceId,
			archetypeId: character.archetypeId,
			userId: character.userId,
			createdAt: character.createdAt.toISOString(),
			updatedAt: character.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		throw new Error(`Failed to retrieve character: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to create a new character with all validations
 * Validates user ownership, race/archetype existence, and stat constraints
 * @param data - Character creation data with all required fields
 * @returns Promise<GetCharacter> - Created character object
 * @throws ValidationError - When input data is invalid or constraints are violated
 * @throws BusinessLogicError - When character name already exists for user
 * @throws EntityNotFoundError - When referenced entities don't exist
 */
const createCharacterService: CreateService<CreateCharacter, GetCharacter> = async (data) => {
	// Validate required fields
	if (!data.name || typeof data.name !== 'string') {
		throw new ValidationError('Character name is required and must be a string')
	}

	const trimmedName = data.name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Character name cannot be empty')
	}

	// Validate name length according to schema constraints
	if (trimmedName.length > 50) {
		throw new ValidationError('Character name cannot exceed 50 characters')
	}

	// Validate optional fields
	if (data.surname !== undefined) {
		if (typeof data.surname !== 'string') {
			throw new ValidationError('Character surname must be a string')
		}
		if (data.surname.trim().length > 50) {
			throw new ValidationError('Character surname cannot exceed 50 characters')
		}
	}

	if (data.nickname !== undefined) {
		if (typeof data.nickname !== 'string') {
			throw new ValidationError('Character nickname must be a string')
		}
		if (data.nickname.trim().length > 30) {
			throw new ValidationError('Character nickname cannot exceed 30 characters')
		}
	}

	if (data.description !== undefined) {
		if (typeof data.description !== 'string') {
			throw new ValidationError('Character description must be a string')
		}
		if (data.description.trim().length > 1000) {
			throw new ValidationError('Character description cannot exceed 1000 characters')
		}
	}

	if (data.avatarPath !== undefined) {
		if (typeof data.avatarPath !== 'string') {
			throw new ValidationError('Character avatarPath must be a string')
		}
	}

	// Validate stat constraints (1-20 range as per schema)
	const statFields = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const
	for (const stat of statFields) {
		const value = data[stat]
		if (!Number.isInteger(value) || value < 1 || value > 20) {
			throw new ValidationError(`Character ${stat} must be an integer between 1 and 20`)
		}
	}

	// Validate resource stats (health, stamina, mana) - minimum 1
	const resourceFields = ['health', 'stamina', 'mana'] as const
	for (const resource of resourceFields) {
		const value = data[resource]
		if (!Number.isInteger(value) || value < 1) {
			throw new ValidationError(`Character ${resource} must be an integer of at least 1`)
		}
	}

	// Validate boolean field
	if (typeof data.isPublic !== 'boolean') {
		throw new ValidationError('Character isPublic must be a boolean')
	}

	// Validate foreign key IDs
	if (!Number.isInteger(data.userId) || data.userId <= 0) {
		throw new ValidationError('User ID must be a positive integer')
	}

	if (!Number.isInteger(data.raceId) || data.raceId <= 0) {
		throw new ValidationError('Race ID must be a positive integer')
	}

	if (!Number.isInteger(data.archetypeId) || data.archetypeId <= 0) {
		throw new ValidationError('Archetype ID must be a positive integer')
	}

	try {
		// Use transaction to ensure data consistency
		const character = await prisma.$transaction(async (tx) => {
			// Check if user exists and is active
			const user = await tx.user.findUnique({
				where: { id: data.userId },
				select: { id: true, isActive: true },
			})

			if (!user) {
				throw new EntityNotFoundError('User', data.userId)
			}

			if (!user.isActive) {
				throw new BusinessLogicError('Cannot create character for inactive user')
			}

			// Check if race exists
			const race = await tx.race.findUnique({
				where: { id: data.raceId },
				select: { id: true },
			})

			if (!race) {
				throw new EntityNotFoundError('Race', data.raceId)
			}

			// Check if archetype exists
			const archetype = await tx.archetype.findUnique({
				where: { id: data.archetypeId },
				select: { id: true },
			})

			if (!archetype) {
				throw new EntityNotFoundError('Archetype', data.archetypeId)
			}

			// Check if character name already exists for this user
			const existingCharacter = await tx.character.findFirst({
				where: {
					name: trimmedName,
					userId: data.userId,
				},
				select: { id: true },
			})

			if (existingCharacter) {
				throw new BusinessLogicError(`Character with name "${trimmedName}" already exists for this user`)
			}

			// Create the character
			const createdCharacter = await tx.character.create({
				data: {
					name: trimmedName,
					surname: data.surname?.trim() || null,
					nickname: data.nickname?.trim() || null,
					description: data.description?.trim() || null,
					avatarPath: data.avatarPath?.trim() || null,
					health: data.health,
					stamina: data.stamina,
					mana: data.mana,
					strength: data.strength,
					dexterity: data.dexterity,
					constitution: data.constitution,
					intelligence: data.intelligence,
					wisdom: data.wisdom,
					charisma: data.charisma,
					isPublic: data.isPublic,
					userId: data.userId,
					raceId: data.raceId,
					archetypeId: data.archetypeId,
				},
				select: {
					id: true,
				},
			})

			return createdCharacter
		})

		// Use getCharacterService to return the character with calculated aggregate values
		const result = await getCharacterService(character.id)
		if (!result) {
			throw new Error('Failed to retrieve created character')
		}

		return result
	} catch (error) {
		if (
			error instanceof ValidationError ||
			error instanceof BusinessLogicError ||
			error instanceof EntityNotFoundError
		) {
			throw error
		}
		// Handle Prisma unique constraint violation as backup
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			throw new BusinessLogicError(`Character with name "${trimmedName}" already exists for this user`)
		}
		throw new Error(`Failed to create character: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to update an existing character and its data
 * @param data - Character update data with ID and optional fields
 * @returns Promise<GetCharacter | null> - Updated character object or null if not found
 * @throws ValidationError - When input data is invalid or constraints are violated
 * @throws BusinessLogicError - When character name already exists for user
 * @throws EntityNotFoundError - When referenced entities don't exist
 */
const updateCharacterService: UpdateService<UpdateCharacter, GetCharacter> = async (data) => {
	const {
		id,
		name,
		surname,
		nickname,
		description,
		avatarPath,
		health,
		stamina,
		mana,
		strength,
		dexterity,
		constitution,
		intelligence,
		wisdom,
		charisma,
		isPublic,
		raceId,
		archetypeId,
		userId,
	} = data

	// Validate character ID
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Character ID must be a positive integer')
	}

	// Validate name if provided
	if (name !== undefined) {
		if (typeof name !== 'string') {
			throw new ValidationError('Character name must be a string')
		}

		const trimmedName = name.trim()
		if (trimmedName.length === 0) {
			throw new ValidationError('Character name cannot be empty')
		}

		if (trimmedName.length > 50) {
			throw new ValidationError('Character name cannot exceed 50 characters')
		}
	}

	// Validate optional string fields if provided
	if (surname !== undefined) {
		if (typeof surname !== 'string') {
			throw new ValidationError('Character surname must be a string')
		}
		if (surname.trim().length > 50) {
			throw new ValidationError('Character surname cannot exceed 50 characters')
		}
	}

	if (nickname !== undefined) {
		if (typeof nickname !== 'string') {
			throw new ValidationError('Character nickname must be a string')
		}
		if (nickname.trim().length > 30) {
			throw new ValidationError('Character nickname cannot exceed 30 characters')
		}
	}

	if (description !== undefined) {
		if (typeof description !== 'string') {
			throw new ValidationError('Character description must be a string')
		}
		if (description.trim().length > 1000) {
			throw new ValidationError('Character description cannot exceed 1000 characters')
		}
	}

	if (avatarPath !== undefined) {
		if (typeof avatarPath !== 'string') {
			throw new ValidationError('Character avatarPath must be a string')
		}
	}

	// Validate stat fields if provided (1-20 range)
	const statFields = [
		{ field: 'strength', value: strength },
		{ field: 'dexterity', value: dexterity },
		{ field: 'constitution', value: constitution },
		{ field: 'intelligence', value: intelligence },
		{ field: 'wisdom', value: wisdom },
		{ field: 'charisma', value: charisma },
	] as const

	for (const { field, value } of statFields) {
		if (value !== undefined) {
			if (!Number.isInteger(value) || value < 1 || value > 20) {
				throw new ValidationError(`Character ${field} must be an integer between 1 and 20`)
			}
		}
	}

	// Validate resource fields if provided (minimum 1)
	const resourceFields = [
		{ field: 'health', value: health },
		{ field: 'stamina', value: stamina },
		{ field: 'mana', value: mana },
	] as const

	for (const { field, value } of resourceFields) {
		if (value !== undefined) {
			if (!Number.isInteger(value) || value < 1) {
				throw new ValidationError(`Character ${field} must be an integer of at least 1`)
			}
		}
	}

	// Validate boolean field if provided
	if (isPublic !== undefined && typeof isPublic !== 'boolean') {
		throw new ValidationError('Character isPublic must be a boolean')
	}

	// Validate foreign key IDs if provided
	if (userId !== undefined && (!Number.isInteger(userId) || userId <= 0)) {
		throw new ValidationError('User ID must be a positive integer')
	}

	if (raceId !== undefined && (!Number.isInteger(raceId) || raceId <= 0)) {
		throw new ValidationError('Race ID must be a positive integer')
	}

	if (archetypeId !== undefined && (!Number.isInteger(archetypeId) || archetypeId <= 0)) {
		throw new ValidationError('Archetype ID must be a positive integer')
	}

	try {
		// Check if referenced entities exist (if being updated)
		if (userId !== undefined) {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: { id: true, isActive: true },
			})

			if (!user) {
				throw new EntityNotFoundError('User', userId)
			}

			if (!user.isActive) {
				throw new BusinessLogicError('Cannot assign character to inactive user')
			}
		}

		if (raceId !== undefined) {
			const race = await prisma.race.findUnique({
				where: { id: raceId },
				select: { id: true },
			})

			if (!race) {
				throw new EntityNotFoundError('Race', raceId)
			}
		}

		if (archetypeId !== undefined) {
			const archetype = await prisma.archetype.findUnique({
				where: { id: archetypeId },
				select: { id: true },
			})

			if (!archetype) {
				throw new EntityNotFoundError('Archetype', archetypeId)
			}
		}

		// Check if character name already exists for user (if both name and userId are being updated)
		if (name !== undefined) {
			const trimmedName = name.trim()

			// Get current character to check user ID
			const currentCharacter = await prisma.character.findUnique({
				where: { id },
				select: { userId: true },
			})

			if (!currentCharacter) {
				return null // Character not found
			}

			const targetUserId = userId !== undefined ? userId : currentCharacter.userId

			const existingCharacter = await prisma.character.findFirst({
				where: {
					name: trimmedName,
					userId: targetUserId,
					id: { not: id },
				},
				select: { id: true },
			})

			if (existingCharacter) {
				throw new BusinessLogicError(`Character with name "${trimmedName}" already exists for this user`)
			}
		}

		// Build update data object only with provided fields
		const updateData: Record<string, any> = {}

		if (name !== undefined) {
			updateData.name = name.trim()
		}
		if (surname !== undefined) {
			updateData.surname = surname.trim() || null
		}
		if (nickname !== undefined) {
			updateData.nickname = nickname.trim() || null
		}
		if (description !== undefined) {
			updateData.description = description.trim() || null
		}
		if (avatarPath !== undefined) {
			updateData.avatarPath = avatarPath.trim() || null
		}
		if (health !== undefined) {
			updateData.health = health
		}
		if (stamina !== undefined) {
			updateData.stamina = stamina
		}
		if (mana !== undefined) {
			updateData.mana = mana
		}
		if (strength !== undefined) {
			updateData.strength = strength
		}
		if (dexterity !== undefined) {
			updateData.dexterity = dexterity
		}
		if (constitution !== undefined) {
			updateData.constitution = constitution
		}
		if (intelligence !== undefined) {
			updateData.intelligence = intelligence
		}
		if (wisdom !== undefined) {
			updateData.wisdom = wisdom
		}
		if (charisma !== undefined) {
			updateData.charisma = charisma
		}
		if (isPublic !== undefined) {
			updateData.isPublic = isPublic
		}
		if (userId !== undefined) {
			updateData.userId = userId
		}
		if (raceId !== undefined) {
			updateData.raceId = raceId
		}
		if (archetypeId !== undefined) {
			updateData.archetypeId = archetypeId
		}

		// Update the character with proper error handling
		const character = await prisma.character.update({
			where: { id },
			data: updateData,
			select: {
				id: true,
			},
		})

		// Use getCharacterService to return the character with calculated aggregate values
		const result = await getCharacterService(character.id)
		if (!result) {
			throw new Error('Failed to retrieve updated character')
		}

		return result
	} catch (error) {
		if (
			error instanceof ValidationError ||
			error instanceof BusinessLogicError ||
			error instanceof EntityNotFoundError
		) {
			throw error
		}
		// Handle Prisma record not found error
		if (error instanceof Error && 'code' in error && error.code === 'P2025') {
			return null
		}
		// Handle Prisma unique constraint violation
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			throw new BusinessLogicError(`Character with name "${name?.trim()}" already exists for this user`)
		}
		throw new Error(`Failed to update character: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to delete a character by ID
 * Removes all equipment associations and inventory items before deletion
 * @param id - Character ID to delete
 * @returns Promise<void>
 * @throws ValidationError - When ID parameter is invalid
 * @throws EntityNotFoundError - When character is not found
 */
const deleteCharacterService: DeleteService = async (id: number) => {
	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Character ID must be a positive integer')
	}

	try {
		await prisma.$transaction(async (tx) => {
			// Check if character exists
			const existingCharacter = await tx.character.findUnique({
				where: { id },
				select: { id: true, name: true },
			})

			if (!existingCharacter) {
				throw new EntityNotFoundError('Character', id)
			}

			// Delete the character - Prisma will handle the cascading deletions
			// for many-to-many relationships (items, tags) due to the schema configuration
			await tx.character.delete({
				where: { id },
			})
		})
	} catch (error) {
		if (error instanceof ValidationError || error instanceof EntityNotFoundError) {
			throw error
		}
		throw new Error(`Failed to delete character: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

export {
	getCharactersService,
	getCharacterService,
	createCharacterService,
	updateCharacterService,
	deleteCharacterService,
}
