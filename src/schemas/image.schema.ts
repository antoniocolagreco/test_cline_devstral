import { Type, Static } from '@sinclair/typebox'

const GetImageSchema = Type.Object(
	{
		id: Type.Integer(),
		filename: Type.String(),
		size: Type.Integer({ minimum: 1, maximum: 5242880 }),
		width: Type.Integer({ minimum: 1, maximum: 2048 }),
		height: Type.Integer({ minimum: 1, maximum: 2048 }),
		mimeType: Type.String({ enum: ['image/jpeg', 'image/png', 'image/webp'] }),
		userId: Type.Integer({ minimum: 1 }),
		createdAt: Type.String({ format: 'date-time' }),
		updatedAt: Type.String({ format: 'date-time' }),
	},
	{ additionalProperties: false },
)

const CreateImageSchema = Type.Object(
	{
		filename: Type.String(),
		size: Type.Integer({ minimum: 1, maximum: 5242880 }),
		width: Type.Integer({ minimum: 1, maximum: 2048 }),
		height: Type.Integer({ minimum: 1, maximum: 2048 }),
		mimeType: Type.String({ enum: ['image/jpeg', 'image/png', 'image/webp'] }),
		userId: Type.Integer({ minimum: 1 }),
	},
	{ additionalProperties: false },
)

const UpdateImageSchema = Type.Object(
	{
		id: Type.Integer({ minimum: 1 }),
		filename: Type.Optional(Type.String()),
		size: Type.Optional(Type.Integer({ minimum: 1, maximum: 5242880 })),
		width: Type.Optional(Type.Integer({ minimum: 1, maximum: 2048 })),
		height: Type.Optional(Type.Integer({ minimum: 1, maximum: 2048 })),
		mimeType: Type.Optional(Type.String({ enum: ['image/jpeg', 'image/png', 'image/webp'] })),
		userId: Type.Optional(Type.Integer({ minimum: 1 })),
	},
	{ additionalProperties: false },
)

const GetImageParamsSchema = Type.Object(
	{
		id: Type.String({ pattern: '^[1-9]\\d*$' }),
	},
	{ additionalProperties: false },
)

export type GetImage = Static<typeof GetImageSchema>
export type CreateImage = Static<typeof CreateImageSchema>
export type UpdateImage = Static<typeof UpdateImageSchema>
export type GetImageParams = Static<typeof GetImageParamsSchema>

export { GetImageSchema, CreateImageSchema, UpdateImageSchema, GetImageParamsSchema }
