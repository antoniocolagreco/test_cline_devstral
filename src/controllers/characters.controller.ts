import { FastifyReply, FastifyRequest } from 'fastify'

import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { GetCharacter } from '@schemas/character.schema.js'
import {
	createCharacterService,
	deleteCharacterService,
	getCharacterService,
	getCharactersService,
	updateCharacterService,
} from '@services/characters.service.js'
import { GetManyQueryParams } from '@shared-types/services.type.js'

interface GetCharactersQuerystring extends GetManyQueryParams<GetCharacter> {}

interface CreateCharacterBody {
	name: string
	surname?: string
	nickname?: string
	description?: string
	avatarPath?: string
	health: number
	stamina: number
	mana: number
	strength: number
	dexterity: number
	constitution: number
	intelligence: number
	wisdom: number
	charisma: number
	raceId: number
	archetypeId: number
	userId: number
	isPublic: boolean
}

interface UpdateCharacterBody {
	name?: string
	surname?: string
	nickname?: string
	description?: string
	avatarPath?: string
	health?: number
	stamina?: number
	mana?: number
	strength?: number
	dexterity?: number
	constitution?: number
	intelligence?: number
	wisdom?: number
	charisma?: number
	raceId?: number
	archetypeId?: number
	primaryWeaponId?: number
	secondaryWeaponId?: number
	shieldId?: number
	armorId?: number
	firstRingId?: number
	secondRingId?: number
	amuletId?: number
	isPublic?: boolean
}

interface CharacterParams {
	id: string
}

/**
 * Controller for getting multiple characters with pagination, filtering, and search
 */
const getCharactersController = async (
	request: FastifyRequest<{ Querystring: GetCharactersQuerystring }>,
	reply: FastifyReply,
) => {
	try {
		const result = await getCharactersService(request.query)

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
 * Controller for getting a single character by ID
 */
const getCharacterController = async (request: FastifyRequest<{ Params: CharacterParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Character ID must be a positive integer',
			})
		}

		const character = await getCharacterService(id)

		if (!character) {
			return reply.status(404).send({
				error: 'Character not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: character,
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
 * Controller for creating a new character
 */
const createCharacterController = async (
	request: FastifyRequest<{ Body: CreateCharacterBody }>,
	reply: FastifyReply,
) => {
	try {
		const character = await createCharacterService(request.body)

		return reply.status(201).send({
			success: true,
			data: character,
			message: 'Character created successfully',
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
 * Controller for updating an existing character
 */
const updateCharacterController = async (
	request: FastifyRequest<{ Params: CharacterParams; Body: UpdateCharacterBody }>,
	reply: FastifyReply,
) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Character ID must be a positive integer',
			})
		}

		const updateData = { id, ...request.body }
		const character = await updateCharacterService(updateData)

		if (!character) {
			return reply.status(404).send({
				error: 'Character not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: character,
			message: 'Character updated successfully',
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
 * Controller for deleting a character by ID
 */
const deleteCharacterController = async (request: FastifyRequest<{ Params: CharacterParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Character ID must be a positive integer',
			})
		}

		await deleteCharacterService(id)

		return reply.status(200).send({
			success: true,
			message: 'Character deleted successfully',
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
	getCharactersController,
	getCharacterController,
	createCharacterController,
	updateCharacterController,
	deleteCharacterController,
}
