import { FastifyReply, FastifyRequest } from 'fastify'
import { Buffer } from 'node:buffer'

import BusinessLogicError from '@errors/business-logic.error.js'
import EntityNotFoundError from '@errors/entity-not-found.error.js'
import ValidationError from '@errors/validation.error.js'
import { GetImage } from '@schemas/image.schema.js'
import {
	createImageService,
	deleteImageService,
	getImageService,
	getImagesService,
	updateImageService,
} from '@services/images.service.js'
import { GetManyQueryParams } from '@shared-types/services.type.js'

interface GetImagesQuerystring extends GetManyQueryParams<GetImage> {}

interface CreateImageBody {
	filename: string
	size: number
	width: number
	height: number
	mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
	userId: number
	isPublic?: boolean
	buffer: Buffer
}

interface UpdateImageBody {
	filename?: string
	size?: number
	width?: number
	height?: number
	mimeType?: 'image/jpeg' | 'image/png' | 'image/webp'
	userId?: number
	isPublic?: boolean
	buffer?: Buffer
}

interface ImageParams {
	id: string
}

/**
 * Controller for getting multiple images with pagination, filtering, and search
 */
const getImagesController = async (
	request: FastifyRequest<{ Querystring: GetImagesQuerystring }>,
	reply: FastifyReply,
) => {
	try {
		const result = await getImagesService(request.query)

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
 * Controller for getting a single image by ID
 * Returns image metadata only, not the binary data
 */
const getImageController = async (request: FastifyRequest<{ Params: ImageParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Image ID must be a positive integer',
			})
		}

		const image = await getImageService(id)

		if (!image) {
			return reply.status(404).send({
				error: 'Image not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: image,
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
 * Controller for creating a new image
 */
const createImageController = async (request: FastifyRequest<{ Body: CreateImageBody }>, reply: FastifyReply) => {
	try {
		const image = await createImageService(request.body)

		return reply.status(201).send({
			success: true,
			data: image,
			message: 'Image created successfully',
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
 * Controller for updating an existing image
 */
const updateImageController = async (
	request: FastifyRequest<{ Params: ImageParams; Body: UpdateImageBody }>,
	reply: FastifyReply,
) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Image ID must be a positive integer',
			})
		}

		const updateData = { id, ...request.body }
		const image = await updateImageService(updateData)

		if (!image) {
			return reply.status(404).send({
				error: 'Image not found',
			})
		}

		return reply.status(200).send({
			success: true,
			data: image,
			message: 'Image updated successfully',
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
 * Controller for deleting an image by ID
 */
const deleteImageController = async (request: FastifyRequest<{ Params: ImageParams }>, reply: FastifyReply) => {
	try {
		const id = parseInt(request.params.id, 10)

		if (isNaN(id) || id <= 0) {
			return reply.status(400).send({
				error: 'Image ID must be a positive integer',
			})
		}

		await deleteImageService(id)

		return reply.status(200).send({
			success: true,
			message: 'Image deleted successfully',
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

export { getImagesController, getImageController, createImageController, updateImageController, deleteImageController }
