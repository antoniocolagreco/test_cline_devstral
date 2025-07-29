import type { Skill } from '@prisma/client'

export default interface Archetype {
    id: number
    name: string
    description?: string
    skills: Skill[]
}
