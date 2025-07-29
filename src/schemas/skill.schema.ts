import type { JSONSchemaType } from 'ajv'
import type Skill from '../models/skill'

// Fastify JSON Schema for Skill input validation
export const skillSchema: JSONSchemaType<Skill> = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'string', nullable: true },
    },
    additionalProperties: false,
}
