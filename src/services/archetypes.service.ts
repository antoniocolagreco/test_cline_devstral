import BusinessLogicError from '../errors/business-logic.error.js'
import EntityNotFoundError from '../errors/entity-not-found.error.js'
import ValidationError from '../errors/validation.error.js'
import { transformSearchToQuery } from '../helpers/services.helper.js'
import type { CreateArchetype, GetArchetype, UpdateArchetype } from '../schemas/archetype.schema.js'
import type {
	CreateService,
	DeleteService,
	GetManyService,
	GetOneService,
	UpdateService,
} from '../shared-types/services.type.js'
import { prisma } from '../index.js'

/**
 * Service function to get many archetypes with optional filtering, searching, and pagination
 * Includes related skills and tags in the response for complete archetype information
 * @param params - Query parameters for filtering and pagination
 * @returns Promise<GetManyResult<GetArchetype>> - Paginated archetypes response with skills and tags
 * @throws ValidationError - When pagination parameters are invalid
 */
const getArchetypesService: GetManyService<GetArchetype> = async (params) => {
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
		const [archetypes, total] = await prisma.$transaction([
			prisma.archetype.findMany({
				where: searchQuery,
				orderBy: orderByClause,
				skip,
				take: validatedPageSize,
				select: {
					id: true,
					name: true,
					description: true,
					createdAt: true,
					updatedAt: true,
					// Include related skills for complete archetype information
					skills: {
						select: {
							id: true,
							name: true,
						},
						orderBy: {
							name: 'asc',
						},
					},
					// Include related tags for complete archetype information
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
			prisma.archetype.count({ where: searchQuery }),
		])

		const totalPages = Math.ceil(total / validatedPageSize)

		// Transform archetype data to match API schema format
		const transformArchetype = (archetype: (typeof archetypes)[0]): GetArchetype => ({
			...archetype,
			description: archetype.description || undefined, // Convert null to undefined for consistent API
			createdAt: archetype.createdAt.toISOString(),
			updatedAt: archetype.updatedAt.toISOString(),
		})

		return {
			data: archetypes.map(transformArchetype),
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
		throw new Error(`Failed to retrieve archetypes: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to get a single archetype by ID with all related data
 * @param id - Archetype ID
 * @returns Promise<GetArchetype | null> - Archetype object with skills and tags or null if not found
 * @throws ValidationError - When ID parameter is invalid
 */
const getArchetypeService: GetOneService<GetArchetype> = async (id: number) => {
	// Validate input to ensure it's a positive integer
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Archetype ID must be a positive integer')
	}

	try {
		const archetype = await prisma.archetype.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				updatedAt: true,
				// Include related skills for complete archetype information
				skills: {
					select: {
						id: true,
						name: true,
					},
					orderBy: {
						name: 'asc',
					},
				},
				// Include related tags for complete archetype information
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

		if (!archetype) {
			return null
		}

		// Transform and return archetype data
		return {
			...archetype,
			description: archetype.description || undefined, // Convert null to undefined
			createdAt: archetype.createdAt.toISOString(),
			updatedAt: archetype.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		throw new Error(`Failed to retrieve archetype: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to create a new archetype with optional skill and tag associations
 * @param data - Archetype creation data including optional skill and tag IDs
 * @returns Promise<GetArchetype> - Created archetype object with associated skills and tags
 * @throws ValidationError - When input data is invalid
 * @throws BusinessLogicError - When archetype name already exists or related entities don't exist
 */
const createArchetypeService: CreateService<CreateArchetype, GetArchetype> = async (data) => {
	// Validate required fields
	if (!data.name || typeof data.name !== 'string') {
		throw new ValidationError('Archetype name is required and must be a string')
	}

	const trimmedName = data.name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Archetype name cannot be empty')
	}

	// Validate name length according to schema constraints
	if (trimmedName.length > 50) {
		throw new ValidationError('Archetype name cannot exceed 50 characters')
	}

	// Validate description if provided
	if (data.description !== undefined) {
		if (typeof data.description !== 'string') {
			throw new ValidationError('Archetype description must be a string')
		}
		if (data.description.trim().length > 500) {
			throw new ValidationError('Archetype description cannot exceed 500 characters')
		}
	}

	try {
		// Use transaction to ensure data consistency
		const archetype = await prisma.$transaction(async (tx) => {
			// Check if archetype name already exists (case-insensitive)
			const existingArchetype = await tx.archetype.findFirst({
				where: { name: trimmedName },
				select: { id: true },
			})

			if (existingArchetype) {
				throw new BusinessLogicError(`Archetype with name "${trimmedName}" already exists`)
			}

			// Create the archetype with basic data
			const createdArchetype = await tx.archetype.create({
				data: {
					name: trimmedName,
					description: data.description?.trim() || null,
				},
				select: {
					id: true,
					name: true,
					description: true,
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

			return createdArchetype
		})

		// Transform and return the created archetype
		return {
			...archetype,
			description: archetype.description || undefined,
			createdAt: archetype.createdAt.toISOString(),
			updatedAt: archetype.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError || error instanceof BusinessLogicError) {
			throw error
		}
		// Handle Prisma unique constraint violation as backup
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			throw new BusinessLogicError(`Archetype with name "${trimmedName}" already exists`)
		}
		throw new Error(`Failed to create archetype: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to update an existing archetype and its associations
 * @param data - Archetype update data with ID and optional fields
 * @returns Promise<GetArchetype | null> - Updated archetype object or null if not found
 * @throws ValidationError - When input data is invalid
 * @throws BusinessLogicError - When archetype name already exists for different archetype
 */
const updateArchetypeService: UpdateService<UpdateArchetype, GetArchetype> = async (data) => {
	const { id, name, description } = data

	// Validate archetype ID
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Archetype ID must be a positive integer')
	}

	// Validate name if provided
	if (name !== undefined) {
		if (typeof name !== 'string') {
			throw new ValidationError('Archetype name must be a string')
		}

		const trimmedName = name.trim()
		if (trimmedName.length === 0) {
			throw new ValidationError('Archetype name cannot be empty')
		}

		if (trimmedName.length > 50) {
			throw new ValidationError('Archetype name cannot exceed 50 characters')
		}

		// Check if archetype name already exists for a different archetype
		const existingArchetype = await prisma.archetype.findFirst({
			where: {
				name: trimmedName,
				id: { not: id },
			},
			select: { id: true },
		})

		if (existingArchetype) {
			throw new BusinessLogicError(`Archetype with name "${trimmedName}" already exists`)
		}
	}

	// Validate description if provided
	if (description !== undefined) {
		if (typeof description !== 'string') {
			throw new ValidationError('Archetype description must be a string')
		}
		if (description.trim().length > 500) {
			throw new ValidationError('Archetype description cannot exceed 500 characters')
		}
	}

	try {
		// Build update data object only with provided fields
		const updateData: { name?: string; description?: string | null } = {}
		if (name !== undefined) {
			updateData.name = name.trim()
		}
		if (description !== undefined) {
			updateData.description = description.trim() || null
		}

		// Update the archetype with proper error handling
		const archetype = await prisma.archetype.update({
			where: { id },
			data: updateData,
			select: {
				id: true,
				name: true,
				description: true,
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

		// Transform and return updated archetype
		return {
			...archetype,
			description: archetype.description || undefined,
			createdAt: archetype.createdAt.toISOString(),
			updatedAt: archetype.updatedAt.toISOString(),
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
			throw new BusinessLogicError(`Archetype with name "${name?.trim()}" already exists`)
		}
		throw new Error(`Failed to update archetype: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to delete an archetype by ID
 * Checks for references in other entities before deletion to maintain data integrity
 * @param id - Archetype ID to delete
 * @returns Promise<void>
 * @throws ValidationError - When ID parameter is invalid
 * @throws EntityNotFoundError - When archetype is not found
 * @throws BusinessLogicError - When archetype cannot be deleted due to references
 */
const deleteArchetypeService: DeleteService = async (id: number) => {
	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Archetype ID must be a positive integer')
	}

	try {
		await prisma.$transaction(async (tx) => {
			// Check if archetype exists
			const existingArchetype = await tx.archetype.findUnique({
				where: { id },
				select: { id: true, name: true },
			})

			if (!existingArchetype) {
				throw new EntityNotFoundError('Archetype', id)
			}

			// Check if archetype is being used by other entities (referential integrity)
			const charactersCount = await tx.character.count({ where: { archetypeId: id } })

			if (charactersCount > 0) {
				throw new BusinessLogicError(
					`Cannot delete archetype "${existingArchetype.name}" as it is being used by ${charactersCount} characters`,
				)
			}

			// Safe to delete - remove archetype and all its associations
			await tx.archetype.delete({
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
		throw new Error(`Failed to delete archetype: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to check if an archetype name already exists
 * Useful for validation before creating or updating archetypes
 * @param name - Archetype name to check
 * @param excludeId - Optional ID to exclude from check (useful for updates)
 * @returns Promise<boolean> - True if name exists, false otherwise
 * @throws ValidationError - When name parameter is invalid
 */
const checkArchetypeNameExistsService = async (name: string, excludeId?: number): Promise<boolean> => {
	// Validate input
	if (!name || typeof name !== 'string') {
		throw new ValidationError('Archetype name is required and must be a string')
	}

	const trimmedName = name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Archetype name cannot be empty')
	}

	if (excludeId !== undefined && (!Number.isInteger(excludeId) || excludeId <= 0)) {
		throw new ValidationError('Exclude ID must be a positive integer')
	}

	try {
		const existingArchetype = await prisma.archetype.findFirst({
			where: {
				name: trimmedName,
				...(excludeId && { id: { not: excludeId } }),
			},
			select: { id: true },
		})

		return !!existingArchetype
	} catch (error) {
		throw new Error(
			`Failed to check archetype name existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to associate skills with an archetype
 * @param archetypeId - ID of the archetype to associate skills with
 * @param skillIds - Array of skill IDs to associate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When archetype or skills don't exist
 */
const associateArchetypeSkillsService = async (archetypeId: number, skillIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(archetypeId) || archetypeId <= 0) {
		throw new ValidationError('Archetype ID must be a positive integer')
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
			// Check if archetype exists
			const archetype = await tx.archetype.findUnique({
				where: { id: archetypeId },
				select: { id: true },
			})

			if (!archetype) {
				throw new EntityNotFoundError('Archetype', archetypeId)
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

			// Associate skills with archetype (connect operation)
			await tx.archetype.update({
				where: { id: archetypeId },
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
			`Failed to associate skills with archetype: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to dissociate skills from an archetype
 * @param archetypeId - ID of the archetype to dissociate skills from
 * @param skillIds - Array of skill IDs to dissociate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When archetype doesn't exist
 */
const dissociateArchetypeSkillsService = async (archetypeId: number, skillIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(archetypeId) || archetypeId <= 0) {
		throw new ValidationError('Archetype ID must be a positive integer')
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
			// Check if archetype exists
			const archetype = await tx.archetype.findUnique({
				where: { id: archetypeId },
				select: { id: true },
			})

			if (!archetype) {
				throw new EntityNotFoundError('Archetype', archetypeId)
			}

			// Dissociate skills from archetype (disconnect operation)
			await tx.archetype.update({
				where: { id: archetypeId },
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
			`Failed to dissociate skills from archetype: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to associate tags with an archetype
 * @param archetypeId - ID of the archetype to associate tags with
 * @param tagIds - Array of tag IDs to associate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When archetype or tags don't exist
 */
const associateArchetypeTagsService = async (archetypeId: number, tagIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(archetypeId) || archetypeId <= 0) {
		throw new ValidationError('Archetype ID must be a positive integer')
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
			// Check if archetype exists
			const archetype = await tx.archetype.findUnique({
				where: { id: archetypeId },
				select: { id: true },
			})

			if (!archetype) {
				throw new EntityNotFoundError('Archetype', archetypeId)
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

			// Associate tags with archetype (connect operation)
			await tx.archetype.update({
				where: { id: archetypeId },
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
			`Failed to associate tags with archetype: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to dissociate tags from an archetype
 * @param archetypeId - ID of the archetype to dissociate tags from
 * @param tagIds - Array of tag IDs to dissociate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When archetype doesn't exist
 */
const dissociateArchetypeTagsService = async (archetypeId: number, tagIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(archetypeId) || archetypeId <= 0) {
		throw new ValidationError('Archetype ID must be a positive integer')
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
			// Check if archetype exists
			const archetype = await tx.archetype.findUnique({
				where: { id: archetypeId },
				select: { id: true },
			})

			if (!archetype) {
				throw new EntityNotFoundError('Archetype', archetypeId)
			}

			// Dissociate tags from archetype (disconnect operation)
			await tx.archetype.update({
				where: { id: archetypeId },
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
			`Failed to dissociate tags from archetype: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

export {
	associateArchetypeSkillsService,
	associateArchetypeTagsService,
	checkArchetypeNameExistsService,
	createArchetypeService,
	deleteArchetypeService,
	dissociateArchetypeSkillsService,
	dissociateArchetypeTagsService,
	getArchetypeService,
	getArchetypesService,
	updateArchetypeService,
}
