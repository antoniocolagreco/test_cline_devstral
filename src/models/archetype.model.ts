import type Skill from './skill'

export default interface Archetype {
    id: number
    name: string
    description?: string
    skills: Skill[]
}
