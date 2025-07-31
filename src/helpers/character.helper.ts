import ValidationError from '@errors/validation.error.js'

/**
 * Interface for character item bonuses
 */
interface ItemBonuses {
	bonusStrength: number
	bonusDexterity: number
	bonusConstitution: number
	bonusIntelligence: number
	bonusWisdom: number
	bonusCharisma: number
	bonusHealth: number
}

/**
 * Interface for race modifiers
 */
interface RaceModifiers {
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

/**
 * Interface for character stats calculation
 */
interface CharacterStatsInput {
	health: number
	stamina: number
	mana: number
	strength: number
	dexterity: number
	constitution: number
	intelligence: number
	wisdom: number
	charisma: number
	race: RaceModifiers
	primaryWeapon?: ItemBonuses | null
	secondaryWeapon?: ItemBonuses | null
	shield?: ItemBonuses | null
	armor?: ItemBonuses | null
	firstRing?: ItemBonuses | null
	secondRing?: ItemBonuses | null
	amulet?: ItemBonuses | null
}

/**
 * Interface for aggregate stats result
 */
interface AggregateStats {
	aggregateHealth: number
	aggregateStamina: number
	aggregateMana: number
	aggregateStrength: number
	aggregateDexterity: number
	aggregateConstitution: number
	aggregateIntelligence: number
	aggregateWisdom: number
	aggregateCharisma: number
}

/**
 * Helper function to calculate aggregate stats based on base stats, race modifiers, and equipped items
 * @param character - Character data with base stats, race modifiers, and equipped items
 * @returns Calculated aggregate stats
 */
const calculateAggregateStats = (character: CharacterStatsInput): AggregateStats => {
	const items = [
		character.primaryWeapon,
		character.secondaryWeapon,
		character.shield,
		character.armor,
		character.firstRing,
		character.secondRing,
		character.amulet,
	].filter(Boolean) as ItemBonuses[]

	const totalItemBonuses = items.reduce(
		(acc, item) => {
			acc.health += item.bonusHealth
			acc.strength += item.bonusStrength
			acc.dexterity += item.bonusDexterity
			acc.constitution += item.bonusConstitution
			acc.intelligence += item.bonusIntelligence
			acc.wisdom += item.bonusWisdom
			acc.charisma += item.bonusCharisma
			return acc
		},
		{ health: 0, strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
	)

	return {
		aggregateHealth: character.health + character.race.healthModifier + totalItemBonuses.health,
		aggregateStamina: character.stamina + character.race.staminaModifier,
		aggregateMana: character.mana + character.race.manaModifier,
		aggregateStrength: character.strength + character.race.strengthModifier + totalItemBonuses.strength,
		aggregateDexterity: character.dexterity + character.race.dexterityModifier + totalItemBonuses.dexterity,
		aggregateConstitution:
			character.constitution + character.race.constitutionModifier + totalItemBonuses.constitution,
		aggregateIntelligence:
			character.intelligence + character.race.intelligenceModifier + totalItemBonuses.intelligence,
		aggregateWisdom: character.wisdom + character.race.wisdomModifier + totalItemBonuses.wisdom,
		aggregateCharisma: character.charisma + character.race.charismaModifier + totalItemBonuses.charisma,
	}
}

/**
 * Validates character name field
 * @param name - Character name to validate
 * @param isRequired - Whether the name is required (for create vs update)
 * @returns Trimmed name if valid
 * @throws ValidationError - When validation fails
 */
const validateCharacterName = (name: string | undefined, isRequired = false): string | undefined => {
	if (name === undefined) {
		if (isRequired) {
			throw new ValidationError('Character name is required and must be a string')
		}
		return undefined
	}

	if (typeof name !== 'string') {
		throw new ValidationError('Character name must be a string')
	}

	const trimmedName = name.trim()
	if (trimmedName.length === 0) {
		throw new ValidationError('Character name cannot be empty')
	}

	if (trimmedName.length > 50) {
		throw new ValidationError('Character name cannot exceed 50 characters')
	}

	return trimmedName
}

/**
 * Validates character string fields with length constraints
 * @param value - String value to validate
 * @param fieldName - Name of the field for error messages
 * @param maxLength - Maximum allowed length
 * @returns Trimmed string or null if empty
 * @throws ValidationError - When validation fails
 */
const validateCharacterStringField = (
	value: string | undefined,
	fieldName: string,
	maxLength: number,
): string | null | undefined => {
	if (value === undefined) {
		return undefined
	}

	if (typeof value !== 'string') {
		throw new ValidationError(`Character ${fieldName} must be a string`)
	}

	const trimmed = value.trim()
	if (trimmed.length > maxLength) {
		throw new ValidationError(`Character ${fieldName} cannot exceed ${maxLength} characters`)
	}

	return trimmed || null
}

/**
 * Validates character stat fields (1-20 range)
 * @param value - Stat value to validate
 * @param fieldName - Name of the field for error messages
 * @param isRequired - Whether the field is required
 * @throws ValidationError - When validation fails
 */
const validateCharacterStat = (value: number | undefined, fieldName: string, isRequired = false): void => {
	if (value === undefined) {
		if (isRequired) {
			throw new ValidationError(`Character ${fieldName} is required`)
		}
		return
	}

	if (!Number.isInteger(value) || value < 1 || value > 20) {
		throw new ValidationError(`Character ${fieldName} must be an integer between 1 and 20`)
	}
}

/**
 * Validates character resource fields (health, stamina, mana) - minimum 1
 * @param value - Resource value to validate
 * @param fieldName - Name of the field for error messages
 * @param isRequired - Whether the field is required
 * @throws ValidationError - When validation fails
 */
const validateCharacterResource = (value: number | undefined, fieldName: string, isRequired = false): void => {
	if (value === undefined) {
		if (isRequired) {
			throw new ValidationError(`Character ${fieldName} is required`)
		}
		return
	}

	if (!Number.isInteger(value) || value < 1) {
		throw new ValidationError(`Character ${fieldName} must be an integer of at least 1`)
	}
}

/**
 * Validates positive integer ID fields
 * @param value - ID value to validate
 * @param fieldName - Name of the field for error messages
 * @param isRequired - Whether the field is required
 * @throws ValidationError - When validation fails
 */
const validatePositiveIntegerId = (value: number | undefined, fieldName: string, isRequired = false): void => {
	if (value === undefined) {
		if (isRequired) {
			throw new ValidationError(`${fieldName} is required`)
		}
		return
	}

	if (!Number.isInteger(value) || value <= 0) {
		throw new ValidationError(`${fieldName} must be a positive integer`)
	}
}

/**
 * Prisma select object for character queries with all relations
 */
const characterSelectWithRelations = {
	id: true,
	name: true,
	surname: true,
	nickname: true,
	description: true,
	avatarPath: true,
	health: true,
	stamina: true,
	mana: true,
	strength: true,
	dexterity: true,
	constitution: true,
	intelligence: true,
	wisdom: true,
	charisma: true,
	isPublic: true,
	raceId: true,
	archetypeId: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
	race: {
		select: {
			healthModifier: true,
			staminaModifier: true,
			manaModifier: true,
			strengthModifier: true,
			dexterityModifier: true,
			constitutionModifier: true,
			intelligenceModifier: true,
			wisdomModifier: true,
			charismaModifier: true,
		},
	},
	primaryWeapon: {
		select: {
			bonusStrength: true,
			bonusDexterity: true,
			bonusConstitution: true,
			bonusIntelligence: true,
			bonusWisdom: true,
			bonusCharisma: true,
			bonusHealth: true,
		},
	},
	secondaryWeapon: {
		select: {
			bonusStrength: true,
			bonusDexterity: true,
			bonusConstitution: true,
			bonusIntelligence: true,
			bonusWisdom: true,
			bonusCharisma: true,
			bonusHealth: true,
		},
	},
	shield: {
		select: {
			bonusStrength: true,
			bonusDexterity: true,
			bonusConstitution: true,
			bonusIntelligence: true,
			bonusWisdom: true,
			bonusCharisma: true,
			bonusHealth: true,
		},
	},
	armor: {
		select: {
			bonusStrength: true,
			bonusDexterity: true,
			bonusConstitution: true,
			bonusIntelligence: true,
			bonusWisdom: true,
			bonusCharisma: true,
			bonusHealth: true,
		},
	},
	firstRing: {
		select: {
			bonusStrength: true,
			bonusDexterity: true,
			bonusConstitution: true,
			bonusIntelligence: true,
			bonusWisdom: true,
			bonusCharisma: true,
			bonusHealth: true,
		},
	},
	secondRing: {
		select: {
			bonusStrength: true,
			bonusDexterity: true,
			bonusConstitution: true,
			bonusIntelligence: true,
			bonusWisdom: true,
			bonusCharisma: true,
			bonusHealth: true,
		},
	},
	amulet: {
		select: {
			bonusStrength: true,
			bonusDexterity: true,
			bonusConstitution: true,
			bonusIntelligence: true,
			bonusWisdom: true,
			bonusCharisma: true,
			bonusHealth: true,
		},
	},
} as const

export {
	calculateAggregateStats,
	validateCharacterName,
	validateCharacterStringField,
	validateCharacterStat,
	validateCharacterResource,
	validatePositiveIntegerId,
	characterSelectWithRelations,
	type CharacterStatsInput,
	type AggregateStats,
	type ItemBonuses,
	type RaceModifiers,
}
