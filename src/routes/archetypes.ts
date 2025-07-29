import { FastifyInstance } from 'fastify'
import { prisma } from '../index.js'

export default async function archetypeRoutes(server: FastifyInstance) {
    server.get('/', async (request, reply) => {
        const archetypes = await prisma.archetype.findMany()
        reply.send(archetypes)
    })
    server.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const archetype = await prisma.archetype.findUnique({ where: { id: Number(request.params.id) } })
        if (!archetype) return reply.code(404).send({ error: 'Archetype not found' })
        reply.send(archetype)
    })
    server.post('/', async (request, reply) => {
        const data = request.body as any
        const archetype = await prisma.archetype.create({ data })
        reply.code(201).send(archetype)
    })
    server.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const archetype = await prisma.archetype.update({
                where: { id: Number(request.params.id) },
                data,
            })
            reply.send(archetype)
        } catch {
            reply.code(404).send({ error: 'Archetype not found' })
        }
    })
    server.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const archetype = await prisma.archetype.update({
                where: { id: Number(request.params.id) },
                data,
            })
            reply.send(archetype)
        } catch {
            reply.code(404).send({ error: 'Archetype not found' })
        }
    })
    server.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            await prisma.archetype.delete({ where: { id: Number(request.params.id) } })
            reply.code(204).send()
        } catch {
            reply.code(404).send({ error: 'Archetype not found' })
        }
    })
}
