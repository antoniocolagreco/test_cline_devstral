import { transformCharacterFromPrisma, type CharacterFromPrisma } from '../src/helpers/character-transform.helper.js'

// Mock the character.helper module
jest.mock('../src/helpers/character.helper.js', () => ({
	calculateAggregateStats: jest.fn(() => ({
		aggregateHealth: 120,
		aggregateStamina: 85,
		aggregateMana: 50,
		aggregateStrength: 18,
		aggregateDexterity: 14,
		aggregateConstitution: 17,
		aggregateIntelligence: 11,
		aggregateWisdom: 12,
		aggregateCharisma: 15,
	})),
}))

describe('Character Transform Helper', () => {
	describe('transformCharacterFromPrisma', () => {
		const mockCharacterFromPrisma: CharacterFromPrisma = {
			id: 1,
			name: 'Test Warrior',
			surname: 'Brave',
			nickname: 'Hero',
			description: 'A brave warrior character',
			avatarPath: '/avatars/warrior.png',
			health: 100,
			stamina: 80,
			mana: 50,
			strength: 15,
			dexterity: 12,
			constitution: 14,
			intelligence: 10,
			wisdom: 11,
			charisma: 13,
			isPublic: true,
			raceId: 1,
			archetypeId: 2,
			userId: 3,
			createdAt: new Date('2023-01-01T10:00:00.000Z'),
			updatedAt: new Date('2023-01-02T15:30:00.000Z'),
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
			primaryWeapon: {
				bonusStrength: 3,
				bonusDexterity: 1,
				bonusConstitution: 0,
				bonusIntelligence: 0,
				bonusWisdom: 0,
				bonusCharisma: 0,
				bonusHealth: 5,
			},
			secondaryWeapon: null,
			shield: null,
			armor: null,
			firstRing: null,
			secondRing: null,
			amulet: null,
		}

		it('should transform character with all fields present', () => {
			const result = transformCharacterFromPrisma(mockCharacterFromPrisma)

			expect(result).toEqual({
				id: 1,
				name: 'Test Warrior',
				surname: 'Brave',
				nickname: 'Hero',
				description: 'A brave warrior character',
				avatarPath: '/avatars/warrior.png',
				health: 100,
				stamina: 80,
				mana: 50,
				strength: 15,
				dexterity: 12,
				constitution: 14,
				intelligence: 10,
				wisdom: 11,
				charisma: 13,
				aggregateHealth: 120,
				aggregateStamina: 85,
				aggregateMana: 50,
				aggregateStrength: 18,
				aggregateDexterity: 14,
				aggregateConstitution: 17,
				aggregateIntelligence: 11,
				aggregateWisdom: 12,
				aggregateCharisma: 15,
				isPublic: true,
				raceId: 1,
				archetypeId: 2,
				userId: 3,
				createdAt: '2023-01-01T10:00:00.000Z',
				updatedAt: '2023-01-02T15:30:00.000Z',
			})
		})

		it('should transform character with null optional fields to undefined', () => {
			const characterWithNulls: CharacterFromPrisma = {
				...mockCharacterFromPrisma,
				surname: null,
				nickname: null,
				description: null,
				avatarPath: null,
			}

			const result = transformCharacterFromPrisma(characterWithNulls)

			expect(result).toEqual({
				id: 1,
				name: 'Test Warrior',
				surname: undefined,
				nickname: undefined,
				description: undefined,
				avatarPath: undefined,
				health: 100,
				stamina: 80,
				mana: 50,
				strength: 15,
				dexterity: 12,
				constitution: 14,
				intelligence: 10,
				wisdom: 11,
				charisma: 13,
				aggregateHealth: 120,
				aggregateStamina: 85,
				aggregateMana: 50,
				aggregateStrength: 18,
				aggregateDexterity: 14,
				aggregateConstitution: 17,
				aggregateIntelligence: 11,
				aggregateWisdom: 12,
				aggregateCharisma: 15,
				isPublic: true,
				raceId: 1,
				archetypeId: 2,
				userId: 3,
				createdAt: '2023-01-01T10:00:00.000Z',
				updatedAt: '2023-01-02T15:30:00.000Z',
			})
		})

		it('should transform character with all equipment slots filled', () => {
			const equipmentBonuses = {
				bonusStrength: 1,
				bonusDexterity: 1,
				bonusConstitution: 1,
				bonusIntelligence: 1,
				bonusWisdom: 1,
				bonusCharisma: 1,
				bonusHealth: 2,
			}

			const characterWithAllEquipment: CharacterFromPrisma = {
				...mockCharacterFromPrisma,
				primaryWeapon: equipmentBonuses,
				secondaryWeapon: equipmentBonuses,
				shield: equipmentBonuses,
				armor: equipmentBonuses,
				firstRing: equipmentBonuses,
				secondRing: equipmentBonuses,
				amulet: equipmentBonuses,
			}

			const result = transformCharacterFromPrisma(characterWithAllEquipment)

			// Should include aggregate stats calculated by the mocked function
			expect(result).toEqual(
				expect.objectContaining({
					id: 1,
					name: 'Test Warrior',
					aggregateHealth: 120,
					aggregateStamina: 85,
					aggregateMana: 50,
					aggregateStrength: 18,
					aggregateDexterity: 14,
					aggregateConstitution: 17,
					aggregateIntelligence: 11,
					aggregateWisdom: 12,
					aggregateCharisma: 15,
				}),
			)
		})

		it('should transform character with different date formats', () => {
			const characterWithDifferentDates: CharacterFromPrisma = {
				...mockCharacterFromPrisma,
				createdAt: new Date('2024-12-25T00:00:00.000Z'),
				updatedAt: new Date('2024-12-31T23:59:59.999Z'),
			}

			const result = transformCharacterFromPrisma(characterWithDifferentDates)

			expect(result.createdAt).toBe('2024-12-25T00:00:00.000Z')
			expect(result.updatedAt).toBe('2024-12-31T23:59:59.999Z')
		})

		it('should transform character with isPublic false', () => {
			const privateCharacter: CharacterFromPrisma = {
				...mockCharacterFromPrisma,
				isPublic: false,
			}

			const result = transformCharacterFromPrisma(privateCharacter)

			expect(result.isPublic).toBe(false)
		})

		it('should transform character with empty string fields', () => {
			const characterWithEmptyStrings: CharacterFromPrisma = {
				...mockCharacterFromPrisma,
				surname: '',
				nickname: '',
				description: '',
				avatarPath: '',
			}

			const result = transformCharacterFromPrisma(characterWithEmptyStrings)

			// Empty strings should be converted to undefined
			expect(result.surname).toBeUndefined()
			expect(result.nickname).toBeUndefined()
			expect(result.description).toBeUndefined()
			expect(result.avatarPath).toBeUndefined()
		})

		it('should transform character with minimum stat values', () => {
			const characterWithMinStats: CharacterFromPrisma = {
				...mockCharacterFromPrisma,
				health: 1,
				stamina: 1,
				mana: 1,
				strength: 1,
				dexterity: 1,
				constitution: 1,
				intelligence: 1,
				wisdom: 1,
				charisma: 1,
			}

			const result = transformCharacterFromPrisma(characterWithMinStats)

			expect(result.health).toBe(1)
			expect(result.stamina).toBe(1)
			expect(result.mana).toBe(1)
			expect(result.strength).toBe(1)
			expect(result.dexterity).toBe(1)
			expect(result.constitution).toBe(1)
			expect(result.intelligence).toBe(1)
			expect(result.wisdom).toBe(1)
			expect(result.charisma).toBe(1)
		})

		it('should transform character with maximum stat values', () => {
			const characterWithMaxStats: CharacterFromPrisma = {
				...mockCharacterFromPrisma,
				health: 999,
				stamina: 999,
				mana: 999,
				strength: 20,
				dexterity: 20,
				constitution: 20,
				intelligence: 20,
				wisdom: 20,
				charisma: 20,
			}

			const result = transformCharacterFromPrisma(characterWithMaxStats)

			expect(result.health).toBe(999)
			expect(result.stamina).toBe(999)
			expect(result.mana).toBe(999)
			expect(result.strength).toBe(20)
			expect(result.dexterity).toBe(20)
			expect(result.constitution).toBe(20)
			expect(result.intelligence).toBe(20)
			expect(result.wisdom).toBe(20)
			expect(result.charisma).toBe(20)
		})

		it('should pass correct character stats to calculateAggregateStats', () => {
			const { calculateAggregateStats } = jest.requireMock('../src/helpers/character.helper.js')

			transformCharacterFromPrisma(mockCharacterFromPrisma)

			expect(calculateAggregateStats).toHaveBeenCalledWith({
				health: 100,
				stamina: 80,
				mana: 50,
				strength: 15,
				dexterity: 12,
				constitution: 14,
				intelligence: 10,
				wisdom: 11,
				charisma: 13,
				race: mockCharacterFromPrisma.race,
				primaryWeapon: mockCharacterFromPrisma.primaryWeapon,
				secondaryWeapon: mockCharacterFromPrisma.secondaryWeapon,
				shield: mockCharacterFromPrisma.shield,
				armor: mockCharacterFromPrisma.armor,
				firstRing: mockCharacterFromPrisma.firstRing,
				secondRing: mockCharacterFromPrisma.secondRing,
				amulet: mockCharacterFromPrisma.amulet,
			})
		})
	})
})
