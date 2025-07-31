import { Type, Static } from '@sinclair/typebox'

const GetUserSchema = Type.Object(
	{
		id: Type.Integer(),
		name: Type.String({ minLength: 2, maxLength: 50, pattern: '^[a-zA-Z0-9\\s]+$' }),
		email: Type.String({ format: 'email' }),
		password: Type.Optional(Type.String()),
		googleId: Type.Optional(Type.String()),
		githubId: Type.Optional(Type.String()),
		discordId: Type.Optional(Type.String()),
		avatarPath: Type.Optional(Type.String()),
		isVerified: Type.Boolean(),
		isActive: Type.Boolean(),
		lastLoginAt: Type.Optional(Type.String({ format: 'date-time' })),
		createdAt: Type.String({ format: 'date-time' }),
		updatedAt: Type.String({ format: 'date-time' }),
	},
	{ additionalProperties: false },
)

const CreateUserSchema = Type.Object(
	{
		name: Type.String({ minLength: 2, maxLength: 50, pattern: '^[a-zA-Z0-9\\s]+$' }),
		email: Type.String({ format: 'email' }),
		password: Type.String({ minLength: 8 }),
	},
	{ additionalProperties: false },
)

const UpdateUserSchema = Type.Object(
	{
		id: Type.Integer({ minimum: 1 }),
		name: Type.Optional(Type.String({ minLength: 2, maxLength: 50, pattern: '^[a-zA-Z0-9\\s]+$' })),
		email: Type.Optional(Type.String({ format: 'email' })),
		password: Type.Optional(Type.String({ minLength: 8 })),
		isVerified: Type.Optional(Type.Boolean()),
		isActive: Type.Optional(Type.Boolean()),
		avatarPath: Type.Optional(Type.String()),
	},
	{ additionalProperties: false },
)

const GetUserParamsSchema = Type.Object(
	{
		id: Type.String({ pattern: '^[1-9]\\d*$' }),
	},
	{ additionalProperties: false },
)

type GetUser = Static<typeof GetUserSchema>
type CreateUser = Static<typeof CreateUserSchema>
type UpdateUser = Static<typeof UpdateUserSchema>
type GetUserParams = Static<typeof GetUserParamsSchema>

export { CreateUserSchema, GetUserParamsSchema, GetUserSchema, UpdateUserSchema }
export type { CreateUser, GetUser, GetUserParams, UpdateUser }
