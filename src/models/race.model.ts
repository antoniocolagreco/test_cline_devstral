import type Skill from './skill'

export default interface Race {
    id: number
    name: string
    description?: string

    skills: Skill[]

    healthModifier: number
    manaModifier: number

    strengthModifier: number
    dexterityModifier: number
    constitutionModifier: number
    intelligenceModifier: number
    wisdomModifier: number
    charismaModifier: number
}
