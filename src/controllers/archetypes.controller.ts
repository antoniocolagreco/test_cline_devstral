import { FastifyReply, FastifyRequest } from 'fastify'

import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { GetArchetype } from '@schemas/archetype.schema.js'
import {
	createArchetypeService,
	deleteArchetypeService,
	getArchetypeService,
	getArchetypesService,
	updateArchetypeService,
} from '@services/archetypes.service.js'
import { GetManyQueryParams } from '@shared-types/services.type.js'

interface GetArchetypesQuerystring extends GetManyQueryParams<GetArchetype> {}

interface CreateArchetypeBody {
	name: string
	description?: string
}

interface UpdateArchetypeBody {
	name?: string
	description?: string
}

interface ArchetypeParams {
	id: string
}

/**
 * Controller for getting multiple archetypes with pagination, filtering, and search
 */
const getArchetypesController = async (
	request: FastifyRequest<{ Querystring: GetArchetypesQuerystring }>,
	reply: FastifyReply,
) => {
	try {
		const result = await getArchetypesService(request.query)

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
 * Controller for getting a single archetype by ID
 */
const getArchetypeController = async (request: FastifyRequest<{ Params: ArchetypeParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Archetype ID must be a positive integer',
			})
		}

		const archetype = await getArchetypeService(id)

		if (!archetype) {
			return reply.status(404).send({
				error: 'Archetype not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: archetype,
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
 * Controller for creating a new archetype
 */
const createArchetypeController = async (
	request: FastifyRequest<{ Body: CreateArchetypeBody }>,
	reply: FastifyReply,
) => {
	try {
		const archetype = await createArchetypeService(request.body)

		return reply.status(201).send({
			success: true,
			data: archetype,
			message: 'Archetype created successfully',
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
 * Controller for updating an existing archetype
 */
const updateArchetypeController = async (
	request: FastifyRequest<{ Params: ArchetypeParams; Body: UpdateArchetypeBody }>,
	reply: FastifyReply,
) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Archetype ID must be a positive integer',
			})
		}

		const updateData = { id, ...request.body }
		const archetype = await updateArchetypeService(updateData)

		if (!archetype) {
			return reply.status(404).send({
				error: 'Archetype not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: archetype,
			message: 'Archetype updated successfully',
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
 * Controller for deleting an archetype by ID
 */
const deleteArchetypeController = async (request: FastifyRequest<{ Params: ArchetypeParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Archetype ID must be a positive integer',
			})
		}

		await deleteArchetypeService(id)

		return reply.status(200).send({
			success: true,
			message: 'Archetype deleted successfully',
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

export {
	getArchetypesController,
	getArchetypeController,
	createArchetypeController,
	updateArchetypeController,
	deleteArchetypeController,
}
