/*
  Warnings:

  - Added the required column `email` to the `Author` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CharacterClass" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "CharacterRace" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "CharacterSkill" ADD COLUMN "description" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Author" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL
);
INSERT INTO "new_Author" ("id", "name") SELECT "id", "name" FROM "Author";
DROP TABLE "Author";
ALTER TABLE "new_Author" RENAME TO "Author";
CREATE TABLE "new_CharacterItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "durability" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL
);
INSERT INTO "new_CharacterItem" ("attack", "defense", "description", "durability", "id", "name", "rarity", "type", "weight") SELECT "attack", "defense", "description", "durability", "id", "name", "rarity", "type", "weight" FROM "CharacterItem";
DROP TABLE "CharacterItem";
ALTER TABLE "new_CharacterItem" RENAME TO "CharacterItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
