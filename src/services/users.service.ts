import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { transformSearchToQuery } from '@helpers/services.helper.js'
import type { CreateUser, GetUser, UpdateUser } from '@schemas/user.schema.js'
import type {
	DeleteService,
	GetManyService,
	GetOneService,
	CreateService,
	UpdateService,
} from '@shared-types/services.type.js'
import { prisma } from '../index.js'
import bcrypt from 'bcrypt'

/**
 * Service function to get many users with optional filtering, searching, and pagination
 * Excludes sensitive information like passwords in the response
 * @param params - Query parameters for filtering and pagination
 * @returns Promise<GetManyResult<GetUser>> - Paginated users response without sensitive data
 * @throws ValidationError - When pagination parameters are invalid
 */
const getUsersService: GetManyService<GetUser> = async (params) => {
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
		const [users, total] = await prisma.$transaction([
			prisma.user.findMany({
				where: searchQuery,
				orderBy: orderByClause,
				skip,
				take: validatedPageSize,
				select: {
					id: true,
					name: true,
					email: true,
					// Exclude password for security reasons
					password: false,
					googleId: true,
					githubId: true,
					discordId: true,
					avatarPath: true,
					isVerified: true,
					isActive: true,
					lastLoginAt: true,
					createdAt: true,
					updatedAt: true,
				},
			}),
			prisma.user.count({ where: searchQuery }),
		])

		const totalPages = Math.ceil(total / validatedPageSize)

		// Transform user data to match API schema format
		const transformUser = (user: (typeof users)[0]): GetUser => ({
			...user,
			googleId: user.googleId || undefined,
			githubId: user.githubId || undefined,
			discordId: user.discordId || undefined,
			avatarPath: user.avatarPath || undefined,
			lastLoginAt: user.lastLoginAt?.toISOString(),
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		})

		return {
			data: users.map(transformUser),
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
		throw new Error(`Failed to retrieve users: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to get a single user by ID
 * Excludes password from the response for security
 * @param id - User ID
 * @returns Promise<GetUser | null> - User object without password or null if not found
 * @throws ValidationError - When ID parameter is invalid
 */
const getUserService: GetOneService<GetUser> = async (id: number) => {
	// Validate input to ensure it's a positive integer
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('User ID must be a positive integer')
	}

	try {
		const user = await prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				email: true,
				// Exclude password for security reasons
				password: false,
				googleId: true,
				githubId: true,
				discordId: true,
				avatarPath: true,
				isVerified: true,
				isActive: true,
				lastLoginAt: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		if (!user) {
			return null
		}

		// Transform and return user data
		return {
			...user,
			googleId: user.googleId || undefined,
			githubId: user.githubId || undefined,
			discordId: user.discordId || undefined,
			avatarPath: user.avatarPath || undefined,
			lastLoginAt: user.lastLoginAt?.toISOString(),
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		throw new Error(`Failed to retrieve user: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to create a new user with password hashing
 * @param data - User creation data including plain text password
 * @returns Promise<GetUser> - Created user object without password
 * @throws ValidationError - When input data is invalid
 * @throws BusinessLogicError - When email already exists
 */
const createUserService: CreateService<CreateUser, GetUser> = async (data) => {
	// Validate required fields
	if (!data.name || typeof data.name !== 'string') {
		throw new ValidationError('User name is required and must be a string')
	}

	const trimmedName = data.name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('User name cannot be empty')
	}

	// Validate name length and pattern according to schema constraints
	if (trimmedName.length < 2 || trimmedName.length > 50) {
		throw new ValidationError('User name must be between 2 and 50 characters')
	}

	// Validate name pattern (alphanumeric and spaces only)
	const namePattern = /^[a-zA-Z0-9\s]+$/
	if (!namePattern.test(trimmedName)) {
		throw new ValidationError('User name can only contain letters, numbers, and spaces')
	}

	// Validate email
	if (!data.email || typeof data.email !== 'string') {
		throw new ValidationError('User email is required and must be a string')
	}

	const trimmedEmail = data.email.trim().toLowerCase()
	if (trimmedEmail.length === 0) {
		throw new ValidationError('User email cannot be empty')
	}

	// Basic email format validation (more thorough validation should be done at schema level)
	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	if (!emailPattern.test(trimmedEmail)) {
		throw new ValidationError('User email must be a valid email address')
	}

	// Validate password
	if (!data.password || typeof data.password !== 'string') {
		throw new ValidationError('User password is required and must be a string')
	}

	if (data.password.length < 8) {
		throw new ValidationError('User password must be at least 8 characters long')
	}

	try {
		// Use transaction to ensure data consistency
		const user = await prisma.$transaction(async (tx) => {
			// Check if email already exists (case-insensitive)
			const existingUser = await tx.user.findFirst({
				where: { email: trimmedEmail },
				select: { id: true },
			})

			if (existingUser) {
				throw new BusinessLogicError(`User with email "${trimmedEmail}" already exists`)
			}

			// Hash the password before storing
			const saltRounds = 12 // Higher salt rounds for better security
			const hashedPassword = await bcrypt.hash(data.password, saltRounds)

			// Create the user
			const createdUser = await tx.user.create({
				data: {
					name: trimmedName,
					email: trimmedEmail,
					password: hashedPassword,
					isVerified: false, // Default to false, require email verification
					isActive: true, // Default to true, can be disabled by admin
				},
				select: {
					id: true,
					name: true,
					email: true,
					// Exclude password for security reasons
					password: false,
					googleId: true,
					githubId: true,
					discordId: true,
					avatarPath: true,
					isVerified: true,
					isActive: true,
					lastLoginAt: true,
					createdAt: true,
					updatedAt: true,
				},
			})

			return createdUser
		})

		// Transform and return the created user
		return {
			...user,
			googleId: user.googleId || undefined,
			githubId: user.githubId || undefined,
			discordId: user.discordId || undefined,
			avatarPath: user.avatarPath || undefined,
			lastLoginAt: user.lastLoginAt?.toISOString(),
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError || error instanceof BusinessLogicError) {
			throw error
		}
		// Handle Prisma unique constraint violation as backup
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			throw new BusinessLogicError(`User with email "${trimmedEmail}" already exists`)
		}
		throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to update an existing user
 * Handles password hashing if password is being updated
 * @param data - User update data with ID and optional fields
 * @returns Promise<GetUser | null> - Updated user object or null if not found
 * @throws ValidationError - When input data is invalid
 * @throws BusinessLogicError - When email already exists for different user
 */
const updateUserService: UpdateService<UpdateUser, GetUser> = async (data) => {
	const { id, name, email, password, isVerified, isActive, avatarPath } = data

	// Validate user ID
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('User ID must be a positive integer')
	}

	// Validate name if provided
	if (name !== undefined) {
		if (typeof name !== 'string') {
			throw new ValidationError('User name must be a string')
		}

		const trimmedName = name.trim()
		if (trimmedName.length === 0) {
			throw new ValidationError('User name cannot be empty')
		}

		if (trimmedName.length < 2 || trimmedName.length > 50) {
			throw new ValidationError('User name must be between 2 and 50 characters')
		}

		// Validate name pattern (alphanumeric and spaces only)
		const namePattern = /^[a-zA-Z0-9\s]+$/
		if (!namePattern.test(trimmedName)) {
			throw new ValidationError('User name can only contain letters, numbers, and spaces')
		}
	}

	// Validate email if provided
	if (email !== undefined) {
		if (typeof email !== 'string') {
			throw new ValidationError('User email must be a string')
		}

		const trimmedEmail = email.trim().toLowerCase()
		if (trimmedEmail.length === 0) {
			throw new ValidationError('User email cannot be empty')
		}

		// Basic email format validation
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailPattern.test(trimmedEmail)) {
			throw new ValidationError('User email must be a valid email address')
		}

		// Check if email already exists for a different user
		const existingUser = await prisma.user.findFirst({
			where: {
				email: trimmedEmail,
				id: { not: id },
			},
			select: { id: true },
		})

		if (existingUser) {
			throw new BusinessLogicError(`User with email "${trimmedEmail}" already exists`)
		}
	}

	// Validate password if provided
	if (password !== undefined) {
		if (typeof password !== 'string') {
			throw new ValidationError('User password must be a string')
		}

		if (password.length < 8) {
			throw new ValidationError('User password must be at least 8 characters long')
		}
	}

	// Validate boolean fields if provided
	if (isVerified !== undefined && typeof isVerified !== 'boolean') {
		throw new ValidationError('isVerified must be a boolean')
	}

	if (isActive !== undefined && typeof isActive !== 'boolean') {
		throw new ValidationError('isActive must be a boolean')
	}

	// Validate avatarPath if provided
	if (avatarPath !== undefined && typeof avatarPath !== 'string') {
		throw new ValidationError('avatarPath must be a string')
	}

	try {
		// Build update data object only with provided fields
		const updateData: Record<string, any> = {}

		if (name !== undefined) {
			updateData.name = name.trim()
		}
		if (email !== undefined) {
			updateData.email = email.trim().toLowerCase()
		}
		if (password !== undefined) {
			// Hash the new password
			const saltRounds = 12
			updateData.password = await bcrypt.hash(password, saltRounds)
		}
		if (isVerified !== undefined) {
			updateData.isVerified = isVerified
		}
		if (isActive !== undefined) {
			updateData.isActive = isActive
		}
		if (avatarPath !== undefined) {
			updateData.avatarPath = avatarPath
		}

		// Update the user with proper error handling
		const user = await prisma.user.update({
			where: { id },
			data: updateData,
			select: {
				id: true,
				name: true,
				email: true,
				// Exclude password for security reasons
				password: false,
				googleId: true,
				githubId: true,
				discordId: true,
				avatarPath: true,
				isVerified: true,
				isActive: true,
				lastLoginAt: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		// Transform and return updated user
		return {
			...user,
			googleId: user.googleId || undefined,
			githubId: user.githubId || undefined,
			discordId: user.discordId || undefined,
			avatarPath: user.avatarPath || undefined,
			lastLoginAt: user.lastLoginAt?.toISOString(),
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
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
			throw new BusinessLogicError(`User with email "${email?.trim().toLowerCase()}" already exists`)
		}
		throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to delete a user by ID
 * Checks for references in other entities before deletion to maintain data integrity
 * @param id - User ID to delete
 * @returns Promise<void>
 * @throws ValidationError - When ID parameter is invalid
 * @throws EntityNotFoundError - When user is not found
 * @throws BusinessLogicError - When user cannot be deleted due to references
 */
const deleteUserService: DeleteService = async (id: number) => {
	// Validate input
	if (!Number.isInteger(id) || id <= 0) {
		throw new ValidationError('User ID must be a positive integer')
	}

	try {
		await prisma.$transaction(async (tx) => {
			// Check if user exists
			const existingUser = await tx.user.findUnique({
				where: { id },
				select: { id: true, name: true, email: true },
			})

			if (!existingUser) {
				throw new EntityNotFoundError('User', id)
			}

			// Check if user has associated data (referential integrity)
			const [charactersCount, imagesCount] = await Promise.all([
				tx.character.count({ where: { userId: id } }),
				tx.image.count({ where: { userId: id } }),
			])

			const totalReferences = charactersCount + imagesCount

			if (totalReferences > 0) {
				throw new BusinessLogicError(
					`Cannot delete user "${existingUser.name}" (${existingUser.email}) as they have associated data (characters: ${charactersCount}, images: ${imagesCount})`,
				)
			}

			// Safe to delete - remove user
			await tx.user.delete({
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
		throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to check if an email already exists
 * Useful for validation before creating or updating users
 * @param email - Email to check
 * @param excludeId - Optional ID to exclude from check (useful for updates)
 * @returns Promise<boolean> - True if email exists, false otherwise
 * @throws ValidationError - When email parameter is invalid
 */
const checkUserEmailExistsService = async (email: string, excludeId?: number): Promise<boolean> => {
	// Validate input
	if (!email || typeof email !== 'string') {
		throw new ValidationError('User email is required and must be a string')
	}

	const trimmedEmail = email.trim().toLowerCase()
	if (trimmedEmail.length === 0) {
		throw new ValidationError('User email cannot be empty')
	}

	if (excludeId !== undefined && (!Number.isInteger(excludeId) || excludeId <= 0)) {
		throw new ValidationError('Exclude ID must be a positive integer')
	}

	try {
		const existingUser = await prisma.user.findFirst({
			where: {
				email: trimmedEmail,
				...(excludeId && { id: { not: excludeId } }),
			},
			select: { id: true },
		})

		return !!existingUser
	} catch (error) {
		throw new Error(
			`Failed to check user email existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

/**
 * Service function to verify user password
 * Used for authentication purposes
 * @param email - User email
 * @param password - Plain text password to verify
 * @returns Promise<GetUser | null> - User object if password matches, null otherwise
 * @throws ValidationError - When input parameters are invalid
 */
const verifyUserPasswordService = async (email: string, password: string): Promise<GetUser | null> => {
	// Validate input
	if (!email || typeof email !== 'string') {
		throw new ValidationError('Email is required and must be a string')
	}

	if (!password || typeof password !== 'string') {
		throw new ValidationError('Password is required and must be a string')
	}

	const trimmedEmail = email.trim().toLowerCase()

	try {
		// Find user by email including password for verification
		const user = await prisma.user.findFirst({
			where: {
				email: trimmedEmail,
				isActive: true, // Only allow login for active users
			},
			select: {
				id: true,
				name: true,
				email: true,
				password: true, // Include password for verification
				googleId: true,
				githubId: true,
				discordId: true,
				avatarPath: true,
				isVerified: true,
				isActive: true,
				lastLoginAt: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		if (!user || !user.password) {
			return null // User not found or has no password (OAuth user)
		}

		// Verify password using bcrypt
		const isPasswordValid = await bcrypt.compare(password, user.password)
		if (!isPasswordValid) {
			return null // Invalid password
		}

		// Update last login timestamp
		await prisma.user.update({
			where: { id: user.id },
			data: { lastLoginAt: new Date() },
		})

		// Return user without password
		return {
			id: user.id,
			name: user.name,
			email: user.email,
			googleId: user.googleId || undefined,
			githubId: user.githubId || undefined,
			discordId: user.discordId || undefined,
			avatarPath: user.avatarPath || undefined,
			isVerified: user.isVerified,
			isActive: user.isActive,
			lastLoginAt: new Date().toISOString(), // Use current time since we just updated it
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		throw new Error(`Failed to verify user password: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Service function to update user's last login timestamp
 * Called during successful authentication
 * @param userId - User ID
 * @returns Promise<void>
 * @throws ValidationError - When user ID is invalid
 * @throws EntityNotFoundError - When user is not found
 */
const updateUserLastLoginService = async (userId: number): Promise<void> => {
	// Validate input
	if (!Number.isInteger(userId) || userId <= 0) {
		throw new ValidationError('User ID must be a positive integer')
	}

	try {
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { lastLoginAt: new Date() },
			select: { id: true },
		})

		if (!updatedUser) {
			throw new EntityNotFoundError('User', userId)
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			throw error
		}
		// Handle Prisma record not found error
		if (error instanceof Error && 'code' in error && error.code === 'P2025') {
			throw new EntityNotFoundError('User', userId)
		}
		throw new Error(`Failed to update user last login: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

export {
	checkUserEmailExistsService,
	createUserService,
	deleteUserService,
	getUserService,
	getUsersService,
	updateUserLastLoginService,
	updateUserService,
	verifyUserPasswordService,
}
