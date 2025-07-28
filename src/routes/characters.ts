import { FastifyInstance } from 'fastify'
import { prisma } from '../index.js'

export default async function characterRoutes(server: FastifyInstance) {
    server.get('/', async (request, reply) => {
        const characters = await prisma.character.findMany()
        reply.send(characters)
    })
    server.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const character = await prisma.character.findUnique({ where: { id: Number(request.params.id) } })
        if (!character) return reply.code(404).send({ error: 'Character not found' })
        reply.send(character)
    })
    server.post('/', async (request, reply) => {
        const data = request.body as any
        const character = await prisma.character.create({ data })
        reply.code(201).send(character)
    })
    server.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const character = await prisma.character.update({ where: { id: Number(request.params.id) }, data })
            reply.send(character)
        } catch {
            reply.code(404).send({ error: 'Character not found' })
        }
    })
    server.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const character = await prisma.character.update({ where: { id: Number(request.params.id) }, data })
            reply.send(character)
        } catch {
            reply.code(404).send({ error: 'Character not found' })
        }
    })
    server.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            await prisma.character.delete({ where: { id: Number(request.params.id) } })
            reply.code(204).send()
        } catch {
            reply.code(404).send({ error: 'Character not found' })
        }
    })
}
