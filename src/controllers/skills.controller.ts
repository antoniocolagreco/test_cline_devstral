import { FastifyReply, FastifyRequest } from 'fastify'

import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { GetSkill } from '@schemas/skill.schema.js'
import {
	createSkillService,
	deleteSkillService,
	getSkillService,
	getSkillsService,
	updateSkillService,
} from '@services/skills.service.js'
import { GetManyQueryParams } from '@shared-types/services.type.js'

interface GetSkillsQuerystring extends GetManyQueryParams<GetSkill> {}

interface CreateSkillBody {
	name: string
	description?: string
}

interface UpdateSkillBody {
	name?: string
	description?: string
}

interface SkillParams {
	id: string
}

/**
 * Controller for getting multiple skills with pagination, filtering, and search
 */
const getSkillsController = async (
	request: FastifyRequest<{ Querystring: GetSkillsQuerystring }>,
	reply: FastifyReply,
) => {
	try {
		const result = await getSkillsService(request.query)

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
 * Controller for getting a single skill by ID
 */
const getSkillController = async (request: FastifyRequest<{ Params: SkillParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Skill ID must be a positive integer',
			})
		}

		const skill = await getSkillService(id)

		if (!skill) {
			return reply.status(404).send({
				error: 'Skill not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: skill,
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
 * Controller for creating a new skill
 */
const createSkillController = async (request: FastifyRequest<{ Body: CreateSkillBody }>, reply: FastifyReply) => {
	try {
		const skill = await createSkillService(request.body)

		return reply.status(201).send({
			success: true,
			data: skill,
			message: 'Skill created successfully',
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
 * Controller for updating an existing skill
 */
const updateSkillController = async (
	request: FastifyRequest<{ Params: SkillParams; Body: UpdateSkillBody }>,
	reply: FastifyReply,
) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Skill ID must be a positive integer',
			})
		}

		const updateData = { id, ...request.body }
		const skill = await updateSkillService(updateData)

		if (!skill) {
			return reply.status(404).send({
				error: 'Skill not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: skill,
			message: 'Skill updated successfully',
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
 * Controller for deleting a skill by ID
 */
const deleteSkillController = async (request: FastifyRequest<{ Params: SkillParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Skill ID must be a positive integer',
			})
		}

		await deleteSkillService(id)

		return reply.status(200).send({
			success: true,
			message: 'Skill deleted successfully',
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

export { getSkillsController, getSkillController, createSkillController, updateSkillController, deleteSkillController }
