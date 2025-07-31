import { FastifyInstance } from 'fastify'

import {
	createTagController,
	deleteTagController,
	getTagController,
	getTagsController,
	updateTagController,
} from '@controllers/tags.controller.js'
import { CreateTagSchema, GetTagParamsSchema } from '@schemas/tag.schema.js'
import { ErrorResponseSchema } from '@schemas/response.schema.js'

async function tagsRoutes(fastify: FastifyInstance) {
	// GET /api/v1/tags - Get all tags with pagination, filtering, and search
	fastify.get(
		'/tags',
		{
			schema: {
				description: 'Get all tags with optional pagination, filtering, and search',
				tags: ['Tags'],
				querystring: {
					type: 'object',
					properties: {
						page: {
							type: 'integer',
							minimum: 1,
							default: 1,
							description: 'Page number for pagination',
						},
						pageSize: {
							type: 'integer',
							minimum: 1,
							maximum: 100,
							default: 10,
							description: 'Number of items per page',
						},
						search: {
							type: 'object',
							properties: {
								name: {
									type: 'string',
									description: 'Search by tag name',
								},
							},
							description: 'Search criteria',
						},
						orderBy: {
							type: 'object',
							properties: {
								field: {
									type: 'string',
									enum: ['id', 'name', 'createdAt', 'updatedAt'],
									description: 'Field to order by',
								},
								direction: {
									type: 'string',
									enum: ['asc', 'desc'],
									description: 'Order direction',
								},
							},
							required: ['field', 'direction'],
							description: 'Ordering criteria',
						},
					},
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean', example: true },
							data: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										id: { type: 'integer' },
										name: { type: 'string' },
										createdAt: { type: 'string', format: 'date-time' },
										updatedAt: { type: 'string', format: 'date-time' },
									},
								},
							},
							pagination: {
								type: 'object',
								properties: {
									page: { type: 'integer' },
									pageSize: { type: 'integer' },
									total: { type: 'integer' },
									totalPages: { type: 'integer' },
								},
							},
						},
					},
					400: ErrorResponseSchema,
					500: ErrorResponseSchema,
				},
			},
		},
		getTagsController,
	)

	// GET /api/v1/tags/:id - Get a specific tag by ID
	fastify.get(
		'/tags/:id',
		{
			schema: {
				description: 'Get a specific tag by its ID',
				tags: ['Tags'],
				params: GetTagParamsSchema,
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean', example: true },
							data: {
								type: 'object',
								properties: {
									id: { type: 'integer' },
									name: { type: 'string' },
									createdAt: { type: 'string', format: 'date-time' },
									updatedAt: { type: 'string', format: 'date-time' },
								},
							},
						},
					},
					400: ErrorResponseSchema,
					404: ErrorResponseSchema,
					500: ErrorResponseSchema,
				},
			},
		},
		getTagController,
	)

	// POST /api/v1/tags - Create a new tag
	fastify.post(
		'/tags',
		{
			schema: {
				description: 'Create a new tag',
				tags: ['Tags'],
				body: CreateTagSchema,
				response: {
					201: {
						type: 'object',
						properties: {
							success: { type: 'boolean', example: true },
							data: {
								type: 'object',
								properties: {
									id: { type: 'integer' },
									name: { type: 'string' },
									createdAt: { type: 'string', format: 'date-time' },
									updatedAt: { type: 'string', format: 'date-time' },
								},
							},
							message: { type: 'string', example: 'Tag created successfully' },
						},
					},
					400: ErrorResponseSchema,
					409: ErrorResponseSchema,
					500: ErrorResponseSchema,
				},
			},
		},
		createTagController,
	)

	// PUT /api/v1/tags/:id - Update an existing tag
	fastify.put(
		'/tags/:id',
		{
			schema: {
				description: 'Update an existing tag',
				tags: ['Tags'],
				params: GetTagParamsSchema,
				body: {
					type: 'object',
					properties: {
						name: {
							type: 'string',
							minLength: 1,
							maxLength: 50,
							pattern: '^[a-zA-Z0-9\\s\\-_]+$',
							description: 'Tag name (optional for update)',
						},
					},
					additionalProperties: false,
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean', example: true },
							data: {
								type: 'object',
								properties: {
									id: { type: 'integer' },
									name: { type: 'string' },
									createdAt: { type: 'string', format: 'date-time' },
									updatedAt: { type: 'string', format: 'date-time' },
								},
							},
							message: { type: 'string', example: 'Tag updated successfully' },
						},
					},
					400: ErrorResponseSchema,
					404: ErrorResponseSchema,
					409: ErrorResponseSchema,
					500: ErrorResponseSchema,
				},
			},
		},
		updateTagController,
	)

	// DELETE /api/v1/tags/:id - Delete a tag by ID
	fastify.delete(
		'/tags/:id',
		{
			schema: {
				description: 'Delete a tag by its ID',
				tags: ['Tags'],
				params: GetTagParamsSchema,
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean', example: true },
							message: { type: 'string', example: 'Tag deleted successfully' },
						},
					},
					400: ErrorResponseSchema,
					404: ErrorResponseSchema,
					409: ErrorResponseSchema,
					500: ErrorResponseSchema,
				},
			},
		},
		deleteTagController,
	)
}

export default tagsRoutes
