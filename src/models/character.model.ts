import type Archetype from './archetype.model.js'
import type Author from './author.model.js'
import type Item from './item.model.js'
import type Race from './race.model.js'

export default interface Character {
    id: number

    name: string
    surname?: string
    nickname?: string
    description?: string

    avatar?: string

    health: number
    mana: number

    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number

    race: Race
    archetype: Archetype

    items?: Item[]

    primaryWeapon?: Item
    secondaryWeapon?: Item
    shield?: Item
    armor?: Item
    firstRing?: Item
    secondRing?: Item
    amulet?: Item

    author: Author

    isPublic: boolean
    createdAt: Date
    updatedAt: Date
}
