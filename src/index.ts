import { PrismaClient } from '@prisma/client'
import tagsRoutes from '@routes/tags.routes.js'
import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import process from 'process'

// Initialize Fastify server
const server: FastifyInstance = fastify({
	logger: true,
})

// Initialize Prisma client
const prisma = new PrismaClient()

export { prisma, server }

// Register routes
async function registerRoutes(server: FastifyInstance) {
	// Register API v1 prefix
	await server.register(
		async function (fastify) {
			// Register tags routes
			await fastify.register(tagsRoutes)
		},
		{ prefix: '/api/v1' },
	)
}

// Root route (health check)
server.get('/', async () => {
	return { status: 'API is running' }
})

// Error handling
server.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
	server.log.error(error)

	// Return a user-friendly error message
	return reply.status(500).send({ error: 'Internal Server Error' })
})

// Start the server
const start = async () => {
	try {
		await registerRoutes(server)

		await server.listen({
			port: 3000,
			host: '0.0.0.0',
		})

		server.log.info(`Server running on http://localhost:3000`)
	} catch (err) {
		server.log.error(err)
		process.exit(1)
	}
}

start()
