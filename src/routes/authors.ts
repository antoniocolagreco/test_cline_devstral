import { FastifyInstance } from 'fastify'
import { prisma } from '../index.js'

export default async function authorRoutes(server: FastifyInstance) {
    server.get('/', async (request, reply) => {
        const authors = await prisma.author.findMany()
        reply.send(authors)
    })
    server.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const author = await prisma.author.findUnique({ where: { id: Number(request.params.id) } })
        if (!author) return reply.code(404).send({ error: 'Author not found' })
        reply.send(author)
    })
    server.post('/', async (request, reply) => {
        const data = request.body as any
        const author = await prisma.author.create({ data })
        reply.code(201).send(author)
    })
    server.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const author = await prisma.author.update({ where: { id: Number(request.params.id) }, data })
            reply.send(author)
        } catch {
            reply.code(404).send({ error: 'Author not found' })
        }
    })
    server.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const author = await prisma.author.update({ where: { id: Number(request.params.id) }, data })
            reply.send(author)
        } catch {
            reply.code(404).send({ error: 'Author not found' })
        }
    })
    server.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            await prisma.author.delete({ where: { id: Number(request.params.id) } })
            reply.code(204).send()
        } catch {
            reply.code(404).send({ error: 'Author not found' })
        }
    })
}
