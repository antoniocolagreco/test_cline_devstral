import { FastifyInstance } from 'fastify'
import { prisma } from '../index.js'

export default async function classRoutes(server: FastifyInstance) {
    server.get('/', async (request, reply) => {
        const classes = await prisma.characterClass.findMany()
        reply.send(classes)
    })
    server.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const characterClass = await prisma.characterClass.findUnique({ where: { id: Number(request.params.id) } })
        if (!characterClass) return reply.code(404).send({ error: 'Class not found' })
        reply.send(characterClass)
    })
    server.post('/', async (request, reply) => {
        const data = request.body as any
        const characterClass = await prisma.characterClass.create({ data })
        reply.code(201).send(characterClass)
    })
    server.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const characterClass = await prisma.characterClass.update({
                where: { id: Number(request.params.id) },
                data,
            })
            reply.send(characterClass)
        } catch {
            reply.code(404).send({ error: 'Class not found' })
        }
    })
    server.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const characterClass = await prisma.characterClass.update({
                where: { id: Number(request.params.id) },
                data,
            })
            reply.send(characterClass)
        } catch {
            reply.code(404).send({ error: 'Class not found' })
        }
    })
    server.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            await prisma.characterClass.delete({ where: { id: Number(request.params.id) } })
            reply.code(204).send()
        } catch {
            reply.code(404).send({ error: 'Class not found' })
        }
    })
}
