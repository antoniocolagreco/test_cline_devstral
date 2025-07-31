# Data Models

## User Schema

```typescript
type User = {
  id: number;
  name: string;
  email: string;
  password?: string; // Hashed with bcrypt, only for local auth
  googleId?: string; // OAuth Google ID
  githubId?: string; // OAuth GitHub ID
  discordId?: string; // OAuth Discord ID
  avatarPath?: string; 
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  characters: Character[];
}
```

## Character Schema

```typescript
type Character = {
  id: number;
  name: string;
  surname?: string;
  nickname?: string;
  description?: string;
  avatarPath?: string;
  
  // Base Stats
  health: number;
  stamina: number;
  mana: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  
  // Relations
  raceId: number;
  race: Race;
  archetypeId: number;
  archetype: Archetype;
  userId: number;
  user: User;
  
  // Equipment
  primaryWeaponId?: number;
  primaryWeapon?: Item;
  secondaryWeaponId?: number;
  secondaryWeapon?: Item;
  shieldId?: number;
  shield?: Item;
  armorId?: number;
  armor?: Item;
  firstRingId?: number;
  firstRing?: Item;
  secondRingId?: number;
  secondRing?: Item;
  amuletId?: number;
  amulet?: Item;
  
  items: Item[];
  tags: Tag[];

  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Race Schema

```typescript
type Race = {
  id: number;
  name: string;
  description?: string;
  
  // Stat Modifiers
  healthModifier: number;
  staminaModifier: number;
  manaModifier: number;
  strengthModifier: number;
  dexterityModifier: number;
  constitutionModifier: number;
  intelligenceModifier: number;
  wisdomModifier: number;
  charismaModifier: number;
  
  skills: Skill[];
  characters: Character[];
  tags: Tag[];
}
```

## Archetype Schema

```typescript
type Archetype = {
  id: number;
  name: string;
  description?: string;
  skills: Skill[];
  characters: Character[];
  tags: Tag[];
}
```

## Skill Schema

```typescript
type Skill = {
  id: number;
  name: string;
  description?: string;
  archetypes: Archetype[];
  races: Race[];
  tags: Tag[];
}
```

## Item Schema

```typescript
type ItemRarity = {
  Common = "Common",
  Uncommon = "Uncommon",
  Rare = "Rare",
  Epic = "Epic",
  Legendary = "Legendary"
}

type Item = {
  id: number;
  name: string;
  description?: string;
  rarity: ItemRarity;
  
  // Item Types
  isWeapon: boolean;
  isShield: boolean;
  isArmor: boolean;
  isAccessory: boolean;
  isConsumable: boolean;
  isQuestItem: boolean;
  isCraftingMaterial: boolean;
  isMiscellaneous: boolean;
  
  // Combat Stats
  attack: number;
  defense: number;
  
  // Requirements
  requiredStrength: number;
  requiredDexterity: number;
  requiredConstitution: number;
  requiredIntelligence: number;
  requiredWisdom: number;
  requiredCharisma: number;
  
  // Bonuses
  bonusStrength: number;
  bonusDexterity: number;
  bonusConstitution: number;
  bonusIntelligence: number;
  bonusWisdom: number;
  bonusCharisma: number;
  bonusHealth: number;
  
  // Physical Properties
  durability: number;
  weight: number;
  
  characters: Character[];
  tags: Tag[];
}
```

## Tag Schema

```typescript
type Tag = {
  id: number;
  name: string;
  items: Item[];
  characters: Character[];
  skills: Skill[];
  archetypes: Archetype[];
  races: Race[];
}
```

## Image Schema

```typescript
type Image = {
  id: number;
  buffer: Buffer;
  filename: string;
  size: number;
  width: number;
  height: number;
  userId: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---
[← Back to Main Documentation](../README.md)
