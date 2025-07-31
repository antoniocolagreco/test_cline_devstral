import { FastifyReply, FastifyRequest } from 'fastify'

import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { GetRace } from '@schemas/race.schema.js'
import {
	createRaceService,
	deleteRaceService,
	getRaceService,
	getRacesService,
	updateRaceService,
} from '@services/races.service.js'
import { GetManyQueryParams } from '@shared-types/services.type.js'

interface GetRacesQuerystring extends GetManyQueryParams<GetRace> {}

interface CreateRaceBody {
	name: string
	description?: string
	healthModifier: number
	staminaModifier: number
	manaModifier: number
	strengthModifier: number
	dexterityModifier: number
	constitutionModifier: number
	intelligenceModifier: number
	wisdomModifier: number
	charismaModifier: number
}

interface UpdateRaceBody {
	name?: string
	description?: string
	healthModifier?: number
	staminaModifier?: number
	manaModifier?: number
	strengthModifier?: number
	dexterityModifier?: number
	constitutionModifier?: number
	intelligenceModifier?: number
	wisdomModifier?: number
	charismaModifier?: number
}

interface RaceParams {
	id: string
}

/**
 * Controller for getting multiple races with pagination, filtering, and search
 */
const getRacesController = async (
	request: FastifyRequest<{ Querystring: GetRacesQuerystring }>,
	reply: FastifyReply,
) => {
	try {
		const result = await getRacesService(request.query)

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
 * Controller for getting a single race by ID
 */
const getRaceController = async (request: FastifyRequest<{ Params: RaceParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Race ID must be a positive integer',
			})
		}

		const race = await getRaceService(id)

		if (!race) {
			return reply.status(404).send({
				error: 'Race not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: race,
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
 * Controller for creating a new race
 */
const createRaceController = async (request: FastifyRequest<{ Body: CreateRaceBody }>, reply: FastifyReply) => {
	try {
		const race = await createRaceService(request.body)

		return reply.status(201).send({
			success: true,
			data: race,
			message: 'Race created successfully',
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
 * Controller for updating an existing race
 */
const updateRaceController = async (
	request: FastifyRequest<{ Params: RaceParams; Body: UpdateRaceBody }>,
	reply: FastifyReply,
) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Race ID must be a positive integer',
			})
		}

		const updateData = { id, ...request.body }
		const race = await updateRaceService(updateData)

		if (!race) {
			return reply.status(404).send({
				error: 'Race not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: race,
			message: 'Race updated successfully',
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
 * Controller for deleting a race by ID
 */
const deleteRaceController = async (request: FastifyRequest<{ Params: RaceParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Race ID must be a positive integer',
			})
		}

		await deleteRaceService(id)

		return reply.status(200).send({
			success: true,
			message: 'Race deleted successfully',
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

export { getRacesController, getRaceController, createRaceController, updateRaceController, deleteRaceController }
