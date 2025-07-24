import { FastifyInstance } from 'fastify'
import {
    getAllCharacters,
    getCharacterById,
    createCharacter,
    updateCharacter,
    deleteCharacter,
} from '../services/characterService'
import { characterCreateSchema, characterUpdateSchema } from '../schemas/characterSchema'

type IdParams = { id: string }

export default async function characterRoutes(server: FastifyInstance) {
    // GET /characters - Retrieve all characters
    server.get('/', async (request, reply) => {
        try {
            const characters = await getAllCharacters()
            reply.send(characters)
        } catch (err) {
            reply.status(500).send({ error: 'Internal server error' })
        }
    })

    // GET /characters/:id - Retrieve character by ID
    server.get<{ Params: IdParams }>('/:id', async (request, reply) => {
        try {
            const id = Number(request.params.id)
            if (isNaN(id)) return reply.status(400).send({ error: 'Invalid ID' })
            const character = await getCharacterById(id)
            if (!character) return reply.status(404).send({ error: 'Character not found' })
            reply.send(character)
        } catch (err) {
            reply.status(500).send({ error: 'Internal server error' })
        }
    })

    // POST /characters - Create a new character
    server.post('/', async (request, reply) => {
        try {
            const parse = characterCreateSchema.safeParse(request.body)
            if (!parse.success) return reply.status(400).send({ error: 'Invalid data', details: parse.error.errors })
            const character = await createCharacter(parse.data)
            reply.code(201).send(character)
        } catch (err) {
            reply.status(500).send({ error: 'Internal server error' })
        }
    })

    // PUT /characters/:id - Update character by ID
    server.put<{ Params: IdParams }>('/:id', async (request, reply) => {
        try {
            const id = Number(request.params.id)
            if (isNaN(id)) return reply.status(400).send({ error: 'Invalid ID' })
            const parse = characterCreateSchema.safeParse(request.body)
            if (!parse.success) return reply.status(400).send({ error: 'Invalid data', details: parse.error.errors })
            const character = await updateCharacter(id, parse.data)
            if (!character) return reply.status(404).send({ error: 'Character not found' })
            reply.send(character)
        } catch (err) {
            reply.status(500).send({ error: 'Internal server error' })
        }
    })

    // PATCH /characters/:id - Partially update character by ID
    server.patch<{ Params: IdParams }>('/:id', async (request, reply) => {
        try {
            const id = Number(request.params.id)
            if (isNaN(id)) return reply.status(400).send({ error: 'Invalid ID' })
            const parse = characterUpdateSchema.safeParse(request.body)
            if (!parse.success) return reply.status(400).send({ error: 'Invalid data', details: parse.error.errors })
            const character = await updateCharacter(id, parse.data)
            if (!character) return reply.status(404).send({ error: 'Character not found' })
            reply.send(character)
        } catch (err) {
            reply.status(500).send({ error: 'Internal server error' })
        }
    })

    // DELETE /characters/:id - Delete character by ID
    server.delete<{ Params: IdParams }>('/:id', async (request, reply) => {
        try {
            const id = Number(request.params.id)
            if (isNaN(id)) return reply.status(400).send({ error: 'Invalid ID' })
            await deleteCharacter(id)
            reply.code(204).send()
        } catch (err) {
            reply.status(500).send({ error: 'Internal server error' })
        }
    })
}
