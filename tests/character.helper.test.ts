import ValidationError from '../src/errors/validation.error.js'
import {
	calculateAggregateStats,
	validateCharacterName,
	validateCharacterStringField,
	validateCharacterStat,
	validateCharacterResource,
	validatePositiveIntegerId,
	type CharacterStatsInput,
} from '../src/helpers/character.helper.js'

describe('Character Helper', () => {
	describe('calculateAggregateStats', () => {
		const baseCharacter: CharacterStatsInput = {
			health: 100,
			stamina: 80,
			mana: 50,
			strength: 15,
			dexterity: 12,
			constitution: 14,
			intelligence: 10,
			wisdom: 11,
			charisma: 13,
			race: {
				healthModifier: 10,
				staminaModifier: 5,
				manaModifier: 0,
				strengthModifier: 2,
				dexterityModifier: 1,
				constitutionModifier: 2,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 1,
			},
		}

		it('should calculate aggregate stats without equipment', () => {
			const result = calculateAggregateStats(baseCharacter)

			expect(result).toEqual({
				aggregateHealth: 110, // 100 + 10
				aggregateStamina: 85, // 80 + 5
				aggregateMana: 50, // 50 + 0
				aggregateStrength: 17, // 15 + 2
				aggregateDexterity: 13, // 12 + 1
				aggregateConstitution: 16, // 14 + 2
				aggregateIntelligence: 10, // 10 + 0
				aggregateWisdom: 11, // 11 + 0
				aggregateCharisma: 14, // 13 + 1
			})
		})

		it('should calculate aggregate stats with primary weapon', () => {
			const characterWithWeapon = {
				...baseCharacter,
				primaryWeapon: {
					bonusStrength: 3,
					bonusDexterity: 1,
					bonusConstitution: 0,
					bonusIntelligence: 0,
					bonusWisdom: 0,
					bonusCharisma: 0,
					bonusHealth: 5,
				},
			}

			const result = calculateAggregateStats(characterWithWeapon)

			expect(result).toEqual({
				aggregateHealth: 115, // 100 + 10 + 5
				aggregateStamina: 85, // 80 + 5 (no stamina bonus from items)
				aggregateMana: 50, // 50 + 0 (no mana bonus from items)
				aggregateStrength: 20, // 15 + 2 + 3
				aggregateDexterity: 14, // 12 + 1 + 1
				aggregateConstitution: 16, // 14 + 2 + 0
				aggregateIntelligence: 10, // 10 + 0 + 0
				aggregateWisdom: 11, // 11 + 0 + 0
				aggregateCharisma: 14, // 13 + 1 + 0
			})
		})

		it('should calculate aggregate stats with multiple equipment pieces', () => {
			const characterWithMultipleItems = {
				...baseCharacter,
				primaryWeapon: {
					bonusStrength: 3,
					bonusDexterity: 1,
					bonusConstitution: 0,
					bonusIntelligence: 0,
					bonusWisdom: 0,
					bonusCharisma: 0,
					bonusHealth: 5,
				},
				armor: {
					bonusStrength: 0,
					bonusDexterity: 0,
					bonusConstitution: 2,
					bonusIntelligence: 0,
					bonusWisdom: 0,
					bonusCharisma: 0,
					bonusHealth: 10,
				},
				firstRing: {
					bonusStrength: 1,
					bonusDexterity: 1,
					bonusConstitution: 1,
					bonusIntelligence: 1,
					bonusWisdom: 1,
					bonusCharisma: 1,
					bonusHealth: 0,
				},
			}

			const result = calculateAggregateStats(characterWithMultipleItems)

			expect(result).toEqual({
				aggregateHealth: 125, // 100 + 10 + 5 + 10 + 0
				aggregateStamina: 85, // 80 + 5
				aggregateMana: 50, // 50 + 0
				aggregateStrength: 21, // 15 + 2 + 3 + 0 + 1
				aggregateDexterity: 15, // 12 + 1 + 1 + 0 + 1
				aggregateConstitution: 19, // 14 + 2 + 0 + 2 + 1
				aggregateIntelligence: 11, // 10 + 0 + 0 + 0 + 1
				aggregateWisdom: 12, // 11 + 0 + 0 + 0 + 1
				aggregateCharisma: 15, // 13 + 1 + 0 + 0 + 1
			})
		})

		it('should handle null equipment slots', () => {
			const characterWithNullItems = {
				...baseCharacter,
				primaryWeapon: null,
				secondaryWeapon: null,
				shield: null,
				armor: null,
				firstRing: null,
				secondRing: null,
				amulet: null,
			}

			const result = calculateAggregateStats(characterWithNullItems)

			expect(result).toEqual({
				aggregateHealth: 110, // 100 + 10
				aggregateStamina: 85, // 80 + 5
				aggregateMana: 50, // 50 + 0
				aggregateStrength: 17, // 15 + 2
				aggregateDexterity: 13, // 12 + 1
				aggregateConstitution: 16, // 14 + 2
				aggregateIntelligence: 10, // 10 + 0
				aggregateWisdom: 11, // 11 + 0
				aggregateCharisma: 14, // 13 + 1
			})
		})

		it('should calculate with all equipment slots filled', () => {
			const itemBonuses = {
				bonusStrength: 1,
				bonusDexterity: 1,
				bonusConstitution: 1,
				bonusIntelligence: 1,
				bonusWisdom: 1,
				bonusCharisma: 1,
				bonusHealth: 2,
			}

			const characterWithAllItems = {
				...baseCharacter,
				primaryWeapon: itemBonuses,
				secondaryWeapon: itemBonuses,
				shield: itemBonuses,
				armor: itemBonuses,
				firstRing: itemBonuses,
				secondRing: itemBonuses,
				amulet: itemBonuses,
			}

			const result = calculateAggregateStats(characterWithAllItems)

			expect(result).toEqual({
				aggregateHealth: 124, // 100 + 10 + (7 * 2)
				aggregateStamina: 85, // 80 + 5
				aggregateMana: 50, // 50 + 0
				aggregateStrength: 24, // 15 + 2 + (7 * 1)
				aggregateDexterity: 20, // 12 + 1 + (7 * 1)
				aggregateConstitution: 23, // 14 + 2 + (7 * 1)
				aggregateIntelligence: 17, // 10 + 0 + (7 * 1)
				aggregateWisdom: 18, // 11 + 0 + (7 * 1)
				aggregateCharisma: 21, // 13 + 1 + (7 * 1)
			})
		})
	})

	describe('validateCharacterName', () => {
		it('should return undefined when name is undefined and not required', () => {
			const result = validateCharacterName(undefined, false)
			expect(result).toBeUndefined()
		})

		it('should throw ValidationError when name is undefined and required', () => {
			expect(() => validateCharacterName(undefined, true)).toThrow(ValidationError)
			expect(() => validateCharacterName(undefined, true)).toThrow(
				'Character name is required and must be a string',
			)
		})

		it('should throw ValidationError when name is not a string', () => {
			expect(() => validateCharacterName(123 as any)).toThrow(ValidationError)
			expect(() => validateCharacterName(123 as any)).toThrow('Character name must be a string')
		})

		it('should throw ValidationError when name is empty after trimming', () => {
			expect(() => validateCharacterName('   ')).toThrow(ValidationError)
			expect(() => validateCharacterName('   ')).toThrow('Character name cannot be empty')
		})

		it('should throw ValidationError when name exceeds 50 characters', () => {
			const longName = 'a'.repeat(51)
			expect(() => validateCharacterName(longName)).toThrow(ValidationError)
			expect(() => validateCharacterName(longName)).toThrow('Character name cannot exceed 50 characters')
		})

		it('should return trimmed name when valid', () => {
			const result = validateCharacterName('  Valid Name  ')
			expect(result).toBe('Valid Name')
		})

		it('should return trimmed name when exactly 50 characters', () => {
			const exactLengthName = 'a'.repeat(50)
			const result = validateCharacterName(exactLengthName)
			expect(result).toBe(exactLengthName)
		})
	})

	describe('validateCharacterStringField', () => {
		it('should return undefined when value is undefined', () => {
			const result = validateCharacterStringField(undefined, 'surname', 50)
			expect(result).toBeUndefined()
		})

		it('should throw ValidationError when value is not a string', () => {
			expect(() => validateCharacterStringField(123 as any, 'surname', 50)).toThrow(ValidationError)
			expect(() => validateCharacterStringField(123 as any, 'surname', 50)).toThrow(
				'Character surname must be a string',
			)
		})

		it('should throw ValidationError when value exceeds max length', () => {
			const longValue = 'a'.repeat(51)
			expect(() => validateCharacterStringField(longValue, 'surname', 50)).toThrow(ValidationError)
			expect(() => validateCharacterStringField(longValue, 'surname', 50)).toThrow(
				'Character surname cannot exceed 50 characters',
			)
		})

		it('should return null when value is empty after trimming', () => {
			const result = validateCharacterStringField('   ', 'surname', 50)
			expect(result).toBeNull()
		})

		it('should return trimmed value when valid', () => {
			const result = validateCharacterStringField('  Valid Value  ', 'surname', 50)
			expect(result).toBe('Valid Value')
		})

		it('should return trimmed value when exactly at max length', () => {
			const exactLengthValue = 'a'.repeat(50)
			const result = validateCharacterStringField(exactLengthValue, 'surname', 50)
			expect(result).toBe(exactLengthValue)
		})
	})

	describe('validateCharacterStat', () => {
		it('should not throw when value is undefined and not required', () => {
			expect(() => validateCharacterStat(undefined, 'strength', false)).not.toThrow()
		})

		it('should throw ValidationError when value is undefined and required', () => {
			expect(() => validateCharacterStat(undefined, 'strength', true)).toThrow(ValidationError)
			expect(() => validateCharacterStat(undefined, 'strength', true)).toThrow('Character strength is required')
		})

		it('should throw ValidationError when value is not an integer', () => {
			expect(() => validateCharacterStat(15.5, 'strength')).toThrow(ValidationError)
			expect(() => validateCharacterStat(15.5, 'strength')).toThrow(
				'Character strength must be an integer between 1 and 20',
			)
		})

		it('should throw ValidationError when value is less than 1', () => {
			expect(() => validateCharacterStat(0, 'strength')).toThrow(ValidationError)
			expect(() => validateCharacterStat(0, 'strength')).toThrow(
				'Character strength must be an integer between 1 and 20',
			)
		})

		it('should throw ValidationError when value is greater than 20', () => {
			expect(() => validateCharacterStat(21, 'strength')).toThrow(ValidationError)
			expect(() => validateCharacterStat(21, 'strength')).toThrow(
				'Character strength must be an integer between 1 and 20',
			)
		})

		it('should not throw when value is valid (1)', () => {
			expect(() => validateCharacterStat(1, 'strength')).not.toThrow()
		})

		it('should not throw when value is valid (20)', () => {
			expect(() => validateCharacterStat(20, 'strength')).not.toThrow()
		})

		it('should not throw when value is valid (middle range)', () => {
			expect(() => validateCharacterStat(15, 'strength')).not.toThrow()
		})
	})

	describe('validateCharacterResource', () => {
		it('should not throw when value is undefined and not required', () => {
			expect(() => validateCharacterResource(undefined, 'health', false)).not.toThrow()
		})

		it('should throw ValidationError when value is undefined and required', () => {
			expect(() => validateCharacterResource(undefined, 'health', true)).toThrow(ValidationError)
			expect(() => validateCharacterResource(undefined, 'health', true)).toThrow('Character health is required')
		})

		it('should throw ValidationError when value is not an integer', () => {
			expect(() => validateCharacterResource(100.5, 'health')).toThrow(ValidationError)
			expect(() => validateCharacterResource(100.5, 'health')).toThrow(
				'Character health must be an integer of at least 1',
			)
		})

		it('should throw ValidationError when value is less than 1', () => {
			expect(() => validateCharacterResource(0, 'health')).toThrow(ValidationError)
			expect(() => validateCharacterResource(0, 'health')).toThrow(
				'Character health must be an integer of at least 1',
			)

			expect(() => validateCharacterResource(-5, 'health')).toThrow(ValidationError)
		})

		it('should not throw when value is valid (1)', () => {
			expect(() => validateCharacterResource(1, 'health')).not.toThrow()
		})

		it('should not throw when value is valid (large number)', () => {
			expect(() => validateCharacterResource(1000, 'health')).not.toThrow()
		})
	})

	describe('validatePositiveIntegerId', () => {
		it('should not throw when value is undefined and not required', () => {
			expect(() => validatePositiveIntegerId(undefined, 'User ID', false)).not.toThrow()
		})

		it('should throw ValidationError when value is undefined and required', () => {
			expect(() => validatePositiveIntegerId(undefined, 'User ID', true)).toThrow(ValidationError)
			expect(() => validatePositiveIntegerId(undefined, 'User ID', true)).toThrow('User ID is required')
		})

		it('should throw ValidationError when value is not an integer', () => {
			expect(() => validatePositiveIntegerId(1.5, 'User ID')).toThrow(ValidationError)
			expect(() => validatePositiveIntegerId(1.5, 'User ID')).toThrow('User ID must be a positive integer')
		})

		it('should throw ValidationError when value is zero', () => {
			expect(() => validatePositiveIntegerId(0, 'User ID')).toThrow(ValidationError)
			expect(() => validatePositiveIntegerId(0, 'User ID')).toThrow('User ID must be a positive integer')
		})

		it('should throw ValidationError when value is negative', () => {
			expect(() => validatePositiveIntegerId(-1, 'User ID')).toThrow(ValidationError)
			expect(() => validatePositiveIntegerId(-1, 'User ID')).toThrow('User ID must be a positive integer')
		})

		it('should not throw when value is valid positive integer', () => {
			expect(() => validatePositiveIntegerId(1, 'User ID')).not.toThrow()
			expect(() => validatePositiveIntegerId(100, 'User ID')).not.toThrow()
		})
	})
})
