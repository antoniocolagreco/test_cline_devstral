import { FastifyInstance } from 'fastify'
import { prisma } from '../index.js'

export default async function itemRoutes(server: FastifyInstance) {
    server.get('/', async (request, reply) => {
        const items = await prisma.item.findMany()
        reply.send(items)
    })
    server.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const item = await prisma.item.findUnique({ where: { id: Number(request.params.id) } })
        if (!item) return reply.code(404).send({ error: 'Item not found' })
        reply.send(item)
    })
    server.post('/', async (request, reply) => {
        const data = request.body as any
        const item = await prisma.item.create({ data })
        reply.code(201).send(item)
    })
    server.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const item = await prisma.item.update({
                where: { id: Number(request.params.id) },
                data,
            })
            reply.send(item)
        } catch {
            reply.code(404).send({ error: 'Item not found' })
        }
    })
    server.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const item = await prisma.item.update({
                where: { id: Number(request.params.id) },
                data,
            })
            reply.send(item)
        } catch {
            reply.code(404).send({ error: 'Item not found' })
        }
    })
    server.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            await prisma.item.delete({ where: { id: Number(request.params.id) } })
            reply.code(204).send()
        } catch {
            reply.code(404).send({ error: 'Item not found' })
        }
    })
}
