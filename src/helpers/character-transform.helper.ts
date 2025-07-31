import type { GetCharacter } from '@schemas/character.schema.js'
import { calculateAggregateStats, type CharacterStatsInput } from './character.helper.js'

/**
 * Type for character data from Prisma with all relations
 */
type CharacterFromPrisma = {
	id: number
	name: string
	surname: string | null
	nickname: string | null
	description: string | null
	avatarPath: string | null
	health: number
	stamina: number
	mana: number
	strength: number
	dexterity: number
	constitution: number
	intelligence: number
	wisdom: number
	charisma: number
	isPublic: boolean
	raceId: number
	archetypeId: number
	userId: number
	createdAt: Date
	updatedAt: Date
	race: {
		healthModifier: number
		staminaModifier: number
		manaModifier: number
		strengthModifier: number
		dexterityModifier: number
		constitutionModifier: number
		intelligenceModifier: number
		wisdomModifier: number
		charismaModifier: number
	}
	primaryWeapon?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	secondaryWeapon?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	shield?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	armor?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	firstRing?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	secondRing?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
	amulet?: {
		bonusStrength: number
		bonusDexterity: number
		bonusConstitution: number
		bonusIntelligence: number
		bonusWisdom: number
		bonusCharisma: number
		bonusHealth: number
	} | null
}

/**
 * Transforms character data from Prisma to API schema format with calculated aggregate stats
 * @param character - Character data from Prisma query
 * @returns Transformed character object matching GetCharacter schema
 */
const transformCharacterFromPrisma = (character: CharacterFromPrisma): GetCharacter => {
	// Cast character to CharacterStatsInput for aggregate calculation
	const characterForStats: CharacterStatsInput = {
		health: character.health,
		stamina: character.stamina,
		mana: character.mana,
		strength: character.strength,
		dexterity: character.dexterity,
		constitution: character.constitution,
		intelligence: character.intelligence,
		wisdom: character.wisdom,
		charisma: character.charisma,
		race: character.race,
		primaryWeapon: character.primaryWeapon,
		secondaryWeapon: character.secondaryWeapon,
		shield: character.shield,
		armor: character.armor,
		firstRing: character.firstRing,
		secondRing: character.secondRing,
		amulet: character.amulet,
	}

	const aggregateStats = calculateAggregateStats(characterForStats)

	return {
		id: character.id,
		name: character.name,
		surname: character.surname || undefined,
		nickname: character.nickname || undefined,
		description: character.description || undefined,
		avatarPath: character.avatarPath || undefined,
		health: character.health,
		stamina: character.stamina,
		mana: character.mana,
		strength: character.strength,
		dexterity: character.dexterity,
		constitution: character.constitution,
		intelligence: character.intelligence,
		wisdom: character.wisdom,
		charisma: character.charisma,
		...aggregateStats,
		isPublic: character.isPublic,
		raceId: character.raceId,
		archetypeId: character.archetypeId,
		userId: character.userId,
		createdAt: character.createdAt.toISOString(),
		updatedAt: character.updatedAt.toISOString(),
	}
}

export { transformCharacterFromPrisma, type CharacterFromPrisma }
