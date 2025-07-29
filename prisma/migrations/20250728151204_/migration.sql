-- CreateTable
CREATE TABLE "Author" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Archetype" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Race" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "healthModifier" INTEGER NOT NULL,
    "manaModifier" INTEGER NOT NULL,
    "strengthModifier" INTEGER NOT NULL,
    "dexterityModifier" INTEGER NOT NULL,
    "constitutionModifier" INTEGER NOT NULL,
    "intelligenceModifier" INTEGER NOT NULL,
    "wisdomModifier" INTEGER NOT NULL,
    "charismaModifier" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rarity" TEXT NOT NULL,
    "weapon" BOOLEAN NOT NULL,
    "armor" BOOLEAN NOT NULL,
    "accessory" BOOLEAN NOT NULL,
    "consumable" BOOLEAN NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL,
    "dexterity" INTEGER NOT NULL,
    "constitution" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "wisdom" INTEGER NOT NULL,
    "charisma" INTEGER NOT NULL,
    "durability" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Character" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "surname" TEXT,
    "nickname" TEXT,
    "description" TEXT,
    "avatar" TEXT,
    "health" INTEGER NOT NULL,
    "mana" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL,
    "dexterity" INTEGER NOT NULL,
    "constitution" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "wisdom" INTEGER NOT NULL,
    "charisma" INTEGER NOT NULL,
    "raceId" INTEGER NOT NULL,
    "archetypeId" INTEGER NOT NULL,
    "primaryWeaponId" INTEGER,
    "secondaryWeaponId" INTEGER,
    "shieldId" INTEGER,
    "armorId" INTEGER,
    "firstRingId" INTEGER,
    "secondRingId" INTEGER,
    "amuletId" INTEGER,
    "authorId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Character_archetypeId_fkey" FOREIGN KEY ("archetypeId") REFERENCES "Archetype" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Character_primaryWeaponId_fkey" FOREIGN KEY ("primaryWeaponId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Character_secondaryWeaponId_fkey" FOREIGN KEY ("secondaryWeaponId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Character_shieldId_fkey" FOREIGN KEY ("shieldId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Character_armorId_fkey" FOREIGN KEY ("armorId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Character_firstRingId_fkey" FOREIGN KEY ("firstRingId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Character_secondRingId_fkey" FOREIGN KEY ("secondRingId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Character_amuletId_fkey" FOREIGN KEY ("amuletId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Character_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ArchetypeSkills" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ArchetypeSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "Archetype" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArchetypeSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RaceSkills" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_RaceSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RaceSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterItems" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CharacterItems_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterItems_B_fkey" FOREIGN KEY ("B") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Author_email_key" ON "Author"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_ArchetypeSkills_AB_unique" ON "_ArchetypeSkills"("A", "B");

-- CreateIndex
CREATE INDEX "_ArchetypeSkills_B_index" ON "_ArchetypeSkills"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RaceSkills_AB_unique" ON "_RaceSkills"("A", "B");

-- CreateIndex
CREATE INDEX "_RaceSkills_B_index" ON "_RaceSkills"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterItems_AB_unique" ON "_CharacterItems"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterItems_B_index" ON "_CharacterItems"("B");
