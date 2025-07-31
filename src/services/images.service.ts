import BusinessLogicError from '../errors/business-logic.error.js'
import EntityNotFoundError from '../errors/entity-not-found.error.js'
import ValidationError from '../errors/validation.error.js'
import { transformSearchToQuery } from '../helpers/services.helper.js'
import type { CreateImage, GetImage, UpdateImage } from '../schemas/image.schema.js'
import type {
	CreateService,
	DeleteService,
	GetManyService,
	GetOneService,
	UpdateService,
} from '../shared-types/services.type.js'
import { Buffer } from 'node:buffer'
import { prisma } from '../index.js'

/**
 * Service function to get many images with optional filtering, searching, and pagination
 * @param params - Query parameters for filtering and pagination
 * @returns Promise<GetManyResult<GetImage>> - Paginated images response
 * @throws ValidationError - When pagination parameters are invalid
 */
const getImagesService: GetManyService<GetImage> = async (params) => {
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

	// Build orderBy clause with default sorting by filename
	const orderByClause = orderBy ? ({ [orderBy.field]: orderBy.direction } as const) : ({ filename: 'asc' } as const)

	try {
		// Execute query with transaction for consistency
		const [images, total] = await prisma.$transaction([
			prisma.image.findMany({
				where: searchQuery,
				orderBy: orderByClause,
				skip,
				take: validatedPageSize,
				select: {
					id: true,
					filename: true,
					size: true,
					width: true,
					height: true,
					mimeType: true,
					userId: true,
					isPublic: true,
					createdAt: true,
					updatedAt: true,
					// Note: buffer field is excluded from general queries for performance
				},
			}),
			prisma.image.count({ where: searchQuery }),
		])

		const totalPages = Math.ceil(total / validatedPageSize)

		// Transform data to match API schema
		const transformedImages: GetImage[] = images.map((image) => ({
			id: image.id,
			filename: image.filename,
			size: image.size,
			width: image.width,
			height: image.height,
			mimeType: image.mimeType,
			userId: image.userId,
			isPublic: image.isPublic,
			createdAt: image.createdAt.toISOString(),
			updatedAt: image.updatedAt.toISOString(),
		}))

		return {
			data: transformedImages,
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
		throw new Error(`Failed to retrieve images: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to get a single image by ID
 * @param id - Image ID
 * @returns Promise<GetImage | null> - Image object or null if not found
 * @throws ValidationError - When ID parameter is invalid
 */
const getImageService: GetOneService<GetImage> = async (id) => {
	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Image ID must be a positive integer')
	}

	try {
		const image = await prisma.image.findUnique({
			where: { id },
			select: {
				id: true,
				filename: true,
				size: true,
				width: true,
				height: true,
				mimeType: true,
				userId: true,
				isPublic: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		if (!image) {
			return null
		}

		return {
			id: image.id,
			filename: image.filename,
			size: image.size,
			width: image.width,
			height: image.height,
			mimeType: image.mimeType,
			userId: image.userId,
			isPublic: image.isPublic,
			createdAt: image.createdAt.toISOString(),
			updatedAt: image.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		throw new Error(`Failed to retrieve image: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to create a new image record
 * Note: This service only handles metadata, actual file upload should be handled by the controller
 * @param data - Image creation data with metadata and buffer
 * @param buffer - Image binary data as Buffer
 * @returns Promise<GetImage> - Created image object
 * @throws ValidationError - When input data is invalid
 * @throws EntityNotFoundError - When user doesn't exist
 * @throws BusinessLogicError - When user is inactive or file constraints are violated
 */
const createImageService: CreateService<CreateImage, GetImage> = async (data) => {
	const { filename, size, width, height, mimeType, userId, isPublic = false, buffer } = data

	// Validate filename
	if (!filename || typeof filename !== 'string') {
		throw new ValidationError('Image filename is required and must be a string')
	}

	const trimmedFilename = filename.trim()
	if (trimmedFilename.length === 0) {
		throw new ValidationError('Image filename cannot be empty')
	}

	if (trimmedFilename.length > 255) {
		throw new ValidationError('Image filename cannot exceed 255 characters')
	}

	// Validate file extension matches MIME type
	const fileExtension = trimmedFilename.split('.').pop()?.toLowerCase()
	const validExtensions = {
		'image/jpeg': ['jpg', 'jpeg'],
		'image/png': ['png'],
		'image/webp': ['webp'],
	}

	if (!validExtensions[mimeType as keyof typeof validExtensions]?.includes(fileExtension || '')) {
		throw new ValidationError(`File extension does not match MIME type ${mimeType}`)
	}

	// Validate size constraints
	if (!Number.isInteger(size) || size < 1 || size > 5242880) {
		throw new ValidationError('Image size must be between 1 and 5,242,880 bytes (5MB)')
	}

	// Validate dimensions
	if (!Number.isInteger(width) || width < 1 || width > 2048) {
		throw new ValidationError('Image width must be between 1 and 2048 pixels')
	}

	if (!Number.isInteger(height) || height < 1 || height > 2048) {
		throw new ValidationError('Image height must be between 1 and 2048 pixels')
	}

	// Validate MIME type
	const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
	if (!allowedMimeTypes.includes(mimeType)) {
		throw new ValidationError(`MIME type must be one of: ${allowedMimeTypes.join(', ')}`)
	}

	// Validate boolean field
	if (isPublic !== undefined && typeof isPublic !== 'boolean') {
		throw new ValidationError('Image isPublic must be a boolean')
	}

	// Validate user ID
	if (!Number.isInteger(userId) || userId <= 0) {
		throw new ValidationError('User ID must be a positive integer')
	}

	// Validate buffer
	if (!Buffer.isBuffer(buffer)) {
		throw new ValidationError('Image buffer must be a valid Buffer object')
	}

	if (buffer.length !== size) {
		throw new ValidationError('Buffer size does not match declared file size')
	}

	try {
		// Use transaction to ensure data consistency
		const image = await prisma.$transaction(async (tx) => {
			// Check if user exists and is active
			const user = await tx.user.findUnique({
				where: { id: userId },
				select: { id: true, isActive: true },
			})

			if (!user) {
				throw new EntityNotFoundError('User', userId)
			}

			if (!user.isActive) {
				throw new BusinessLogicError('Cannot upload image for inactive user')
			}

			// Check user's image count (optional limit - adjust as needed)
			const userImageCount = await tx.image.count({
				where: { userId },
			})

			if (userImageCount >= 100) {
				throw new BusinessLogicError('User has reached maximum image limit (100 images)')
			}

			// Check for duplicate filename for this user
			const existingImage = await tx.image.findFirst({
				where: {
					filename: trimmedFilename,
					userId,
				},
				select: { id: true },
			})

			if (existingImage) {
				throw new BusinessLogicError(`Image with filename "${trimmedFilename}" already exists for this user`)
			}

			// Create the image record
			const createdImage = await tx.image.create({
				data: {
					filename: trimmedFilename,
					size,
					width,
					height,
					mimeType,
					userId,
					isPublic: isPublic || false,
					buffer,
				},
				select: {
					id: true,
					filename: true,
					size: true,
					width: true,
					height: true,
					mimeType: true,
					userId: true,
					isPublic: true,
					createdAt: true,
					updatedAt: true,
				},
			})

			return createdImage
		})

		return {
			id: image.id,
			filename: image.filename,
			size: image.size,
			width: image.width,
			height: image.height,
			mimeType: image.mimeType,
			userId: image.userId,
			isPublic: image.isPublic,
			createdAt: image.createdAt.toISOString(),
			updatedAt: image.updatedAt.toISOString(),
		}
	} catch (error) {
		if (
			error instanceof ValidationError ||
			error instanceof BusinessLogicError ||
			error instanceof EntityNotFoundError
		) {
			throw error
		}
		// Handle Prisma unique constraint violation
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			throw new BusinessLogicError(`Image with filename "${trimmedFilename}" already exists for this user`)
		}
		throw new Error(`Failed to create image: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to update an existing image metadata and optionally the buffer
 * @param data - Image update data with ID and optional fields including buffer
 * @returns Promise<GetImage | null> - Updated image object or null if not found
 * @throws ValidationError - When input data is invalid
 * @throws EntityNotFoundError - When user doesn't exist
 * @throws BusinessLogicError - When filename conflicts or user constraints are violated
 */
const updateImageService: UpdateService<UpdateImage, GetImage> = async (data) => {
	const { id, filename, size, width, height, mimeType, userId, isPublic, buffer } = data

	// Validate image ID
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Image ID must be a positive integer')
	}

	// Validate filename if provided
	if (filename !== undefined) {
		if (typeof filename !== 'string') {
			throw new ValidationError('Image filename must be a string')
		}

		const trimmedFilename = filename.trim()
		if (trimmedFilename.length === 0) {
			throw new ValidationError('Image filename cannot be empty')
		}

		if (trimmedFilename.length > 255) {
			throw new ValidationError('Image filename cannot exceed 255 characters')
		}
	}

	// Validate size if provided
	if (size !== undefined) {
		if (!Number.isInteger(size) || size < 1 || size > 5242880) {
			throw new ValidationError('Image size must be between 1 and 5,242,880 bytes (5MB)')
		}
	}

	// Validate dimensions if provided
	if (width !== undefined) {
		if (!Number.isInteger(width) || width < 1 || width > 2048) {
			throw new ValidationError('Image width must be between 1 and 2048 pixels')
		}
	}

	if (height !== undefined) {
		if (!Number.isInteger(height) || height < 1 || height > 2048) {
			throw new ValidationError('Image height must be between 1 and 2048 pixels')
		}
	}

	// Validate MIME type if provided
	if (mimeType !== undefined) {
		const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
		if (!allowedMimeTypes.includes(mimeType)) {
			throw new ValidationError(`MIME type must be one of: ${allowedMimeTypes.join(', ')}`)
		}
	}

	// Validate isPublic if provided
	if (isPublic !== undefined && typeof isPublic !== 'boolean') {
		throw new ValidationError('Image isPublic must be a boolean')
	}

	// Validate user ID if provided
	if (userId !== undefined && (!Number.isInteger(userId) || userId <= 0)) {
		throw new ValidationError('User ID must be a positive integer')
	}

	// Validate buffer if provided
	if (buffer !== undefined) {
		if (!Buffer.isBuffer(buffer)) {
			throw new ValidationError('Image buffer must be a valid Buffer object')
		}

		// If buffer is provided and size is also provided, they should match
		if (size !== undefined && buffer.length !== size) {
			throw new ValidationError('Buffer size does not match declared file size')
		}
	}

	try {
		// Check if referenced user exists (if being updated)
		if (userId !== undefined) {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: { id: true, isActive: true },
			})

			if (!user) {
				throw new EntityNotFoundError('User', userId)
			}

			if (!user.isActive) {
				throw new BusinessLogicError('Cannot assign image to inactive user')
			}
		}

		// Check filename conflicts if filename is being updated
		if (filename !== undefined) {
			const trimmedFilename = filename.trim()

			// Get current image to check user ID
			const currentImage = await prisma.image.findUnique({
				where: { id },
				select: { userId: true },
			})

			if (!currentImage) {
				return null // Image not found
			}

			const targetUserId = userId !== undefined ? userId : currentImage.userId

			const existingImage = await prisma.image.findFirst({
				where: {
					filename: trimmedFilename,
					userId: targetUserId,
					id: { not: id },
				},
				select: { id: true },
			})

			if (existingImage) {
				throw new BusinessLogicError(`Image with filename "${trimmedFilename}" already exists for this user`)
			}
		}

		// Build update data object only with provided fields
		const updateData: Record<string, any> = {}

		if (filename !== undefined) {
			updateData.filename = filename.trim()
		}
		if (size !== undefined) {
			updateData.size = size
		}
		if (width !== undefined) {
			updateData.width = width
		}
		if (height !== undefined) {
			updateData.height = height
		}
		if (mimeType !== undefined) {
			updateData.mimeType = mimeType
		}
		if (isPublic !== undefined) {
			updateData.isPublic = isPublic
		}
		if (userId !== undefined) {
			updateData.userId = userId
		}
		if (buffer !== undefined) {
			updateData.buffer = buffer
		}

		// Update the image
		const image = await prisma.image.update({
			where: { id },
			data: updateData,
			select: {
				id: true,
				filename: true,
				size: true,
				width: true,
				height: true,
				mimeType: true,
				userId: true,
				isPublic: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		return {
			id: image.id,
			filename: image.filename,
			size: image.size,
			width: image.width,
			height: image.height,
			mimeType: image.mimeType,
			userId: image.userId,
			isPublic: image.isPublic,
			createdAt: image.createdAt.toISOString(),
			updatedAt: image.updatedAt.toISOString(),
		}
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
			throw new BusinessLogicError(`Image with filename "${filename?.trim()}" already exists for this user`)
		}
		throw new Error(`Failed to update image: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to delete an image by ID
 * Removes both metadata and binary data
 * @param id - Image ID to delete
 * @returns Promise<void>
 * @throws ValidationError - When ID parameter is invalid
 * @throws EntityNotFoundError - When image is not found
 */
const deleteImageService: DeleteService = async (id: number) => {
	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Image ID must be a positive integer')
	}

	try {
		await prisma.$transaction(async (tx) => {
			// Check if image exists
			const existingImage = await tx.image.findUnique({
				where: { id },
				select: { id: true, filename: true },
			})

			if (!existingImage) {
				throw new EntityNotFoundError('Image', id)
			}

			// Delete the image
			await tx.image.delete({
				where: { id },
			})
		})
	} catch (error) {
		if (error instanceof ValidationError || error instanceof EntityNotFoundError) {
			throw error
		}
		throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to get image binary data by ID
 * This is a separate function for performance reasons (binary data can be large)
 * @param id - Image ID
 * @returns Promise<Buffer | null> - Image binary data or null if not found
 * @throws ValidationError - When ID parameter is invalid
 */
const getImageBufferService = async (id: number): Promise<Buffer | null> => {
	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('Image ID must be a positive integer')
	}

	try {
		const image = await prisma.image.findUnique({
			where: { id },
			select: {
				buffer: true,
			},
		})

		// Convert Prisma Bytes (Uint8Array) to Buffer if image exists
		return image?.buffer ? Buffer.from(image.buffer) : null
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		throw new Error(`Failed to retrieve image buffer: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to get images owned by a specific user
 * @param userId - User ID to filter images
 * @param params - Query parameters for pagination and ordering
 * @returns Promise<GetManyResult<GetImage>> - User's images with pagination
 * @throws ValidationError - When parameters are invalid
 * @throws EntityNotFoundError - When user doesn't exist
 */
const getUserImagesService = async (
	userId: number,
	params: { page?: number; pageSize?: number; orderBy?: { field: string; direction: 'asc' | 'desc' } } = {},
) => {
	// Validate user ID
	if (!Number.isInteger(userId) || userId <= 0) {
		throw new ValidationError('User ID must be a positive integer')
	}

	const { page = 1, pageSize = 10, orderBy } = params

	// Validate pagination parameters
	if (page < 1) {
		throw new ValidationError('Page number must be greater than 0')
	}
	if (pageSize < 1 || pageSize > 100) {
		throw new ValidationError('Page size must be between 1 and 100')
	}

	try {
		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true },
		})

		if (!user) {
			throw new EntityNotFoundError('User', userId)
		}

		const skip = (page - 1) * pageSize
		const orderByClause = orderBy
			? ({ [orderBy.field]: orderBy.direction } as const)
			: ({ filename: 'asc' } as const)

		// Get user's images with pagination
		const [images, total] = await prisma.$transaction([
			prisma.image.findMany({
				where: { userId },
				orderBy: orderByClause,
				skip,
				take: pageSize,
				select: {
					id: true,
					filename: true,
					size: true,
					width: true,
					height: true,
					mimeType: true,
					userId: true,
					isPublic: true,
					createdAt: true,
					updatedAt: true,
				},
			}),
			prisma.image.count({ where: { userId } }),
		])

		const totalPages = Math.ceil(total / pageSize)

		// Transform data
		const transformedImages: GetImage[] = images.map((image) => ({
			id: image.id,
			filename: image.filename,
			size: image.size,
			width: image.width,
			height: image.height,
			mimeType: image.mimeType,
			userId: image.userId,
			isPublic: image.isPublic,
			createdAt: image.createdAt.toISOString(),
			updatedAt: image.updatedAt.toISOString(),
		}))

		return {
			data: transformedImages,
			pagination: {
				page,
				pageSize,
				total,
				totalPages,
			},
		}
	} catch (error) {
		if (error instanceof ValidationError || error instanceof EntityNotFoundError) {
			throw error
		}
		throw new Error(`Failed to retrieve user images: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

export {
	createImageService,
	deleteImageService,
	getImageBufferService,
	getImageService,
	getImagesService,
	getUserImagesService,
	updateImageService,
}
