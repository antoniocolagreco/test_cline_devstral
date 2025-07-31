import { Type, Static } from '@sinclair/typebox'

const GetItemSchema = Type.Object(
	{
		id: Type.Integer(),
		name: Type.String({ minLength: 1, maxLength: 100 }),
		description: Type.Optional(Type.String({ maxLength: 500 })),
		rarity: Type.String({ enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] }),
		isWeapon: Type.Boolean(),
		isShield: Type.Boolean(),
		isArmor: Type.Boolean(),
		isAccessory: Type.Boolean(),
		isConsumable: Type.Boolean(),
		isQuestItem: Type.Boolean(),
		isCraftingMaterial: Type.Boolean(),
		isMiscellaneous: Type.Boolean(),
		attack: Type.Integer({ minimum: 0 }),
		defense: Type.Integer({ minimum: 0 }),
		requiredStrength: Type.Integer({ minimum: 0, maximum: 50 }),
		requiredDexterity: Type.Integer({ minimum: 0, maximum: 50 }),
		requiredConstitution: Type.Integer({ minimum: 0, maximum: 50 }),
		requiredIntelligence: Type.Integer({ minimum: 0, maximum: 50 }),
		requiredWisdom: Type.Integer({ minimum: 0, maximum: 50 }),
		requiredCharisma: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusStrength: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusDexterity: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusConstitution: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusIntelligence: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusWisdom: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusCharisma: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusHealth: Type.Integer({ minimum: 0, maximum: 50 }),
		durability: Type.Integer({ minimum: 1, maximum: 10000 }),
		weight: Type.Integer({ minimum: 1 }),
		createdAt: Type.String({ format: 'date-time' }),
		updatedAt: Type.String({ format: 'date-time' }),
	},
	{ additionalProperties: false },
)

const CreateItemSchema = Type.Object(
	{
		name: Type.String({ minLength: 1, maxLength: 100 }),
		description: Type.Optional(Type.String({ maxLength: 500 })),
		rarity: Type.String({ enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] }),
		isWeapon: Type.Boolean(),
		isShield: Type.Boolean(),
		isArmor: Type.Boolean(),
		isAccessory: Type.Boolean(),
		isConsumable: Type.Boolean(),
		isQuestItem: Type.Boolean(),
		isCraftingMaterial: Type.Boolean(),
		isMiscellaneous: Type.Boolean(),
		attack: Type.Integer({ minimum: 0 }),
		defense: Type.Integer({ minimum: 0 }),
		requiredStrength: Type.Integer({ minimum: 0, maximum: 50 }),
		requiredDexterity: Type.Integer({ minimum: 0, maximum: 50 }),
		requiredConstitution: Type.Integer({ minimum: 0, maximum: 50 }),
		requiredIntelligence: Type.Integer({ minimum: 0, maximum: 50 }),
		requiredWisdom: Type.Integer({ minimum: 0, maximum: 50 }),
		requiredCharisma: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusStrength: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusDexterity: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusConstitution: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusIntelligence: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusWisdom: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusCharisma: Type.Integer({ minimum: 0, maximum: 50 }),
		bonusHealth: Type.Integer({ minimum: 0, maximum: 50 }),
		durability: Type.Integer({ minimum: 1, maximum: 10000 }),
		weight: Type.Integer({ minimum: 1 }),
	},
	{ additionalProperties: false },
)

const UpdateItemSchema = Type.Object(
	{
		id: Type.Integer({ minimum: 1 }),
		name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
		description: Type.Optional(Type.String({ maxLength: 500 })),
		rarity: Type.Optional(Type.String({ enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] })),
		isWeapon: Type.Optional(Type.Boolean()),
		isShield: Type.Optional(Type.Boolean()),
		isArmor: Type.Optional(Type.Boolean()),
		isAccessory: Type.Optional(Type.Boolean()),
		isConsumable: Type.Optional(Type.Boolean()),
		isQuestItem: Type.Optional(Type.Boolean()),
		isCraftingMaterial: Type.Optional(Type.Boolean()),
		isMiscellaneous: Type.Optional(Type.Boolean()),
		attack: Type.Optional(Type.Integer({ minimum: 0 })),
		defense: Type.Optional(Type.Integer({ minimum: 0 })),
		requiredStrength: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		requiredDexterity: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		requiredConstitution: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		requiredIntelligence: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		requiredWisdom: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		requiredCharisma: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		bonusStrength: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		bonusDexterity: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		bonusConstitution: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		bonusIntelligence: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		bonusWisdom: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		bonusCharisma: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		bonusHealth: Type.Optional(Type.Integer({ minimum: 0, maximum: 50 })),
		durability: Type.Optional(Type.Integer({ minimum: 1, maximum: 10000 })),
		weight: Type.Optional(Type.Integer({ minimum: 1 })),
	},
	{ additionalProperties: false },
)

const GetItemParamsSchema = Type.Object(
	{
		id: Type.String({ pattern: '^[1-9]\\d*$' }),
	},
	{ additionalProperties: false },
)

export type GetItem = Static<typeof GetItemSchema>
export type CreateItem = Static<typeof CreateItemSchema>
export type UpdateItem = Static<typeof UpdateItemSchema>
export type GetItemParams = Static<typeof GetItemParamsSchema>

export { GetItemSchema, CreateItemSchema, UpdateItemSchema, GetItemParamsSchema }
