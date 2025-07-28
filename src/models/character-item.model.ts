import type { ItemRarity, ItemType } from '../constants/constants'

export default interface CharacterItem {
    id: number
    name: string
    description?: string
    type: ItemType
    rarity: ItemRarity
    attack: number
    defense: number
    durability: number
    weight: number
}
