import { PrismaClient, Character } from '@prisma/client'

const prisma = new PrismaClient()

export async function getAllCharacters(): Promise<Character[]> {
    return prisma.character.findMany()
}

export async function getCharacterById(id: number): Promise<Character | null> {
    return prisma.character.findUnique({ where: { id } })
}

export async function createCharacter(data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character> {
    return prisma.character.create({ data })
}

export async function updateCharacter(id: number, data: Partial<Character>): Promise<Character | null> {
    return prisma.character.update({ where: { id }, data })
}

export async function deleteCharacter(id: number): Promise<void> {
    await prisma.character.delete({ where: { id } })
}
