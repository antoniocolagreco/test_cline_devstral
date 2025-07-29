// Fastify JSON Schema for Archetype input validation
export const archetypeSchema = {
    type: 'object',
    required: ['id', 'name', 'skills'],
    properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        skills: {
            type: 'array',
            items: { $ref: 'skillSchema#' },
        },
    },
    additionalProperties: false,
}
