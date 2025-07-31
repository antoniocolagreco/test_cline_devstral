import fastify, { FastifyInstance } from 'fastify'

// Mock modules first
const mockPrismaFunctions = {
	tag: {
		findMany: jest.fn(),
		count: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	item: {
		count: jest.fn(),
	},
	character: {
		count: jest.fn(),
	},
	skill: {
		count: jest.fn(),
	},
	archetype: {
		count: jest.fn(),
	},
	race: {
		count: jest.fn(),
	},
	$transaction: jest.fn(),
}

jest.mock('../src/index.js', () => ({
	prisma: mockPrismaFunctions,
}))

jest.mock('../src/helpers/services.helper.js', () => ({
	transformSearchToQuery: jest.fn((search) => search || {}),
}))

import tagsRoutes from '../src/routes/tags.routes.js'

// Get mocked prisma functions
const mockPrisma = mockPrismaFunctions

describe('Tags Routes Integration', () => {
	let app: FastifyInstance

	beforeEach(async () => {
		app = fastify()
		await app.register(tagsRoutes, { prefix: '/api/v1' })
		jest.clearAllMocks()
	})

	afterEach(async () => {
		await app.close()
	})

	describe('GET /api/v1/tags', () => {
		const mockTags = [
			{
				id: 1,
				name: 'Adventure',
				createdAt: new Date('2024-01-01T00:00:00Z'),
				updatedAt: new Date('2024-01-01T00:00:00Z'),
			},
			{
				id: 2,
				name: 'Fantasy',
				createdAt: new Date('2024-01-02T00:00:00Z'),
				updatedAt: new Date('2024-01-02T00:00:00Z'),
			},
		]

		it('should return paginated tags successfully', async () => {
			mockPrisma.$transaction.mockImplementation(async (_queries) => {
				return [mockTags, 2]
			})

			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/tags',
			})

			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)
			expect(body.success).toBe(true)
			expect(body.data).toHaveLength(2)
			expect(body.pagination).toEqual({
				page: 1,
				pageSize: 10,
				total: 2,
				totalPages: 1,
			})
		})

		it('should return paginated tags with query parameters', async () => {
			mockPrisma.$transaction.mockImplementation(async (_queries) => {
				return [mockTags.slice(0, 1), 2]
			})

			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/tags?page=1&pageSize=1',
			})

			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)
			expect(body.success).toBe(true)
			expect(body.data).toHaveLength(1)
			expect(body.pagination.pageSize).toBe(1)
		})

		it('should return 400 for invalid pagination parameters', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/tags?page=0',
			})

			expect(response.statusCode).toBe(400)
			// Fastify validation error for schema violations
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/tags',
			})

			expect(response.statusCode).toBe(500)
			const body = JSON.parse(response.body)
			expect(body.error).toBe('Internal server error')
		})
	})

	describe('GET /api/v1/tags/:id', () => {
		const mockTag = {
			id: 1,
			name: 'Adventure',
			createdAt: new Date('2024-01-01T00:00:00Z'),
			updatedAt: new Date('2024-01-01T00:00:00Z'),
		}

		it('should return a tag successfully', async () => {
			mockPrisma.tag.findUnique.mockResolvedValue(mockTag)

			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/tags/1',
			})

			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)
			expect(body.success).toBe(true)
			expect(body.data.id).toBe(1)
			expect(body.data.name).toBe('Adventure')
		})

		it('should return 404 when tag not found', async () => {
			mockPrisma.tag.findUnique.mockResolvedValue(null)

			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/tags/999',
			})

			expect(response.statusCode).toBe(404)
			const body = JSON.parse(response.body)
			expect(body.error).toBe('Tag not found')
		})

		it('should return 400 for invalid ID', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/tags/invalid',
			})

			expect(response.statusCode).toBe(400)
			// Fastify validation error for invalid ID format
		})

		it('should handle database errors', async () => {
			mockPrisma.tag.findUnique.mockRejectedValue(new Error('Database error'))

			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/tags/1',
			})

			expect(response.statusCode).toBe(500)
			const body = JSON.parse(response.body)
			expect(body.error).toBe('Internal server error')
		})
	})

	describe('POST /api/v1/tags', () => {
		const mockCreatedTag = {
			id: 1,
			name: 'Adventure',
			createdAt: new Date('2024-01-01T00:00:00Z'),
			updatedAt: new Date('2024-01-01T00:00:00Z'),
		}

		it('should create a tag successfully', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null) // No existing tag
			mockPrisma.tag.create.mockResolvedValue(mockCreatedTag)

			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/tags',
				payload: { name: 'Adventure' },
			})

			expect(response.statusCode).toBe(201)
			const body = JSON.parse(response.body)
			expect(body.success).toBe(true)
			expect(body.data.name).toBe('Adventure')
			expect(body.message).toBe('Tag created successfully')
		})

		it('should return 400 for invalid payload', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/tags',
				payload: { name: '' },
			})

			expect(response.statusCode).toBe(400)
		})

		it('should return 409 when tag name already exists', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue({ id: 1 })

			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/tags',
				payload: { name: 'Adventure' },
			})

			expect(response.statusCode).toBe(409)
			const body = JSON.parse(response.body)
			expect(body.error).toContain('already exists')
		})

		it('should handle database errors', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)
			mockPrisma.tag.create.mockRejectedValue(new Error('Database error'))

			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/tags',
				payload: { name: 'Adventure' },
			})

			expect(response.statusCode).toBe(500)
			const body = JSON.parse(response.body)
			expect(body.error).toBe('Internal server error')
		})
	})

	describe('PUT /api/v1/tags/:id', () => {
		const mockUpdatedTag = {
			id: 1,
			name: 'Updated Adventure',
			createdAt: new Date('2024-01-01T00:00:00Z'),
			updatedAt: new Date('2024-01-02T00:00:00Z'),
		}

		it('should update a tag successfully', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null) // No conflicting tag
			mockPrisma.tag.update.mockResolvedValue(mockUpdatedTag)

			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/tags/1',
				payload: { name: 'Updated Adventure' },
			})

			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)
			expect(body.success).toBe(true)
			expect(body.data.name).toBe('Updated Adventure')
			expect(body.message).toBe('Tag updated successfully')
		})

		it('should return 404 when tag not found', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)
			const prismaError = new Error('Record not found')
			// @ts-expect-error Adding Prisma error code
			prismaError.code = 'P2025'
			mockPrisma.tag.update.mockRejectedValue(prismaError)

			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/tags/999',
				payload: { name: 'Updated Tag' },
			})

			expect(response.statusCode).toBe(404)
			const body = JSON.parse(response.body)
			expect(body.error).toBe('Tag not found')
		})

		it('should return 400 for invalid ID', async () => {
			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/tags/invalid',
				payload: { name: 'Updated Tag' },
			})

			expect(response.statusCode).toBe(400)
			// Fastify validation error for invalid ID format
		})

		it('should return 409 when tag name already exists', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue({ id: 2 }) // Conflicting tag

			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/tags/1',
				payload: { name: 'Existing Tag' },
			})

			expect(response.statusCode).toBe(409)
			const body = JSON.parse(response.body)
			expect(body.error).toContain('already exists')
		})

		it('should handle database errors', async () => {
			mockPrisma.tag.findFirst.mockResolvedValue(null)
			mockPrisma.tag.update.mockRejectedValue(new Error('Database error'))

			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/tags/1',
				payload: { name: 'Updated Tag' },
			})

			expect(response.statusCode).toBe(500)
			const body = JSON.parse(response.body)
			expect(body.error).toBe('Internal server error')
		})
	})

	describe('DELETE /api/v1/tags/:id', () => {
		it('should delete a tag successfully', async () => {
			const mockTransaction = jest.fn()
			mockPrisma.$transaction.mockImplementation(mockTransaction)

			const mockTx = {
				tag: {
					findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Adventure' }),
					delete: jest.fn().mockResolvedValue({ id: 1 }),
				},
				item: { count: jest.fn().mockResolvedValue(0) },
				character: { count: jest.fn().mockResolvedValue(0) },
				skill: { count: jest.fn().mockResolvedValue(0) },
				archetype: { count: jest.fn().mockResolvedValue(0) },
				race: { count: jest.fn().mockResolvedValue(0) },
			}

			mockTransaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			const response = await app.inject({
				method: 'DELETE',
				url: '/api/v1/tags/1',
			})

			expect(response.statusCode).toBe(200)
			const body = JSON.parse(response.body)
			expect(body.success).toBe(true)
			expect(body.message).toBe('Tag deleted successfully')
		})

		it('should return 404 when tag not found', async () => {
			const mockTransaction = jest.fn()
			mockPrisma.$transaction.mockImplementation(mockTransaction)

			const mockTx = {
				tag: {
					findUnique: jest.fn().mockResolvedValue(null),
				},
			}

			mockTransaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			const response = await app.inject({
				method: 'DELETE',
				url: '/api/v1/tags/999',
			})

			expect(response.statusCode).toBe(404)
			const body = JSON.parse(response.body)
			expect(body.error).toContain('not found')
		})

		it('should return 400 for invalid ID', async () => {
			const response = await app.inject({
				method: 'DELETE',
				url: '/api/v1/tags/invalid',
			})

			expect(response.statusCode).toBe(400)
			// Fastify validation error for invalid ID format
		})

		it('should return 409 when tag has references', async () => {
			const mockTransaction = jest.fn()
			mockPrisma.$transaction.mockImplementation(mockTransaction)

			const mockTx = {
				tag: {
					findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Adventure' }),
				},
				item: { count: jest.fn().mockResolvedValue(2) },
				character: { count: jest.fn().mockResolvedValue(1) },
				skill: { count: jest.fn().mockResolvedValue(0) },
				archetype: { count: jest.fn().mockResolvedValue(0) },
				race: { count: jest.fn().mockResolvedValue(0) },
			}

			mockTransaction.mockImplementation(async (callback) => {
				return await callback(mockTx)
			})

			const response = await app.inject({
				method: 'DELETE',
				url: '/api/v1/tags/1',
			})

			expect(response.statusCode).toBe(409)
			const body = JSON.parse(response.body)
			expect(body.error).toContain('being used by')
		})

		it('should handle database errors', async () => {
			mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

			const response = await app.inject({
				method: 'DELETE',
				url: '/api/v1/tags/1',
			})

			expect(response.statusCode).toBe(500)
			const body = JSON.parse(response.body)
			expect(body.error).toBe('Internal server error')
		})
	})
})
