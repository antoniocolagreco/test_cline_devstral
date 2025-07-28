-- CreateTable
CREATE TABLE "Character" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "surname" TEXT,
    "nickname" TEXT,
    "description" TEXT,
    "health" INTEGER NOT NULL,
    "mana" INTEGER NOT NULL,
    "raceId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL,
    "dexterity" INTEGER NOT NULL,
    "constitution" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "wisdom" INTEGER NOT NULL,
    "charisma" INTEGER NOT NULL,
    "weaponId" INTEGER,
    "armor" TEXT,
    "accessories" TEXT,
    "authorId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "CharacterRace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Character_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CharacterClass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Character_weaponId_fkey" FOREIGN KEY ("weaponId") REFERENCES "CharacterItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Character_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Author" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterClass" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "durability" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterRace" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterSkill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CharacterToCharacterSkill" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CharacterToCharacterSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterToCharacterSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "CharacterSkill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToCharacterSkill_AB_unique" ON "_CharacterToCharacterSkill"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToCharacterSkill_B_index" ON "_CharacterToCharacterSkill"("B");
