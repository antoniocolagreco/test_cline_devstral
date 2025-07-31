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

type GetSkill = Static<typeof GetSkillSchema>
type CreateSkill = Static<typeof CreateSkillSchema>
type UpdateSkill = Static<typeof UpdateSkillSchema>
type GetSkillParams = Static<typeof GetSkillParamsSchema>

export { CreateSkillSchema, GetSkillParamsSchema, GetSkillSchema, UpdateSkillSchema }
export type { CreateSkill, GetSkill, GetSkillParams, UpdateSkill }
