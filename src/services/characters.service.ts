import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import {
	characterSelectWithRelations,
	validateCharacterName,
	validateCharacterResource,
	validateCharacterStat,
	validateCharacterStringField,
	validatePositiveIntegerId,
} from '@helpers/character.helper.js'
import { transformCharacterFromPrisma } from '@helpers/character-transform.helper.js'
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
				select: characterSelectWithRelations,
			}),
			prisma.character.count({ where: searchQuery }),
		])

		const totalPages = Math.ceil(total / validatedPageSize)

		// Transform character data to match API schema format
		return {
			data: characters.map(transformCharacterFromPrisma),
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
			select: characterSelectWithRelations,
		})

		if (!character) {
			return null
		}

		// Transform and return character data
		return transformCharacterFromPrisma(character)
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
	// Validate required fields using helper functions
	const trimmedName = validateCharacterName(data.name, true)!

	// Validate optional string fields
	const trimmedSurname = validateCharacterStringField(data.surname, 'surname', 50)
	const trimmedNickname = validateCharacterStringField(data.nickname, 'nickname', 30)
	const trimmedDescription = validateCharacterStringField(data.description, 'description', 1000)

	if (data.avatarPath !== undefined && typeof data.avatarPath !== 'string') {
		throw new ValidationError('Character avatarPath must be a string')
	}

	// Validate stat constraints using helper functions
	validateCharacterStat(data.strength, 'strength', true)
	validateCharacterStat(data.dexterity, 'dexterity', true)
	validateCharacterStat(data.constitution, 'constitution', true)
	validateCharacterStat(data.intelligence, 'intelligence', true)
	validateCharacterStat(data.wisdom, 'wisdom', true)
	validateCharacterStat(data.charisma, 'charisma', true)

	// Validate resource stats using helper functions
	validateCharacterResource(data.health, 'health', true)
	validateCharacterResource(data.stamina, 'stamina', true)
	validateCharacterResource(data.mana, 'mana', true)

	// Validate boolean field
	if (typeof data.isPublic !== 'boolean') {
		throw new ValidationError('Character isPublic must be a boolean')
	}

	// Validate foreign key IDs using helper functions
	validatePositiveIntegerId(data.userId, 'User ID', true)
	validatePositiveIntegerId(data.raceId, 'Race ID', true)
	validatePositiveIntegerId(data.archetypeId, 'Archetype ID', true)

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
					surname: trimmedSurname || null,
					nickname: trimmedNickname || null,
					description: trimmedDescription || null,
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
	validatePositiveIntegerId(id, 'Character ID', true)

	// Validate name if provided
	const trimmedName = validateCharacterName(name)

	// Validate optional string fields if provided
	const trimmedSurname = validateCharacterStringField(surname, 'surname', 50)
	const trimmedNickname = validateCharacterStringField(nickname, 'nickname', 30)
	const trimmedDescription = validateCharacterStringField(description, 'description', 1000)

	if (avatarPath !== undefined && typeof avatarPath !== 'string') {
		throw new ValidationError('Character avatarPath must be a string')
	}

	// Validate stat fields if provided using helper functions
	validateCharacterStat(strength, 'strength')
	validateCharacterStat(dexterity, 'dexterity')
	validateCharacterStat(constitution, 'constitution')
	validateCharacterStat(intelligence, 'intelligence')
	validateCharacterStat(wisdom, 'wisdom')
	validateCharacterStat(charisma, 'charisma')

	// Validate resource fields if provided using helper functions
	validateCharacterResource(health, 'health')
	validateCharacterResource(stamina, 'stamina')
	validateCharacterResource(mana, 'mana')

	// Validate boolean field if provided
	if (isPublic !== undefined && typeof isPublic !== 'boolean') {
		throw new ValidationError('Character isPublic must be a boolean')
	}

	// Validate foreign key IDs if provided using helper functions
	validatePositiveIntegerId(userId, 'User ID')
	validatePositiveIntegerId(raceId, 'Race ID')
	validatePositiveIntegerId(archetypeId, 'Archetype ID')

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
		if (trimmedName !== undefined) {
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

		if (trimmedName !== undefined) {
			updateData.name = trimmedName
		}
		if (trimmedSurname !== undefined) {
			updateData.surname = trimmedSurname
		}
		if (trimmedNickname !== undefined) {
			updateData.nickname = trimmedNickname
		}
		if (trimmedDescription !== undefined) {
			updateData.description = trimmedDescription
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
			throw new BusinessLogicError(`Character with name "${trimmedName}" already exists for this user`)
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
	// Validate input using helper function
	validatePositiveIntegerId(id, 'Character ID', true)

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
