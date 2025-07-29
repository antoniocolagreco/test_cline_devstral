import type { ItemRarity } from '../constants/constants'

export default interface Item {
    id: number
    name: string
    description?: string
    tags?: string[]

    rarity: ItemRarity

    weapon: boolean
    armor: boolean
    accessory: boolean
    consumable: boolean

    attack: number
    defense: number

    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number

    durability: number
    weight: number
}
