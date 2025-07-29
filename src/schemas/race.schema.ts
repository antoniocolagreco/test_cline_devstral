import type { JSONSchemaType } from 'ajv'
import type Race from '../models/race.model'
import { skillSchema } from './skill.schema'

// Fastify JSON Schema for Race input validation
export const raceSchema: JSONSchemaType<Race> = {
    type: 'object',
    required: [
        'id',
        'name',
        'skills',
        'healthModifier',
        'manaModifier',
        'strengthModifier',
        'dexterityModifier',
        'constitutionModifier',
        'intelligenceModifier',
        'wisdomModifier',
        'charismaModifier',
    ],
    properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'string', nullable: true },
        skills: { type: 'array', items: skillSchema },
        healthModifier: { type: 'integer' },
        manaModifier: { type: 'integer' },
        strengthModifier: { type: 'integer' },
        dexterityModifier: { type: 'integer' },
        constitutionModifier: { type: 'integer' },
        intelligenceModifier: { type: 'integer' },
        wisdomModifier: { type: 'integer' },
        charismaModifier: { type: 'integer' },
    },
    additionalProperties: false,
}
