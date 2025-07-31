import { PrismaClient } from '@prisma/client/extension'
import bcrypt from 'bcrypt'
import ItemRarity from '../src/enums/item-rarity.enum'

const prisma = new PrismaClient()

async function main() {
	console.log('🌱 Starting seed...')

	// Clear existing data (optional - uncomment if needed)
	// await prisma.character.deleteMany({})
	// await prisma.user.deleteMany({})
	// await prisma.item.deleteMany({})
	// await prisma.skill.deleteMany({})
	// await prisma.archetype.deleteMany({})
	// await prisma.race.deleteMany({})
	// await prisma.tag.deleteMany({})

	// Create Tags
	console.log('Creating tags...')
	const tags = await Promise.all([
		prisma.tag.create({ data: { name: 'Magic' } }),
		prisma.tag.create({ data: { name: 'Combat' } }),
		prisma.tag.create({ data: { name: 'Stealth' } }),
		prisma.tag.create({ data: { name: 'Healing' } }),
		prisma.tag.create({ data: { name: 'Fire' } }),
		prisma.tag.create({ data: { name: 'Ice' } }),
		prisma.tag.create({ data: { name: 'Lightning' } }),
		prisma.tag.create({ data: { name: 'Dark' } }),
		prisma.tag.create({ data: { name: 'Light' } }),
		prisma.tag.create({ data: { name: 'Nature' } }),
		prisma.tag.create({ data: { name: 'Melee' } }),
		prisma.tag.create({ data: { name: 'Ranged' } }),
		prisma.tag.create({ data: { name: 'Defensive' } }),
		prisma.tag.create({ data: { name: 'Utility' } }),
	])

	// Create Skills
	console.log('Creating skills...')
	const skills = await Promise.all([
		prisma.skill.create({
			data: {
				name: 'Fireball',
				description: 'Launches a powerful fireball at enemies',
				tags: { connect: [{ id: tags[0].id }, { id: tags[4].id }] },
			},
		}),
		prisma.skill.create({
			data: {
				name: 'Sword Mastery',
				description: 'Increases proficiency with sword weapons',
				tags: { connect: [{ id: tags[1].id }, { id: tags[10].id }] },
			},
		}),
		prisma.skill.create({
			data: {
				name: 'Stealth',
				description: 'Become invisible to enemies for a short duration',
				tags: { connect: [{ id: tags[2].id }, { id: tags[13].id }] },
			},
		}),
		prisma.skill.create({
			data: {
				name: 'Heal',
				description: 'Restore health points to self or allies',
				tags: { connect: [{ id: tags[3].id }, { id: tags[8].id }] },
			},
		}),
		prisma.skill.create({
			data: {
				name: 'Ice Shield',
				description: 'Create a protective ice barrier',
				tags: { connect: [{ id: tags[0].id }, { id: tags[5].id }, { id: tags[12].id }] },
			},
		}),
		prisma.skill.create({
			data: {
				name: 'Lightning Bolt',
				description: 'Strike enemies with powerful lightning',
				tags: { connect: [{ id: tags[0].id }, { id: tags[6].id }] },
			},
		}),
		prisma.skill.create({
			data: {
				name: 'Archery',
				description: 'Improved accuracy and damage with bows',
				tags: { connect: [{ id: tags[1].id }, { id: tags[11].id }] },
			},
		}),
		prisma.skill.create({
			data: {
				name: "Nature's Blessing",
				description: 'Harness the power of nature for healing and growth',
				tags: { connect: [{ id: tags[0].id }, { id: tags[9].id }, { id: tags[3].id }] },
			},
		}),
	])

	// Create Races
	console.log('Creating races...')
	const races = await Promise.all([
		prisma.race.create({
			data: {
				name: 'Human',
				description: 'Versatile and adaptable beings with balanced abilities',
				healthModifier: 0,
				staminaModifier: 0,
				manaModifier: 0,
				strengthModifier: 0,
				dexterityModifier: 0,
				constitutionModifier: 0,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 2,
				skills: { connect: [{ id: skills[1].id }, { id: skills[6].id }] },
				tags: { connect: [{ id: tags[13].id }] },
			},
		}),
		prisma.race.create({
			data: {
				name: 'Elf',
				description: 'Graceful and magical beings with affinity for nature and magic',
				healthModifier: -5,
				staminaModifier: 10,
				manaModifier: 15,
				strengthModifier: -2,
				dexterityModifier: 3,
				constitutionModifier: -1,
				intelligenceModifier: 2,
				wisdomModifier: 2,
				charismaModifier: 1,
				skills: { connect: [{ id: skills[0].id }, { id: skills[6].id }, { id: skills[7].id }] },
				tags: { connect: [{ id: tags[0].id }, { id: tags[9].id }] },
			},
		}),
		prisma.race.create({
			data: {
				name: 'Dwarf',
				description: 'Hardy and resilient folk with great strength and constitution',
				healthModifier: 15,
				staminaModifier: 5,
				manaModifier: -10,
				strengthModifier: 3,
				dexterityModifier: -1,
				constitutionModifier: 4,
				intelligenceModifier: 0,
				wisdomModifier: 1,
				charismaModifier: -2,
				skills: { connect: [{ id: skills[1].id }] },
				tags: { connect: [{ id: tags[1].id }, { id: tags[12].id }] },
			},
		}),
		prisma.race.create({
			data: {
				name: 'Halfling',
				description: 'Small and nimble folk with natural luck and stealth abilities',
				healthModifier: -10,
				staminaModifier: 15,
				manaModifier: 0,
				strengthModifier: -2,
				dexterityModifier: 4,
				constitutionModifier: 1,
				intelligenceModifier: 1,
				wisdomModifier: 2,
				charismaModifier: 2,
				skills: { connect: [{ id: skills[2].id }, { id: skills[6].id }] },
				tags: { connect: [{ id: tags[2].id }, { id: tags[13].id }] },
			},
		}),
		prisma.race.create({
			data: {
				name: 'Orc',
				description: 'Powerful and fierce warriors with immense physical strength',
				healthModifier: 20,
				staminaModifier: 10,
				manaModifier: -15,
				strengthModifier: 4,
				dexterityModifier: -1,
				constitutionModifier: 3,
				intelligenceModifier: -2,
				wisdomModifier: -1,
				charismaModifier: -3,
				skills: { connect: [{ id: skills[1].id }] },
				tags: { connect: [{ id: tags[1].id }, { id: tags[10].id }] },
			},
		}),
	])

	// Create Archetypes
	console.log('Creating archetypes...')
	const archetypes = await Promise.all([
		prisma.archetype.create({
			data: {
				name: 'Warrior',
				description: 'Masters of melee combat and physical prowess',
				skills: { connect: [{ id: skills[1].id }] },
				tags: { connect: [{ id: tags[1].id }, { id: tags[10].id }] },
			},
		}),
		prisma.archetype.create({
			data: {
				name: 'Mage',
				description: 'Wielders of arcane magic and elemental forces',
				skills: { connect: [{ id: skills[0].id }, { id: skills[4].id }, { id: skills[5].id }] },
				tags: { connect: [{ id: tags[0].id }] },
			},
		}),
		prisma.archetype.create({
			data: {
				name: 'Rogue',
				description: 'Masters of stealth, agility, and precision strikes',
				skills: { connect: [{ id: skills[2].id }] },
				tags: { connect: [{ id: tags[2].id }, { id: tags[13].id }] },
			},
		}),
		prisma.archetype.create({
			data: {
				name: 'Cleric',
				description: 'Divine healers and protectors of the faithful',
				skills: { connect: [{ id: skills[3].id }] },
				tags: { connect: [{ id: tags[3].id }, { id: tags[8].id }] },
			},
		}),
		prisma.archetype.create({
			data: {
				name: 'Ranger',
				description: 'Nature-attuned warriors skilled in archery and survival',
				skills: { connect: [{ id: skills[6].id }, { id: skills[7].id }] },
				tags: { connect: [{ id: tags[9].id }, { id: tags[11].id }] },
			},
		}),
	])

	// Create Items
	console.log('Creating items...')
	const items = await Promise.all([
		// Weapons
		prisma.item.create({
			data: {
				name: 'Iron Sword',
				description: 'A sturdy iron blade for beginning warriors',
				rarity: ItemRarity.COMMON,
				isWeapon: true,
				isShield: false,
				isArmor: false,
				isAccessory: false,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
				attack: 15,
				defense: 0,
				requiredStrength: 10,
				requiredDexterity: 0,
				requiredConstitution: 0,
				requiredIntelligence: 0,
				requiredWisdom: 0,
				requiredCharisma: 0,
				bonusStrength: 2,
				bonusDexterity: 0,
				bonusConstitution: 0,
				bonusIntelligence: 0,
				bonusWisdom: 0,
				bonusCharisma: 0,
				bonusHealth: 0,
				durability: 100,
				weight: 3.5,
				tags: { connect: [{ id: tags[10].id }, { id: tags[1].id }] },
			},
		}),
		prisma.item.create({
			data: {
				name: 'Flaming Longsword',
				description: 'A magical sword imbued with the power of fire',
				rarity: ItemRarity.RARE,
				isWeapon: true,
				isShield: false,
				isArmor: false,
				isAccessory: false,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
				attack: 35,
				defense: 0,
				requiredStrength: 18,
				requiredDexterity: 0,
				requiredConstitution: 0,
				requiredIntelligence: 5,
				requiredWisdom: 0,
				requiredCharisma: 0,
				bonusStrength: 5,
				bonusDexterity: 0,
				bonusConstitution: 0,
				bonusIntelligence: 2,
				bonusWisdom: 0,
				bonusCharisma: 0,
				bonusHealth: 0,
				durability: 150,
				weight: 4.2,
				tags: { connect: [{ id: tags[10].id }, { id: tags[1].id }, { id: tags[4].id }, { id: tags[0].id }] },
			},
		}),
		prisma.item.create({
			data: {
				name: 'Elven Bow',
				description: 'A graceful bow crafted by elven artisans',
				rarity: ItemRarity.UNCOMMON,
				isWeapon: true,
				isShield: false,
				isArmor: false,
				isAccessory: false,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
				attack: 25,
				defense: 0,
				requiredStrength: 8,
				requiredDexterity: 15,
				requiredConstitution: 0,
				requiredIntelligence: 0,
				requiredWisdom: 0,
				requiredCharisma: 0,
				bonusStrength: 0,
				bonusDexterity: 4,
				bonusConstitution: 0,
				bonusIntelligence: 0,
				bonusWisdom: 2,
				bonusCharisma: 0,
				bonusHealth: 0,
				durability: 120,
				weight: 2.1,
				tags: { connect: [{ id: tags[11].id }, { id: tags[1].id }, { id: tags[9].id }] },
			},
		}),
		// Shields
		prisma.item.create({
			data: {
				name: 'Wooden Shield',
				description: 'A basic wooden shield for protection',
				rarity: ItemRarity.COMMON,
				isWeapon: false,
				isShield: true,
				isArmor: false,
				isAccessory: false,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
				attack: 0,
				defense: 8,
				requiredStrength: 5,
				requiredDexterity: 0,
				requiredConstitution: 0,
				requiredIntelligence: 0,
				requiredWisdom: 0,
				requiredCharisma: 0,
				bonusStrength: 0,
				bonusDexterity: 0,
				bonusConstitution: 1,
				bonusIntelligence: 0,
				bonusWisdom: 0,
				bonusCharisma: 0,
				bonusHealth: 5,
				durability: 80,
				weight: 2.8,
				tags: { connect: [{ id: tags[12].id }] },
			},
		}),
		prisma.item.create({
			data: {
				name: 'Tower Shield of Fortitude',
				description: 'A massive shield that provides exceptional protection',
				rarity: ItemRarity.EPIC,
				isWeapon: false,
				isShield: true,
				isArmor: false,
				isAccessory: false,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
				attack: 0,
				defense: 25,
				requiredStrength: 20,
				requiredDexterity: 0,
				requiredConstitution: 15,
				requiredIntelligence: 0,
				requiredWisdom: 0,
				requiredCharisma: 0,
				bonusStrength: 2,
				bonusDexterity: -2,
				bonusConstitution: 6,
				bonusIntelligence: 0,
				bonusWisdom: 0,
				bonusCharisma: 0,
				bonusHealth: 25,
				durability: 200,
				weight: 8.5,
				tags: { connect: [{ id: tags[12].id }] },
			},
		}),
		// Armor
		prisma.item.create({
			data: {
				name: 'Leather Armor',
				description: 'Light armor made from cured leather',
				rarity: ItemRarity.COMMON,
				isWeapon: false,
				isShield: false,
				isArmor: true,
				isAccessory: false,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
				attack: 0,
				defense: 12,
				requiredStrength: 0,
				requiredDexterity: 8,
				requiredConstitution: 0,
				requiredIntelligence: 0,
				requiredWisdom: 0,
				requiredCharisma: 0,
				bonusStrength: 0,
				bonusDexterity: 2,
				bonusConstitution: 1,
				bonusIntelligence: 0,
				bonusWisdom: 0,
				bonusCharisma: 0,
				bonusHealth: 10,
				durability: 90,
				weight: 4.2,
				tags: { connect: [{ id: tags[12].id }] },
			},
		}),
		prisma.item.create({
			data: {
				name: 'Dragon Scale Mail',
				description: 'Legendary armor crafted from ancient dragon scales',
				rarity: ItemRarity.LEGENDARY,
				isWeapon: false,
				isShield: false,
				isArmor: true,
				isAccessory: false,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
				attack: 0,
				defense: 45,
				requiredStrength: 18,
				requiredDexterity: 0,
				requiredConstitution: 16,
				requiredIntelligence: 0,
				requiredWisdom: 0,
				requiredCharisma: 0,
				bonusStrength: 3,
				bonusDexterity: 0,
				bonusConstitution: 8,
				bonusIntelligence: 0,
				bonusWisdom: 0,
				bonusCharisma: 2,
				bonusHealth: 50,
				durability: 300,
				weight: 12.0,
				tags: { connect: [{ id: tags[12].id }, { id: tags[4].id }] },
			},
		}),
		// Accessories
		prisma.item.create({
			data: {
				name: 'Ring of Power',
				description: 'A mystical ring that enhances magical abilities',
				rarity: ItemRarity.RARE,
				isWeapon: false,
				isShield: false,
				isArmor: false,
				isAccessory: true,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
				attack: 0,
				defense: 0,
				requiredStrength: 0,
				requiredDexterity: 0,
				requiredConstitution: 0,
				requiredIntelligence: 12,
				requiredWisdom: 8,
				requiredCharisma: 0,
				bonusStrength: 0,
				bonusDexterity: 0,
				bonusConstitution: 0,
				bonusIntelligence: 5,
				bonusWisdom: 3,
				bonusCharisma: 0,
				bonusHealth: 0,
				durability: 500,
				weight: 0.1,
				tags: { connect: [{ id: tags[0].id }] },
			},
		}),
		prisma.item.create({
			data: {
				name: 'Amulet of Health',
				description: 'A protective amulet that boosts vitality',
				rarity: ItemRarity.UNCOMMON,
				isWeapon: false,
				isShield: false,
				isArmor: false,
				isAccessory: true,
				isConsumable: false,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
				attack: 0,
				defense: 0,
				requiredStrength: 0,
				requiredDexterity: 0,
				requiredConstitution: 8,
				requiredIntelligence: 0,
				requiredWisdom: 0,
				requiredCharisma: 0,
				bonusStrength: 0,
				bonusDexterity: 0,
				bonusConstitution: 4,
				bonusIntelligence: 0,
				bonusWisdom: 0,
				bonusCharisma: 0,
				bonusHealth: 20,
				durability: 200,
				weight: 0.3,
				tags: { connect: [{ id: tags[3].id }] },
			},
		}),
		// Consumables
		prisma.item.create({
			data: {
				name: 'Health Potion',
				description: 'A red potion that restores health when consumed',
				rarity: ItemRarity.COMMON,
				isWeapon: false,
				isShield: false,
				isArmor: false,
				isAccessory: false,
				isConsumable: true,
				isQuestItem: false,
				isCraftingMaterial: false,
				isMiscellaneous: false,
				attack: 0,
				defense: 0,
				requiredStrength: 0,
				requiredDexterity: 0,
				requiredConstitution: 0,
				requiredIntelligence: 0,
				requiredWisdom: 0,
				requiredCharisma: 0,
				bonusStrength: 0,
				bonusDexterity: 0,
				bonusConstitution: 0,
				bonusIntelligence: 0,
				bonusWisdom: 0,
				bonusCharisma: 0,
				bonusHealth: 50,
				durability: 1,
				weight: 0.2,
				tags: { connect: [{ id: tags[3].id }] },
			},
		}),
	])

	// Create Users
	console.log('Creating users...')
	const hashedPassword = await bcrypt.hash('password123', 10)

	const users = await Promise.all([
		prisma.user.create({
			data: {
				name: 'Mario Rossi',
				email: 'mario.rossi@example.com',
				password: hashedPassword,
				isVerified: true,
				lastLoginAt: new Date(),
			},
		}),
		prisma.user.create({
			data: {
				name: 'Lucia Verdi',
				email: 'lucia.verdi@example.com',
				googleId: 'google_123456789',
				isVerified: true,
				lastLoginAt: new Date(Date.now() - 86400000), // Yesterday
			},
		}),
		prisma.user.create({
			data: {
				name: 'Giovanni Bianchi',
				email: 'giovanni.bianchi@example.com',
				githubId: 'github_987654321',
				isVerified: true,
				lastLoginAt: new Date(Date.now() - 172800000), // 2 days ago
			},
		}),
		prisma.user.create({
			data: {
				name: 'Anna Neri',
				email: 'anna.neri@example.com',
				discordId: 'discord_555666777',
				isVerified: false,
			},
		}),
	])

	// Create Characters
	console.log('Creating characters...')
	await Promise.all([
		prisma.character.create({
			data: {
				name: 'Aragorn',
				surname: 'Strider',
				nickname: 'The Ranger',
				description: 'A skilled ranger and future king, master of sword and bow',
				health: 120,
				stamina: 100,
				mana: 40,
				strength: 18,
				dexterity: 16,
				constitution: 17,
				intelligence: 14,
				wisdom: 15,
				charisma: 16,
				raceId: races[0].id, // Human
				archetypeId: archetypes[4].id, // Ranger
				userId: users[0].id,
				primaryWeaponId: items[0].id, // Iron Sword
				secondaryWeaponId: items[2].id, // Elven Bow
				shieldId: items[3].id, // Wooden Shield
				armorId: items[5].id, // Leather Armor
				firstRingId: items[7].id, // Ring of Power
				amuletId: items[8].id, // Amulet of Health
				items: { connect: [{ id: items[9].id }] }, // Health Potion
				tags: { connect: [{ id: tags[1].id }, { id: tags[11].id }] },
				isPublic: true,
			},
		}),
		prisma.character.create({
			data: {
				name: 'Gandalf',
				surname: 'the Grey',
				description: 'A powerful wizard with mastery over fire and light magic',
				health: 80,
				stamina: 60,
				mana: 150,
				strength: 12,
				dexterity: 14,
				constitution: 15,
				intelligence: 20,
				wisdom: 19,
				charisma: 18,
				raceId: races[0].id, // Human (wizard)
				archetypeId: archetypes[1].id, // Mage
				userId: users[1].id,
				armorId: items[5].id, // Leather Armor
				firstRingId: items[7].id, // Ring of Power
				items: { connect: [{ id: items[9].id }] }, // Health Potion
				tags: { connect: [{ id: tags[0].id }, { id: tags[4].id }, { id: tags[8].id }] },
				isPublic: true,
			},
		}),
		prisma.character.create({
			data: {
				name: 'Legolas',
				description: 'An elven archer with unmatched skill with the bow',
				health: 95,
				stamina: 110,
				mana: 65,
				strength: 14,
				dexterity: 20,
				constitution: 16,
				intelligence: 16,
				wisdom: 17,
				charisma: 17,
				raceId: races[1].id, // Elf
				archetypeId: archetypes[4].id, // Ranger
				userId: users[1].id,
				primaryWeaponId: items[2].id, // Elven Bow
				armorId: items[5].id, // Leather Armor
				amuletId: items[8].id, // Amulet of Health
				items: { connect: [{ id: items[9].id }] }, // Health Potion
				tags: { connect: [{ id: tags[11].id }, { id: tags[9].id }] },
				isPublic: true,
			},
		}),
		prisma.character.create({
			data: {
				name: 'Gimli',
				description: 'A dwarven warrior with incredible strength and resilience',
				health: 135,
				stamina: 105,
				mana: 25,
				strength: 20,
				dexterity: 13,
				constitution: 19,
				intelligence: 14,
				wisdom: 15,
				charisma: 12,
				raceId: races[2].id, // Dwarf
				archetypeId: archetypes[0].id, // Warrior
				userId: users[2].id,
				primaryWeaponId: items[0].id, // Iron Sword
				shieldId: items[4].id, // Tower Shield of Fortitude
				armorId: items[6].id, // Dragon Scale Mail
				items: { connect: [{ id: items[9].id }] }, // Health Potion
				tags: { connect: [{ id: tags[1].id }, { id: tags[12].id }] },
				isPublic: true,
			},
		}),
		prisma.character.create({
			data: {
				name: 'Frodo',
				surname: 'Baggins',
				description: 'A brave halfling with a heart full of courage',
				health: 70,
				stamina: 95,
				mana: 30,
				strength: 10,
				dexterity: 16,
				constitution: 14,
				intelligence: 15,
				wisdom: 16,
				charisma: 16,
				raceId: races[3].id, // Halfling
				archetypeId: archetypes[2].id, // Rogue
				userId: users[2].id,
				armorId: items[5].id, // Leather Armor
				firstRingId: items[7].id, // Ring of Power (The One Ring!)
				items: { connect: [{ id: items[9].id }] }, // Health Potion
				tags: { connect: [{ id: tags[2].id }, { id: tags[13].id }] },
				isPublic: true, // Private character
			},
		}),
		prisma.character.create({
			data: {
				name: 'Elara',
				surname: 'Lightbringer',
				description: 'A devoted cleric spreading light and healing',
				health: 100,
				stamina: 80,
				mana: 120,
				strength: 14,
				dexterity: 12,
				constitution: 16,
				intelligence: 16,
				wisdom: 18,
				charisma: 17,
				raceId: races[0].id, // Human
				archetypeId: archetypes[3].id, // Cleric
				userId: users[3].id,
				primaryWeaponId: items[0].id, // Iron Sword
				armorId: items[5].id, // Leather Armor
				items: { connect: [{ id: items[9].id }] }, // Health Potion
				tags: { connect: [{ id: tags[3].id }, { id: tags[13].id }] },
				isPublic: false,
			},
		}),
	])
	console.log('🌱 Seed completed successfully!')
}
main().catch((e) => {
	console.error(e)
	process.exit(1)
})
