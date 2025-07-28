import { FastifyInstance } from 'fastify'
import { prisma } from '../index.js'

export default async function skillRoutes(server: FastifyInstance) {
    server.get('/', async (request, reply) => {
        const skills = await prisma.skill.findMany()
        reply.send(skills)
    })
    server.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const skill = await prisma.skill.findUnique({ where: { id: Number(request.params.id) } })
        if (!skill) return reply.code(404).send({ error: 'Skill not found' })
        reply.send(skill)
    })
    server.post('/', async (request, reply) => {
        const data = request.body as any
        const skill = await prisma.skill.create({ data })
        reply.code(201).send(skill)
    })
    server.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const skill = await prisma.skill.update({ where: { id: Number(request.params.id) }, data })
            reply.send(skill)
        } catch {
            reply.code(404).send({ error: 'Skill not found' })
        }
    })
    server.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const data = request.body as any
        try {
            const skill = await prisma.skill.update({ where: { id: Number(request.params.id) }, data })
            reply.send(skill)
        } catch {
            reply.code(404).send({ error: 'Skill not found' })
        }
    })
    server.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            await prisma.skill.delete({ where: { id: Number(request.params.id) } })
            reply.code(204).send()
        } catch {
            reply.code(404).send({ error: 'Skill not found' })
        }
    })
}
