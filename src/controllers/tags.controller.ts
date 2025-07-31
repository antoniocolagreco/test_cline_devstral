import { FastifyReply, FastifyRequest } from 'fastify'

import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { GetTag } from '@schemas/tag.schema.js'
import {
	createTagService,
	deleteTagService,
	getTagService,
	getTagsService,
	updateTagService,
} from '@services/tags.service.js'
import { GetManyQueryParams } from '@shared-types/services.type.js'

interface GetTagsQuerystring extends GetManyQueryParams<GetTag> {}

interface CreateTagBody {
	name: string
}

interface UpdateTagBody {
	name?: string
}

interface TagParams {
	id: string
}

/**
 * Controller for getting multiple tags with pagination, filtering, and search
 */
const getTagsController = async (request: FastifyRequest<{ Querystring: GetTagsQuerystring }>, reply: FastifyReply) => {
	try {
		const result = await getTagsService(request.query)

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
 * Controller for getting a single tag by ID
 */
const getTagController = async (request: FastifyRequest<{ Params: TagParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Tag ID must be a positive integer',
			})
		}

		const tag = await getTagService(id)

		if (!tag) {
			return reply.status(404).send({
				error: 'Tag not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: tag,
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
 * Controller for creating a new tag
 */
const createTagController = async (request: FastifyRequest<{ Body: CreateTagBody }>, reply: FastifyReply) => {
	try {
		const tag = await createTagService(request.body)

		return reply.status(201).send({
			success: true,
			data: tag,
			message: 'Tag created successfully',
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
 * Controller for updating an existing tag
 */
const updateTagController = async (
	request: FastifyRequest<{ Params: TagParams; Body: UpdateTagBody }>,
	reply: FastifyReply,
) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Tag ID must be a positive integer',
			})
		}

		const updateData = { id, ...request.body }
		const tag = await updateTagService(updateData)

		if (!tag) {
			return reply.status(404).send({
				error: 'Tag not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: tag,
			message: 'Tag updated successfully',
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
 * Controller for deleting a tag by ID
 */
const deleteTagController = async (request: FastifyRequest<{ Params: TagParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Tag ID must be a positive integer',
			})
		}

		await deleteTagService(id)

		return reply.status(200).send({
			success: true,
			message: 'Tag deleted successfully',
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

export { getTagsController, getTagController, createTagController, updateTagController, deleteTagController }
