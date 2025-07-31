import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { transformSearchToQuery } from '@helpers/services.helper.js'
import type { CreateTag, GetTag, UpdateTag } from '@schemas/tag.schema.js'
import type {
	CreateService,
	DeleteService,
	GetManyService,
	GetOneService,
	UpdateService,
} from '@shared-types/services.type.js'
import { prisma } from '../index.js'

/**
 * Service function to get many tags with optional filtering, searching, and pagination
 * @param params - Query parameters for filtering and pagination
 * @returns Promise<GetManyResult<GetTag>> - Paginated tags response
 * @throws ValidationError - When pagination parameters are invalid
 */
const getTagsService: GetManyService<GetTag> = async (params) => {
	const { page = 1, pageSize = 10, search, orderBy } = params

	// Validate pagination parameters
	if (page < 1) {
		throw new ValidationError('Page number must be greater than 0')
	}
	if (pageSize < 1 || pageSize > 100) {
		throw new ValidationError('Page size must be between 1 and 100')
	}

	const validatedPage = page
	const validatedPageSize = pageSize
	const skip = (validatedPage - 1) * validatedPageSize

	// Transform search object to Prisma query format
	const searchQuery = transformSearchToQuery(search)

	// Build orderBy clause with better type safety
	const orderByClause = orderBy ? ({ [orderBy.field]: orderBy.direction } as const) : ({ name: 'asc' } as const)

	try {
		// Use Prisma transaction to ensure data consistency
		const [tags, total] = await prisma.$transaction([
			prisma.tag.findMany({
				where: searchQuery,
				orderBy: orderByClause,
				skip,
				take: validatedPageSize,
				select: {
					id: true,
					name: true,
					createdAt: true,
					updatedAt: true,
				},
			}),
			prisma.tag.count({ where: searchQuery }),
		])

		const totalPages = Math.ceil(total / validatedPageSize)

		// Optimize date transformation using a helper function
		const transformTag = (tag: (typeof tags)[0]): GetTag => ({
			...tag,
			createdAt: tag.createdAt.toISOString(),
			updatedAt: tag.updatedAt.toISOString(),
		})

		return {
			data: tags.map(transformTag),
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
		throw new Error(`Failed to retrieve tags: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to get a single tag by ID
 * @param id - Tag ID
 * @returns Promise<GetTag | null> - Tag object or null if not found
 * @throws ValidationError - When ID parameter is invalid
 */
const getTagService: GetOneService<GetTag> = async (id: number) => {
	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Tag ID must be a positive integer')
	}

	try {
		const tag = await prisma.tag.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		if (!tag) {
			return null
		}

		return {
			...tag,
			createdAt: tag.createdAt.toISOString(),
			updatedAt: tag.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		throw new Error(`Failed to retrieve tag: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to create a new tag
 * @param data - Tag creation data
 * @returns Promise<GetTag> - Created tag object
 * @throws ValidationError - When input data is invalid
 * @throws BusinessLogicError - When tag name already exists
 */
const createTagService: CreateService<CreateTag, GetTag> = async (data) => {
	// Validate input
	if (!data.name || typeof data.name !== 'string') {
		throw new ValidationError('Tag name is required and must be a string')
	}

	const trimmedName = data.name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Tag name cannot be empty')
	}

	if (trimmedName.length > 50) {
		throw new ValidationError('Tag name cannot exceed 50 characters')
	}

	try {
		// Check if tag name already exists
		const existingTag = await prisma.tag.findFirst({
			where: { name: trimmedName },
			select: { id: true },
		})

		if (existingTag) {
			throw new BusinessLogicError(`Tag with name "${trimmedName}" already exists`)
		}

		const tag = await prisma.tag.create({
			data: {
				name: trimmedName,
			},
			select: {
				id: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		return {
			...tag,
			createdAt: tag.createdAt.toISOString(),
			updatedAt: tag.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError || error instanceof BusinessLogicError) {
			throw error
		}
		// Handle Prisma unique constraint violation
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			throw new BusinessLogicError(`Tag with name "${trimmedName}" already exists`)
		}
		throw new Error(`Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to update an existing tag
 * @param data - Tag update data with ID
 * @returns Promise<GetTag | null> - Updated tag object or null if not found
 * @throws ValidationError - When input data is invalid
 * @throws BusinessLogicError - When tag name already exists for different tag
 */
const updateTagService: UpdateService<UpdateTag, GetTag> = async (data) => {
	const { id, name } = data

	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Tag ID must be a positive integer')
	}

	if (name !== undefined) {
		if (typeof name !== 'string') {
			throw new ValidationError('Tag name must be a string')
		}

		const trimmedName = name.trim()
		if (trimmedName.length === 0) {
			throw new ValidationError('Tag name cannot be empty')
		}

		if (trimmedName.length > 50) {
			throw new ValidationError('Tag name cannot exceed 50 characters')
		}

		// Check if tag name already exists for a different tag
		const existingTag = await prisma.tag.findFirst({
			where: {
				name: trimmedName,
				id: { not: id },
			},
			select: { id: true },
		})

		if (existingTag) {
			throw new BusinessLogicError(`Tag with name "${trimmedName}" already exists`)
		}
	}

	try {
		// Build update data object only with provided fields
		const updateData: { name?: string } = {}
		if (name !== undefined) {
			updateData.name = name.trim()
		}

		const tag = await prisma.tag.update({
			where: { id },
			data: updateData,
			select: {
				id: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		return {
			...tag,
			createdAt: tag.createdAt.toISOString(),
			updatedAt: tag.updatedAt.toISOString(),
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
			throw new BusinessLogicError(`Tag with name "${name?.trim()}" already exists`)
		}
		throw new Error(`Failed to update tag: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to delete a tag by ID
 * @param id - Tag ID to delete
 * @returns Promise<void>
 * @throws ValidationError - When ID parameter is invalid
 * @throws EntityNotFoundError - When tag is not found
 * @throws BusinessLogicError - When tag cannot be deleted due to references
 */
const deleteTagService: DeleteService = async (id: number) => {
	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Tag ID must be a positive integer')
	}

	try {
		await prisma.$transaction(async (tx) => {
			// Check if tag exists
			const existingTag = await tx.tag.findUnique({
				where: { id },
				select: { id: true, name: true },
			})

			if (!existingTag) {
				throw new EntityNotFoundError('Tag', id)
			}

			// Check if tag is being used by other entities
			const [itemsCount, charactersCount, skillsCount, archetypesCount, racesCount] = await Promise.all([
				tx.item.count({ where: { tags: { some: { id } } } }),
				tx.character.count({ where: { tags: { some: { id } } } }),
				tx.skill.count({ where: { tags: { some: { id } } } }),
				tx.archetype.count({ where: { tags: { some: { id } } } }),
				tx.race.count({ where: { tags: { some: { id } } } }),
			])

			const totalReferences = itemsCount + charactersCount + skillsCount + archetypesCount + racesCount

			if (totalReferences > 0) {
				throw new BusinessLogicError(
					`Cannot delete tag "${existingTag.name}" as it is being used by ${totalReferences} other entities`,
				)
			}

			await tx.tag.delete({
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
		throw new Error(`Failed to delete tag: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to check if a tag name already exists
 * @param name - Tag name to check
 * @param excludeId - Optional ID to exclude from check (useful for updates)
 * @returns Promise<boolean> - True if name exists, false otherwise
 * @throws ValidationError - When name parameter is invalid
 */
const checkTagNameExistsService = async (name: string, excludeId?: number): Promise<boolean> => {
	// Validate input
	if (!name || typeof name !== 'string') {
		throw new ValidationError('Tag name is required and must be a string')
	}

	const trimmedName = name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Tag name cannot be empty')
	}

	if (excludeId !== undefined && (!Number.isInteger(excludeId) || excludeId <= 0)) {
		throw new ValidationError('Exclude ID must be a positive integer')
	}

	try {
		const existingTag = await prisma.tag.findFirst({
			where: {
				name: trimmedName,
				...(excludeId && { id: { not: excludeId } }),
			},
			select: { id: true },
		})

		return !!existingTag
	} catch (error) {
		throw new Error(
			`Failed to check tag name existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

export {
	checkTagNameExistsService,
	createTagService,
	deleteTagService,
	getTagService,
	getTagsService,
	updateTagService,
}
