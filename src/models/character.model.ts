import type CharacterAuthor from './character-author'
import type CharacterClass from './character-class.model'
import type CharacterItem from './character-item.model'
import type CharacterRace from './character-race.model'
import type CharacterSkill from './character-skill'

export default interface Character {
    id: number
    name: string
    surname?: string
    nickname?: string
    description?: string
    health: number
    mana: number
    race: CharacterRace
    class: CharacterClass
    skills: CharacterSkill[]
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
    weapon?: CharacterItem
    armor?: CharacterItem
    accessories?: CharacterItem[]
    author: CharacterAuthor
    isPublic: boolean
    createdAt: Date
    updatedAt: Date
}
