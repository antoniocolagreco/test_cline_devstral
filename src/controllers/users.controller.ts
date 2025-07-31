import { FastifyReply, FastifyRequest } from 'fastify'

import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { GetUser } from '@schemas/user.schema.js'
import {
	createUserService,
	deleteUserService,
	getUserService,
	getUsersService,
	updateUserService,
} from '@services/users.service.js'
import { GetManyQueryParams } from '@shared-types/services.type.js'

interface GetUsersQuerystring extends GetManyQueryParams<GetUser> {}

interface CreateUserBody {
	name: string
	email: string
	password: string
}

interface UpdateUserBody {
	name?: string
	email?: string
	password?: string
	isVerified?: boolean
	isActive?: boolean
	avatarPath?: string
}

interface UserParams {
	id: string
}

/**
 * Controller for getting multiple users with pagination, filtering, and search
 */
const getUsersController = async (
	request: FastifyRequest<{ Querystring: GetUsersQuerystring }>,
	reply: FastifyReply,
) => {
	try {
		const result = await getUsersService(request.query)

		return reply.status(200).send({
			success: true,
			data: result.data,
			pagination: result.pagination,
		})
	} catch (error) {
		if (error instanceof ValidationError) {
			return reply.status(400).send({
				error: error.message,
			})
		}

		request.log.error(error)
		return reply.status(500).send({
			error: 'Internal server error',
		})
	}
}

/**
 * Controller for getting a single user by ID
 */
const getUserController = async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'User ID must be a positive integer',
			})
		}

		const user = await getUserService(id)

		if (!user) {
			return reply.status(404).send({
				error: 'User not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: user,
		})
	} catch (error) {
		if (error instanceof ValidationError) {
			return reply.status(400).send({
				error: error.message,
			})
		}

		request.log.error(error)
		return reply.status(500).send({
			error: 'Internal server error',
		})
	}
}

/**
 * Controller for creating a new user
 */
const createUserController = async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
	try {
		const user = await createUserService(request.body)

		return reply.status(201).send({
			success: true,
			data: user,
			message: 'User created successfully',
		})
	} catch (error) {
		if (error instanceof ValidationError) {
			return reply.status(400).send({
				error: error.message,
			})
		}

		if (error instanceof BusinessLogicError) {
			return reply.status(409).send({
				error: error.message,
			})
		}

		request.log.error(error)
		return reply.status(500).send({
			error: 'Internal server error',
		})
	}
}

/**
 * Controller for updating an existing user
 */
const updateUserController = async (
	request: FastifyRequest<{ Params: UserParams; Body: UpdateUserBody }>,
	reply: FastifyReply,
) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'User ID must be a positive integer',
			})
		}

		const updateData = { id, ...request.body }
		const user = await updateUserService(updateData)

		if (!user) {
			return reply.status(404).send({
				error: 'User not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: user,
			message: 'User updated successfully',
		})
	} catch (error) {
		if (error instanceof ValidationError) {
			return reply.status(400).send({
				error: error.message,
			})
		}

		if (error instanceof BusinessLogicError) {
			return reply.status(409).send({
				error: error.message,
			})
		}

		request.log.error(error)
		return reply.status(500).send({
			error: 'Internal server error',
		})
	}
}

/**
 * Controller for deleting a user by ID
 */
const deleteUserController = async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'User ID must be a positive integer',
			})
		}

		await deleteUserService(id)

		return reply.status(200).send({
			success: true,
			message: 'User deleted successfully',
		})
	} catch (error) {
		if (error instanceof ValidationError) {
			return reply.status(400).send({
				error: error.message,
			})
		}

		if (error instanceof EntityNotFoundError) {
			return reply.status(404).send({
				error: error.message,
			})
		}

		if (error instanceof BusinessLogicError) {
			return reply.status(409).send({
				error: error.message,
			})
		}

		request.log.error(error)
		return reply.status(500).send({
			error: 'Internal server error',
		})
	}
}

export { getUsersController, getUserController, createUserController, updateUserController, deleteUserController }
