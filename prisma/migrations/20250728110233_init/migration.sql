/*
  Warnings:

  - You are about to drop the `Author` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `armor` on the `Character` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Author";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CharacterAuthor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "surname" TEXT,
    "nickname" TEXT,
    "description" TEXT,
    "health" INTEGER NOT NULL,
    "mana" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL,
    "dexterity" INTEGER NOT NULL,
    "constitution" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "wisdom" INTEGER NOT NULL,
    "charisma" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "raceId" INTEGER NOT NULL,
    "weaponId" INTEGER,
    "armorId" INTEGER,
    "accessories" TEXT,
    CONSTRAINT "Character_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "CharacterAuthor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Character_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CharacterClass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Character_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "CharacterRace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Character_weaponId_fkey" FOREIGN KEY ("weaponId") REFERENCES "CharacterItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Character_armorId_fkey" FOREIGN KEY ("armorId") REFERENCES "CharacterItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("accessories", "authorId", "charisma", "classId", "constitution", "createdAt", "description", "dexterity", "health", "id", "intelligence", "isPublic", "mana", "name", "nickname", "raceId", "strength", "surname", "updatedAt", "weaponId", "wisdom") SELECT "accessories", "authorId", "charisma", "classId", "constitution", "createdAt", "description", "dexterity", "health", "id", "intelligence", "isPublic", "mana", "name", "nickname", "raceId", "strength", "surname", "updatedAt", "weaponId", "wisdom" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
