import process from 'process'

import fastify from 'fastify'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

// Initialize Fastify server
const server: FastifyInstance = fastify({
    logger: true,
})

// Initialize Prisma client
const prisma = new PrismaClient()

export { server, prisma }

// Register routes
async function registerRoutes(server: FastifyInstance) {
    // Import and register character routes
    const characterRoutes = await import('./routes/characters.js')
    server.register(characterRoutes.default, { prefix: '/characters' })

    // Import and register author routes
    const authorRoutes = await import('./routes/authors.js')
    server.register(authorRoutes.default, { prefix: '/authors' })

    // Import and register class routes
    const classRoutes = await import('./routes/classes.js')
    server.register(classRoutes.default, { prefix: '/classes' })

    // Import and register item routes
    const itemRoutes = await import('./routes/items.js')
    server.register(itemRoutes.default, { prefix: '/items' })

    // Import and register race routes
    const raceRoutes = await import('./routes/races.js')
    server.register(raceRoutes.default, { prefix: '/races' })

    // Import and register skill routes
    const skillRoutes = await import('./routes/skills.js')
    server.register(skillRoutes.default, { prefix: '/skills' })
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
