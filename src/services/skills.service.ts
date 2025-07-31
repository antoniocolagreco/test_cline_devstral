import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { transformSearchToQuery } from '@helpers/services.helper.js'
import type { CreateSkill, GetSkill, UpdateSkill } from '@schemas/skill.schema.js'
import type {
	CreateService,
	DeleteService,
	GetManyService,
	GetOneService,
	UpdateService,
} from '@shared-types/services.type.js'
import { prisma } from '../index.js'

/**
 * Service function to get many skills with optional filtering, searching, and pagination
 * Includes related tags in the response for complete skill information
 * @param params - Query parameters for filtering and pagination
 * @returns Promise<GetManyResult<GetSkill>> - Paginated skills response with tags
 * @throws ValidationError - When pagination parameters are invalid
 */
const getSkillsService: GetManyService<GetSkill> = async (params) => {
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
		const [skills, total] = await prisma.$transaction([
			prisma.skill.findMany({
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
					// Include related tags for complete skill information
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
			prisma.skill.count({ where: searchQuery }),
		])

		const totalPages = Math.ceil(total / validatedPageSize)

		// Transform skill data to match API schema format
		const transformSkill = (skill: (typeof skills)[0]): GetSkill => ({
			...skill,
			description: skill.description || undefined, // Convert null to undefined for consistent API
			createdAt: skill.createdAt.toISOString(),
			updatedAt: skill.updatedAt.toISOString(),
		})

		return {
			data: skills.map(transformSkill),
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
		throw new Error(`Failed to retrieve skills: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to get a single skill by ID with all related data
 * @param id - Skill ID
 * @returns Promise<GetSkill | null> - Skill object with tags or null if not found
 * @throws ValidationError - When ID parameter is invalid
 */
const getSkillService: GetOneService<GetSkill> = async (id: number) => {
	// Validate input to ensure it's a positive integer
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Skill ID must be a positive integer')
	}

	try {
		const skill = await prisma.skill.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				updatedAt: true,
				// Include related tags for complete skill information
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

		if (!skill) {
			return null
		}

		// Transform and return skill data
		return {
			...skill,
			description: skill.description || undefined, // Convert null to undefined
			createdAt: skill.createdAt.toISOString(),
			updatedAt: skill.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		throw new Error(`Failed to retrieve skill: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to create a new skill with optional tag associations
 * @param data - Skill creation data including optional tag IDs
 * @returns Promise<GetSkill> - Created skill object with associated tags
 * @throws ValidationError - When input data is invalid
 * @throws BusinessLogicError - When skill name already exists or tags don't exist
 */
const createSkillService: CreateService<CreateSkill, GetSkill> = async (data) => {
	// Validate required fields
	if (!data.name || typeof data.name !== 'string') {
		throw new ValidationError('Skill name is required and must be a string')
	}

	const trimmedName = data.name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Skill name cannot be empty')
	}

	// Validate name length according to schema constraints
	if (trimmedName.length > 100) {
		throw new ValidationError('Skill name cannot exceed 100 characters')
	}

	// Validate description if provided
	if (data.description !== undefined) {
		if (typeof data.description !== 'string') {
			throw new ValidationError('Skill description must be a string')
		}
		if (data.description.trim().length > 500) {
			throw new ValidationError('Skill description cannot exceed 500 characters')
		}
	}

	try {
		// Use transaction to ensure data consistency
		const skill = await prisma.$transaction(async (tx) => {
			// Check if skill name already exists (case-insensitive)
			const existingSkill = await tx.skill.findFirst({
				where: { name: trimmedName },
				select: { id: true },
			})

			if (existingSkill) {
				throw new BusinessLogicError(`Skill with name "${trimmedName}" already exists`)
			}

			// Create the skill with basic data
			const createdSkill = await tx.skill.create({
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

			return createdSkill
		})

		// Transform and return the created skill
		return {
			...skill,
			description: skill.description || undefined,
			createdAt: skill.createdAt.toISOString(),
			updatedAt: skill.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError || error instanceof BusinessLogicError) {
			throw error
		}
		// Handle Prisma unique constraint violation as backup
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			throw new BusinessLogicError(`Skill with name "${trimmedName}" already exists`)
		}
		throw new Error(`Failed to create skill: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to update an existing skill and its tag associations
 * @param data - Skill update data with ID and optional fields
 * @returns Promise<GetSkill | null> - Updated skill object or null if not found
 * @throws ValidationError - When input data is invalid
 * @throws BusinessLogicError - When skill name already exists for different skill
 */
const updateSkillService: UpdateService<UpdateSkill, GetSkill> = async (data) => {
	const { id, name, description } = data

	// Validate skill ID
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Skill ID must be a positive integer')
	}

	// Validate name if provided
	if (name !== undefined) {
		if (typeof name !== 'string') {
			throw new ValidationError('Skill name must be a string')
		}

		const trimmedName = name.trim()
		if (trimmedName.length === 0) {
			throw new ValidationError('Skill name cannot be empty')
		}

		if (trimmedName.length > 100) {
			throw new ValidationError('Skill name cannot exceed 100 characters')
		}

		// Check if skill name already exists for a different skill
		const existingSkill = await prisma.skill.findFirst({
			where: {
				name: trimmedName,
				id: { not: id },
			},
			select: { id: true },
		})

		if (existingSkill) {
			throw new BusinessLogicError(`Skill with name "${trimmedName}" already exists`)
		}
	}

	// Validate description if provided
	if (description !== undefined) {
		if (typeof description !== 'string') {
			throw new ValidationError('Skill description must be a string')
		}
		if (description.trim().length > 500) {
			throw new ValidationError('Skill description cannot exceed 500 characters')
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

		// Update the skill with proper error handling
		const skill = await prisma.skill.update({
			where: { id },
			data: updateData,
			select: {
				id: true,
				name: true,
				description: true,
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

		// Transform and return updated skill
		return {
			...skill,
			description: skill.description || undefined,
			createdAt: skill.createdAt.toISOString(),
			updatedAt: skill.updatedAt.toISOString(),
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
			throw new BusinessLogicError(`Skill with name "${name?.trim()}" already exists`)
		}
		throw new Error(`Failed to update skill: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to delete a skill by ID
 * Checks for references in other entities before deletion to maintain data integrity
 * @param id - Skill ID to delete
 * @returns Promise<void>
 * @throws ValidationError - When ID parameter is invalid
 * @throws EntityNotFoundError - When skill is not found
 * @throws BusinessLogicError - When skill cannot be deleted due to references
 */
const deleteSkillService: DeleteService = async (id: number) => {
	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Skill ID must be a positive integer')
	}

	try {
		await prisma.$transaction(async (tx) => {
			// Check if skill exists
			const existingSkill = await tx.skill.findUnique({
				where: { id },
				select: { id: true, name: true },
			})

			if (!existingSkill) {
				throw new EntityNotFoundError('Skill', id)
			}

			// Check if skill is being used by other entities (referential integrity)
			const [archetypesCount, racesCount] = await Promise.all([
				tx.archetype.count({ where: { skills: { some: { id } } } }),
				tx.race.count({ where: { skills: { some: { id } } } }),
			])

			const totalReferences = archetypesCount + racesCount

			if (totalReferences > 0) {
				throw new BusinessLogicError(
					`Cannot delete skill "${existingSkill.name}" as it is being used by ${totalReferences} other entities (archetypes: ${archetypesCount}, races: ${racesCount})`,
				)
			}

			// Safe to delete - remove skill and all its tag associations
			await tx.skill.delete({
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
		throw new Error(`Failed to delete skill: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to check if a skill name already exists
 * Useful for validation before creating or updating skills
 * @param name - Skill name to check
 * @param excludeId - Optional ID to exclude from check (useful for updates)
 * @returns Promise<boolean> - True if name exists, false otherwise
 * @throws ValidationError - When name parameter is invalid
 */
const checkSkillNameExistsService = async (name: string, excludeId?: number): Promise<boolean> => {
	// Validate input
	if (!name || typeof name !== 'string') {
		throw new ValidationError('Skill name is required and must be a string')
	}

	const trimmedName = name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Skill name cannot be empty')
	}

	if (excludeId !== undefined && (!Number.isInteger(excludeId) || excludeId <= 0)) {
		throw new ValidationError('Exclude ID must be a positive integer')
	}

	try {
		const existingSkill = await prisma.skill.findFirst({
			where: {
				name: trimmedName,
				...(excludeId && { id: { not: excludeId } }),
			},
			select: { id: true },
		})

		return !!existingSkill
	} catch (error) {
		throw new Error(
			`Failed to check skill name existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to associate tags with a skill
 * @param skillId - ID of the skill to associate tags with
 * @param tagIds - Array of tag IDs to associate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When skill or tags don't exist
 */
const associateSkillTagsService = async (skillId: number, tagIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(skillId) || skillId <= 0) {
		throw new ValidationError('Skill ID must be a positive integer')
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
			// Check if skill exists
			const skill = await tx.skill.findUnique({
				where: { id: skillId },
				select: { id: true },
			})

			if (!skill) {
				throw new EntityNotFoundError('Skill', skillId)
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

			// Associate tags with skill (connect operation)
			await tx.skill.update({
				where: { id: skillId },
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
			`Failed to associate tags with skill: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to dissociate tags from a skill
 * @param skillId - ID of the skill to dissociate tags from
 * @param tagIds - Array of tag IDs to dissociate
 * @returns Promise<void>
 * @throws ValidationError - When input parameters are invalid
 * @throws EntityNotFoundError - When skill doesn't exist
 */
const dissociateSkillTagsService = async (skillId: number, tagIds: number[]): Promise<void> => {
	// Validate input
	if (!Number.isInteger(skillId) || skillId <= 0) {
		throw new ValidationError('Skill ID must be a positive integer')
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
			// Check if skill exists
			const skill = await tx.skill.findUnique({
				where: { id: skillId },
				select: { id: true },
			})

			if (!skill) {
				throw new EntityNotFoundError('Skill', skillId)
			}

			// Dissociate tags from skill (disconnect operation)
			await tx.skill.update({
				where: { id: skillId },
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
			`Failed to dissociate tags from skill: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

export {
	associateSkillTagsService,
	checkSkillNameExistsService,
	createSkillService,
	deleteSkillService,
	dissociateSkillTagsService,
	getSkillService,
	getSkillsService,
	updateSkillService,
}
