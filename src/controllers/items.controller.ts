import { FastifyReply, FastifyRequest } from 'fastify'

import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { GetItem } from '@schemas/item.schema.js'
import {
	createItemService,
	deleteItemService,
	getItemService,
	getItemsService,
	updateItemService,
} from '@services/items.service.js'
import { GetManyQueryParams } from '@shared-types/services.type.js'

interface GetItemsQuerystring extends GetManyQueryParams<GetItem> {}

interface CreateItemBody {
	name: string
	description?: string
	rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'
	isWeapon: boolean
	isShield: boolean
	isArmor: boolean
	isAccessory: boolean
	isConsumable: boolean
	isQuestItem: boolean
	isCraftingMaterial: boolean
	isMiscellaneous: boolean
	attack: number
	defense: number
	requiredStrength: number
	requiredDexterity: number
	requiredConstitution: number
	requiredIntelligence: number
	requiredWisdom: number
	requiredCharisma: number
	bonusStrength: number
	bonusDexterity: number
	bonusConstitution: number
	bonusIntelligence: number
	bonusWisdom: number
	bonusCharisma: number
	bonusHealth: number
	durability: number
	weight: number
}

interface UpdateItemBody {
	name?: string
	description?: string
	rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'
	isWeapon?: boolean
	isShield?: boolean
	isArmor?: boolean
	isAccessory?: boolean
	isConsumable?: boolean
	isQuestItem?: boolean
	isCraftingMaterial?: boolean
	isMiscellaneous?: boolean
	attack?: number
	defense?: number
	requiredStrength?: number
	requiredDexterity?: number
	requiredConstitution?: number
	requiredIntelligence?: number
	requiredWisdom?: number
	requiredCharisma?: number
	bonusStrength?: number
	bonusDexterity?: number
	bonusConstitution?: number
	bonusIntelligence?: number
	bonusWisdom?: number
	bonusCharisma?: number
	bonusHealth?: number
	durability?: number
	weight?: number
}

interface ItemParams {
	id: string
}

/**
 * Controller for getting multiple items with pagination, filtering, and search
 */
const getItemsController = async (
	request: FastifyRequest<{ Querystring: GetItemsQuerystring }>,
	reply: FastifyReply,
) => {
	try {
		const result = await getItemsService(request.query)

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
 * Controller for getting a single item by ID
 */
const getItemController = async (request: FastifyRequest<{ Params: ItemParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Item ID must be a positive integer',
			})
		}

		const item = await getItemService(id)

		if (!item) {
			return reply.status(404).send({
				error: 'Item not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: item,
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
 * Controller for creating a new item
 */
const createItemController = async (request: FastifyRequest<{ Body: CreateItemBody }>, reply: FastifyReply) => {
	try {
		const item = await createItemService(request.body)

		return reply.status(201).send({
			success: true,
			data: item,
			message: 'Item created successfully',
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
 * Controller for updating an existing item
 */
const updateItemController = async (
	request: FastifyRequest<{ Params: ItemParams; Body: UpdateItemBody }>,
	reply: FastifyReply,
) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Item ID must be a positive integer',
			})
		}

		const updateData = { id, ...request.body }
		const item = await updateItemService(updateData)

		if (!item) {
			return reply.status(404).send({
				error: 'Item not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: item,
			message: 'Item updated successfully',
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
 * Controller for deleting an item by ID
 */
const deleteItemController = async (request: FastifyRequest<{ Params: ItemParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Item ID must be a positive integer',
			})
		}

		await deleteItemService(id)

		return reply.status(200).send({
			success: true,
			message: 'Item deleted successfully',
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

export { getItemsController, getItemController, createItemController, updateItemController, deleteItemController }
