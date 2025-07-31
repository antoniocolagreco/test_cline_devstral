import { Type, Static } from '@sinclair/typebox'

const GetArchetypeSchema = Type.Object(
	{
		id: Type.Integer(),
		name: Type.String({ minLength: 1, maxLength: 50 }),
		description: Type.Optional(Type.String({ maxLength: 500 })),
		createdAt: Type.String({ format: 'date-time' }),
		updatedAt: Type.String({ format: 'date-time' }),
	},
	{ additionalProperties: false },
)

const CreateArchetypeSchema = Type.Object(
	{
		name: Type.String({ minLength: 1, maxLength: 50 }),
		description: Type.Optional(Type.String({ maxLength: 500 })),
	},
	{ additionalProperties: false },
)

const UpdateArchetypeSchema = Type.Object(
	{
		id: Type.Integer({ minimum: 1 }),
		name: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
		description: Type.Optional(Type.String({ maxLength: 500 })),
	},
	{ additionalProperties: false },
)

const GetArchetypeParamsSchema = Type.Object(
	{
		id: Type.String({ pattern: '^[1-9]\\d*$' }),
	},
	{ additionalProperties: false },
)

export type GetArchetype = Static<typeof GetArchetypeSchema>
export type CreateArchetype = Static<typeof CreateArchetypeSchema>
export type UpdateArchetype = Static<typeof UpdateArchetypeSchema>
export type GetArchetypeParams = Static<typeof GetArchetypeParamsSchema>

export { GetArchetypeSchema, CreateArchetypeSchema, UpdateArchetypeSchema, GetArchetypeParamsSchema }
