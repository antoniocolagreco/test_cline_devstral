import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { transformSearchToQuery } from '@helpers/services.helper.js'
import type { CreateRace, GetRace, UpdateRace } from '@schemas/race.schema.js'
import type {
	CreateService,
	DeleteService,
	GetManyService,
	GetOneService,
	UpdateService,
} from '@shared-types/services.type.js'
import { prisma } from '../index.js'

/**
 * Service function to get many races with optional filtering, searching, and pagination
 * Includes related skills and tags in the response for complete race information
 * @param params - Query parameters for filtering and pagination
 * @returns Promise<GetManyResult<GetRace>> - Paginated races response with skills and tags
 * @throws ValidationError - When pagination parameters are invalid
 */
const getRacesService: GetManyService<GetRace> = async (params) => {
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
		const [races, total] = await prisma.$transaction([
			prisma.race.findMany({
				where: searchQuery,
				orderBy: orderByClause,
				skip,
				take: validatedPageSize,
				select: {
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
					// Include related skills for complete race information
					skills: {
						select: {
							id: true,
							name: true,
						},
						orderBy: {
							name: 'asc',
						},
					},
					// Include related tags for complete race information
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
			prisma.race.count({ where: searchQuery }),
		])

		const totalPages = Math.ceil(total / validatedPageSize)

		// Transform race data to match API schema format
		const transformRace = (race: (typeof races)[0]): GetRace => ({
			...race,
			description: race.description || undefined, // Convert null to undefined for consistent API
			createdAt: race.createdAt.toISOString(),
			updatedAt: race.updatedAt.toISOString(),
		})

		return {
			data: races.map(transformRace),
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
		throw new Error(`Failed to retrieve races: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to get a single race by ID with all related data
 * @param id - Race ID
 * @returns Promise<GetRace | null> - Race object with skills and tags or null if not found
 * @throws ValidationError - When ID parameter is invalid
 */
const getRaceService: GetOneService<GetRace> = async (id: number) => {
	// Validate input to ensure it's a positive integer
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Race ID must be a positive integer')
	}

	try {
		const race = await prisma.race.findUnique({
			where: { id },
			select: {
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
				// Include related skills for complete race information
				skills: {
					select: {
						id: true,
						name: true,
					},
					orderBy: {
						name: 'asc',
					},
				},
				// Include related tags for complete race information
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

		if (!race) {
			return null
		}

		// Transform and return race data
		return {
			...race,
			description: race.description || undefined, // Convert null to undefined
			createdAt: race.createdAt.toISOString(),
			updatedAt: race.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		throw new Error(`Failed to retrieve race: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to create a new race with all stat modifiers and optional associations
 * @param data - Race creation data including stat modifiers and optional skill/tag IDs
 * @returns Promise<GetRace> - Created race object with associated skills and tags
 * @throws ValidationError - When input data is invalid
 * @throws BusinessLogicError - When race name already exists or related entities don't exist
 */
const createRaceService: CreateService<CreateRace, GetRace> = async (data) => {
	// Validate required fields
	if (!data.name || typeof data.name !== 'string') {
		throw new ValidationError('Race name is required and must be a string')
	}

	const trimmedName = data.name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Race name cannot be empty')
	}

	// Validate name length according to schema constraints
	if (trimmedName.length > 50) {
		throw new ValidationError('Race name cannot exceed 50 characters')
	}

	// Validate description if provided
	if (data.description !== undefined) {
		if (typeof data.description !== 'string') {
			throw new ValidationError('Race description must be a string')
		}
		if (data.description.trim().length > 500) {
			throw new ValidationError('Race description cannot exceed 500 characters')
		}
	}

	// Validate all stat modifiers - they must be integers between -10 and 10
	const statModifiers = [
		'healthModifier',
		'staminaModifier',
		'manaModifier',
		'strengthModifier',
		'dexterityModifier',
		'constitutionModifier',
		'intelligenceModifier',
		'wisdomModifier',
		'charismaModifier',
	] as const

	for (const modifier of statModifiers) {
		const value = data[modifier]
		if (!Number.isInteger(value) || value < -10 || value > 10) {
			throw new ValidationError(`${modifier} must be an integer between -10 and 10`)
		}
	}

	try {
		// Use transaction to ensure data consistency
		const race = await prisma.$transaction(async (tx) => {
			// Check if race name already exists (case-insensitive)
			const existingRace = await tx.race.findFirst({
				where: { name: trimmedName },
				select: { id: true },
			})

			if (existingRace) {
				throw new BusinessLogicError(`Race with name "${trimmedName}" already exists`)
			}

			// Create the race with all stat modifiers
			const createdRace = await tx.race.create({
				data: {
					name: trimmedName,
					description: data.description?.trim() || null,
					healthModifier: data.healthModifier,
					staminaModifier: data.staminaModifier,
					manaModifier: data.manaModifier,
					strengthModifier: data.strengthModifier,
					dexterityModifier: data.dexterityModifier,
					constitutionModifier: data.constitutionModifier,
					intelligenceModifier: data.intelligenceModifier,
					wisdomModifier: data.wisdomModifier,
					charismaModifier: data.charismaModifier,
				},
				select: {
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
					skills: {
						select: {
							id: true,
							name: true,
						},
						orderBy: {
							name: 'asc',
						},
					},
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

			return createdRace
		})

		// Transform and return the created race
		return {
			...race,
			description: race.description || undefined,
			createdAt: race.createdAt.toISOString(),
			updatedAt: race.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError || error instanceof BusinessLogicError) {
			throw error
		}
		// Handle Prisma unique constraint violation as backup
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			throw new BusinessLogicError(`Race with name "${trimmedName}" already exists`)
		}
		throw new Error(`Failed to create race: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to update an existing race and its associations
 * @param data - Race update data with ID and optional fields
 * @returns Promise<GetRace | null> - Updated race object or null if not found
 * @throws ValidationError - When input data is invalid
 * @throws BusinessLogicError - When race name already exists for different race
 */
const updateRaceService: UpdateService<UpdateRace, GetRace> = async (data) => {
	const { id, name, description, ...modifiers } = data

	// Validate race ID
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Race ID must be a positive integer')
	}

	// Validate name if provided
	if (name !== undefined) {
		if (typeof name !== 'string') {
			throw new ValidationError('Race name must be a string')
		}

		const trimmedName = name.trim()
		if (trimmedName.length === 0) {
			throw new ValidationError('Race name cannot be empty')
		}

		if (trimmedName.length > 50) {
			throw new ValidationError('Race name cannot exceed 50 characters')
		}

		// Check if race name already exists for a different race
		const existingRace = await prisma.race.findFirst({
			where: {
				name: trimmedName,
				id: { not: id },
			},
			select: { id: true },
		})

		if (existingRace) {
			throw new BusinessLogicError(`Race with name "${trimmedName}" already exists`)
		}
	}

	// Validate description if provided
	if (description !== undefined) {
		if (typeof description !== 'string') {
			throw new ValidationError('Race description must be a string')
		}
		if (description.trim().length > 500) {
			throw new ValidationError('Race description cannot exceed 500 characters')
		}
	}

	// Validate stat modifiers if provided
	const statModifierFields = [
		'healthModifier',
		'staminaModifier',
		'manaModifier',
		'strengthModifier',
		'dexterityModifier',
		'constitutionModifier',
		'intelligenceModifier',
		'wisdomModifier',
		'charismaModifier',
	] as const

	for (const modifier of statModifierFields) {
		const value = modifiers[modifier]
		if (value !== undefined) {
			if (!Number.isInteger(value) || value < -10 || value > 10) {
				throw new ValidationError(`${modifier} must be an integer between -10 and 10`)
			}
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

		// Add stat modifiers to update data if provided
		for (const modifier of statModifierFields) {
			if (modifiers[modifier] !== undefined) {
				updateData[modifier] = modifiers[modifier]
			}
		}

		// Update the race with proper error handling
		const race = await prisma.race.update({
			where: { id },
			data: updateData,
			select: {
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
				skills: {
					select: {
						id: true,
						name: true,
					},
					orderBy: {
						name: 'asc',
					},
				},
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

		// Transform and return updated race
		return {
			...race,
			description: race.description || undefined,
			createdAt: race.createdAt.toISOString(),
			updatedAt: race.updatedAt.toISOString(),
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
			throw new BusinessLogicError(`Race with name "${name?.trim()}" already exists`)
		}
		throw new Error(`Failed to update race: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to delete a race by ID
 * Checks for references in other entities before deletion to maintain data integrity
 * @param id - Race ID to delete
 * @returns Promise<void>
 * @throws ValidationError - When ID parameter is invalid
 * @throws EntityNotFoundError - When race is not found
 * @throws BusinessLogicError - When race cannot be deleted due to references
 */
const deleteRaceService: DeleteService = async (id: number) => {
	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Race ID must be a positive integer')
	}

	try {
		await prisma.$transaction(async (tx) => {
			// Check if race exists
			const existingRace = await tx.race.findUnique({
				where: { id },
				select: { id: true, name: true },
			})

			if (!existingRace) {
				throw new EntityNotFoundError('Race', id)
			}

			// Check if race is being used by other entities (referential integrity)
			const charactersCount = await tx.character.count({ where: { raceId: id } })

			if (charactersCount > 0) {
				throw new BusinessLogicError(
					`Cannot delete race "${existingRace.name}" as it is being used by ${charactersCount} characters`,
				)
			}

			// Safe to delete - remove race and all its associations
			await tx.race.delete({
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
		throw new Error(`Failed to delete race: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to check if a race name already exists
 * Useful for validation before creating or updating races
 * @param name - Race name to check
 * @param excludeId - Optional ID to exclude from check (useful for updates)
 * @returns Promise<boolean> - True if name exists, false otherwise
 * @throws ValidationError - When name parameter is invalid
 */
const checkRaceNameExistsService = async (name: string, excludeId?: number): Promise<boolean> => {
	// Validate input
	if (!name || typeof name !== 'string') {
		throw new ValidationError('Race name is required and must be a string')
	}

	const trimmedName = name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Race name cannot be empty')
	}

	if (excludeId !== undefined && (!Number.isInteger(excludeId) || excludeId <= 0)) {
		throw new ValidationError('Exclude ID must be a positive integer')
	}

	try {
		const existingRace = await prisma.race.findFirst({
			where: {
				name: trimmedName,
				...(excludeId && { id: { not: excludeId } }),
			},
			select: { id: true },
		})

		return !!existingRace
	} catch (error) {
		throw new Error(
			`Failed to check race name existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to associate skills with a race
 * @param raceId - ID of the race to associate skills with
 * @param skillIds - Array of skill IDs to associate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When race or skills don't exist
 */
const associateRaceSkillsService = async (raceId: number, skillIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(raceId) || raceId <= 0) {
		throw new ValidationError('Race ID must be a positive integer')
	}

	if (!Array.isArray(skillIds)) {
		throw new ValidationError('Skill IDs must be an array')
	}

	// Validate each skill ID
	for (const skillId of skillIds) {
		if (!Number.isInteger(skillId) || skillId <= 0) {
			throw new ValidationError(`Skill ID ${skillId} must be a positive integer`)
		}
	}

	// Remove duplicates
	const uniqueSkillIds = [...new Set(skillIds)]

	try {
		await prisma.$transaction(async (tx) => {
			// Check if race exists
			const race = await tx.race.findUnique({
				where: { id: raceId },
				select: { id: true },
			})

			if (!race) {
				throw new EntityNotFoundError('Race', raceId)
			}

			// Check if all skills exist
			const existingSkills = await tx.skill.findMany({
				where: { id: { in: uniqueSkillIds } },
				select: { id: true },
			})

			const existingSkillIds = existingSkills.map((skill) => skill.id)
			const missingSkillIds = uniqueSkillIds.filter((id) => !existingSkillIds.includes(id))

			if (missingSkillIds.length > 0) {
				throw new EntityNotFoundError('Skills', missingSkillIds.join(', '))
			}

			// Associate skills with race (connect operation)
			await tx.race.update({
				where: { id: raceId },
				data: {
					skills: {
						connect: uniqueSkillIds.map((id) => ({ id })),
					},
				},
			})
		})
	} catch (error) {
		if (error instanceof ValidationError || error instanceof EntityNotFoundError) {
			throw error
		}
		throw new Error(
			`Failed to associate skills with race: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to dissociate skills from a race
 * @param raceId - ID of the race to dissociate skills from
 * @param skillIds - Array of skill IDs to dissociate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When race doesn't exist
 */
const dissociateRaceSkillsService = async (raceId: number, skillIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(raceId) || raceId <= 0) {
		throw new ValidationError('Race ID must be a positive integer')
	}

	if (!Array.isArray(skillIds)) {
		throw new ValidationError('Skill IDs must be an array')
	}

	// Validate each skill ID
	for (const skillId of skillIds) {
		if (!Number.isInteger(skillId) || skillId <= 0) {
			throw new ValidationError(`Skill ID ${skillId} must be a positive integer`)
		}
	}

	// Remove duplicates
	const uniqueSkillIds = [...new Set(skillIds)]

	try {
		await prisma.$transaction(async (tx) => {
			// Check if race exists
			const race = await tx.race.findUnique({
				where: { id: raceId },
				select: { id: true },
			})

			if (!race) {
				throw new EntityNotFoundError('Race', raceId)
			}

			// Dissociate skills from race (disconnect operation)
			await tx.race.update({
				where: { id: raceId },
				data: {
					skills: {
						disconnect: uniqueSkillIds.map((id) => ({ id })),
					},
				},
			})
		})
	} catch (error) {
		if (error instanceof ValidationError || error instanceof EntityNotFoundError) {
			throw error
		}
		throw new Error(
			`Failed to dissociate skills from race: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to associate tags with a race
 * @param raceId - ID of the race to associate tags with
 * @param tagIds - Array of tag IDs to associate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When race or tags don't exist
 */
const associateRaceTagsService = async (raceId: number, tagIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(raceId) || raceId <= 0) {
		throw new ValidationError('Race ID must be a positive integer')
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
			// Check if race exists
			const race = await tx.race.findUnique({
				where: { id: raceId },
				select: { id: true },
			})

			if (!race) {
				throw new EntityNotFoundError('Race', raceId)
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

			// Associate tags with race (connect operation)
			await tx.race.update({
				where: { id: raceId },
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
			`Failed to associate tags with race: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to dissociate tags from a race
 * @param raceId - ID of the race to dissociate tags from
 * @param tagIds - Array of tag IDs to dissociate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When race doesn't exist
 */
const dissociateRaceTagsService = async (raceId: number, tagIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(raceId) || raceId <= 0) {
		throw new ValidationError('Race ID must be a positive integer')
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
			// Check if race exists
			const race = await tx.race.findUnique({
				where: { id: raceId },
				select: { id: true },
			})

			if (!race) {
				throw new EntityNotFoundError('Race', raceId)
			}

			// Dissociate tags from race (disconnect operation)
			await tx.race.update({
				where: { id: raceId },
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
			`Failed to dissociate tags from race: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

export {
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
}
