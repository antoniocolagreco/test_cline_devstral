import { Type, Static } from '@sinclair/typebox'

const GetSkillSchema = Type.Object(
	{
		id: Type.Integer(),
		name: Type.String({ minLength: 1, maxLength: 100 }),
		description: Type.Optional(Type.String({ maxLength: 500 })),
		createdAt: Type.String({ format: 'date-time' }),
		updatedAt: Type.String({ format: 'date-time' }),
	},
	{ additionalProperties: false },
)

const CreateSkillSchema = Type.Object(
	{
		name: Type.String({ minLength: 1, maxLength: 100 }),
		description: Type.Optional(Type.String({ maxLength: 500 })),
	},
	{ additionalProperties: false },
)

const UpdateSkillSchema = Type.Object(
	{
		id: Type.Integer({ minimum: 1 }),
		name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
		description: Type.Optional(Type.String({ maxLength: 500 })),
	},
	{ additionalProperties: false },
)

const GetSkillParamsSchema = Type.Object(
	{
		id: Type.String({ pattern: '^[1-9]\\d*$' }),
	},
	{ additionalProperties: false },
)

export type GetSkill = Static<typeof GetSkillSchema>
export type CreateSkill = Static<typeof CreateSkillSchema>
export type UpdateSkill = Static<typeof UpdateSkillSchema>
export type GetSkillParams = Static<typeof GetSkillParamsSchema>

export { GetSkillSchema, CreateSkillSchema, UpdateSkillSchema, GetSkillParamsSchema }
