import { FastifyInstance } from 'fastify'
import { prisma } from '../index.js'

export default async function raceRoutes(server: FastifyInstance) {
    server.get('/', async (request, reply) => {
        const races = await prisma.race.findMany()
        reply.send(races)
    })
    server.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const race = await prisma.race.findUnique({ where: { id: Number(request.params.id) } })
        if (!race) return reply.code(404).send({ error: 'Race not found' })
        reply.send(race)
    })
    server.post('/', async (request, reply) => {
        const data = request.body as any
        const race = await prisma.race.create({ data })
        reply.code(201).send(race)
    })
    server.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const race = await prisma.race.update({ where: { id: Number(request.params.id) }, data })
            reply.send(race)
        } catch {
            reply.code(404).send({ error: 'Race not found' })
        }
    })
    server.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const race = await prisma.race.update({ where: { id: Number(request.params.id) }, data })
            reply.send(race)
        } catch {
            reply.code(404).send({ error: 'Race not found' })
        }
    })
    server.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            await prisma.race.delete({ where: { id: Number(request.params.id) } })
            reply.code(204).send()
        } catch {
            reply.code(404).send({ error: 'Race not found' })
        }
    })
}
