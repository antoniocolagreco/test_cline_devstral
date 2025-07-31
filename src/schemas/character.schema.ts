import { Static, Type } from '@sinclair/typebox'

const GetCharacterSchema = Type.Object(
	{
		id: Type.Integer(),
		name: Type.String({ minLength: 1, maxLength: 50 }),
		surname: Type.Optional(Type.String({ maxLength: 50 })),
		nickname: Type.Optional(Type.String({ maxLength: 30 })),
		description: Type.Optional(Type.String({ maxLength: 1000 })),
		health: Type.Integer({ minimum: 1 }),
		stamina: Type.Integer({ minimum: 1 }),
		mana: Type.Integer({ minimum: 1 }),
		strength: Type.Integer({ minimum: 1, maximum: 20 }),
		dexterity: Type.Integer({ minimum: 1, maximum: 20 }),
		constitution: Type.Integer({ minimum: 1, maximum: 20 }),
		intelligence: Type.Integer({ minimum: 1, maximum: 20 }),
		wisdom: Type.Integer({ minimum: 1, maximum: 20 }),
		charisma: Type.Integer({ minimum: 1, maximum: 20 }),
		isPublic: Type.Boolean(),
		raceId: Type.Integer({ minimum: 1 }),
		archetypeId: Type.Integer({ minimum: 1 }),
		userId: Type.Integer({ minimum: 1 }),
		createdAt: Type.String({ format: 'date-time' }),
		updatedAt: Type.String({ format: 'date-time' }),
	},
	{ additionalProperties: false },
)

const CreateCharacterSchema = Type.Object(
	{
		name: Type.String({ minLength: 1, maxLength: 50 }),
		surname: Type.Optional(Type.String({ maxLength: 50 })),
		nickname: Type.Optional(Type.String({ maxLength: 30 })),
		description: Type.Optional(Type.String({ maxLength: 1000 })),
		health: Type.Integer({ minimum: 1 }),
		stamina: Type.Integer({ minimum: 1 }),
		mana: Type.Integer({ minimum: 1 }),
		strength: Type.Integer({ minimum: 1, maximum: 20 }),
		dexterity: Type.Integer({ minimum: 1, maximum: 20 }),
		constitution: Type.Integer({ minimum: 1, maximum: 20 }),
		intelligence: Type.Integer({ minimum: 1, maximum: 20 }),
		wisdom: Type.Integer({ minimum: 1, maximum: 20 }),
		charisma: Type.Integer({ minimum: 1, maximum: 20 }),
		isPublic: Type.Boolean(),
		raceId: Type.Integer({ minimum: 1 }),
		archetypeId: Type.Integer({ minimum: 1 }),
		userId: Type.Integer({ minimum: 1 }),
	},
	{ additionalProperties: false },
)

const UpdateCharacterSchema = Type.Object(
	{
		id: Type.Integer({ minimum: 1 }),
		name: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
		surname: Type.Optional(Type.String({ maxLength: 50 })),
		nickname: Type.Optional(Type.String({ maxLength: 30 })),
		description: Type.Optional(Type.String({ maxLength: 1000 })),
		health: Type.Optional(Type.Integer({ minimum: 1 })),
		stamina: Type.Optional(Type.Integer({ minimum: 1 })),
		mana: Type.Optional(Type.Integer({ minimum: 1 })),
		strength: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })),
		dexterity: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })),
		constitution: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })),
		intelligence: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })),
		wisdom: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })),
		charisma: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })),
		isPublic: Type.Optional(Type.Boolean()),
		raceId: Type.Optional(Type.Integer({ minimum: 1 })),
		archetypeId: Type.Optional(Type.Integer({ minimum: 1 })),
		userId: Type.Optional(Type.Integer({ minimum: 1 })),
	},
	{ additionalProperties: false },
)

const GetCharacterParamsSchema = Type.Object(
	{
		id: Type.String({ pattern: '^[1-9]\\d*$' }),
	},
	{ additionalProperties: false },
)

export type GetCharacter = Static<typeof GetCharacterSchema>
export type CreateCharacter = Static<typeof CreateCharacterSchema>
export type UpdateCharacter = Static<typeof UpdateCharacterSchema>
export type GetCharacterParams = Static<typeof GetCharacterParamsSchema>

export { CreateCharacterSchema, GetCharacterParamsSchema, GetCharacterSchema, UpdateCharacterSchema }
