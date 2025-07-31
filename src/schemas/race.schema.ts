import { Type, Static } from '@sinclair/typebox'

const GetRaceSchema = Type.Object(
	{
		id: Type.Integer(),
		name: Type.String({ minLength: 1, maxLength: 50 }),
		description: Type.Optional(Type.String({ maxLength: 500 })),
		healthModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		staminaModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		manaModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		strengthModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		dexterityModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		constitutionModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		intelligenceModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		wisdomModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		charismaModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		createdAt: Type.String({ format: 'date-time' }),
		updatedAt: Type.String({ format: 'date-time' }),
	},
	{ additionalProperties: false },
)

const CreateRaceSchema = Type.Object(
	{
		name: Type.String({ minLength: 1, maxLength: 50 }),
		description: Type.Optional(Type.String({ maxLength: 500 })),
		healthModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		staminaModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		manaModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		strengthModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		dexterityModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		constitutionModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		intelligenceModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		wisdomModifier: Type.Integer({ minimum: -10, maximum: 10 }),
		charismaModifier: Type.Integer({ minimum: -10, maximum: 10 }),
	},
	{ additionalProperties: false },
)

const UpdateRaceSchema = Type.Object(
	{
		id: Type.Integer({ minimum: 1 }),
		name: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
		description: Type.Optional(Type.String({ maxLength: 500 })),
		healthModifier: Type.Optional(Type.Integer({ minimum: -10, maximum: 10 })),
		staminaModifier: Type.Optional(Type.Integer({ minimum: -10, maximum: 10 })),
		manaModifier: Type.Optional(Type.Integer({ minimum: -10, maximum: 10 })),
		strengthModifier: Type.Optional(Type.Integer({ minimum: -10, maximum: 10 })),
		dexterityModifier: Type.Optional(Type.Integer({ minimum: -10, maximum: 10 })),
		constitutionModifier: Type.Optional(Type.Integer({ minimum: -10, maximum: 10 })),
		intelligenceModifier: Type.Optional(Type.Integer({ minimum: -10, maximum: 10 })),
		wisdomModifier: Type.Optional(Type.Integer({ minimum: -10, maximum: 10 })),
		charismaModifier: Type.Optional(Type.Integer({ minimum: -10, maximum: 10 })),
	},
	{ additionalProperties: false },
)

const GetRaceParamsSchema = Type.Object(
	{
		id: Type.String({ pattern: '^[1-9]\\d*$' }),
	},
	{ additionalProperties: false },
)

export type GetRace = Static<typeof GetRaceSchema>
export type CreateRace = Static<typeof CreateRaceSchema>
export type UpdateRace = Static<typeof UpdateRaceSchema>
export type GetRaceParams = Static<typeof GetRaceParamsSchema>

export { GetRaceSchema, CreateRaceSchema, UpdateRaceSchema, GetRaceParamsSchema }
