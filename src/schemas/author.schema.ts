// Fastify JSON Schema for Author input validation
import type { JSONSchemaType } from 'ajv'
import type Author from '../models/author.model'

export const authorSchema: JSONSchemaType<Author> = {
    type: 'object',
    required: ['id', 'name', 'email'],
    properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
    },
    additionalProperties: false,
}
