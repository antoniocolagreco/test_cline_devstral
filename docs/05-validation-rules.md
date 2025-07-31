# Validation Rules

## User Registration Validation

- `name`: required string, 2-50 characters, alphanumeric and spaces only
- `email`: required valid email format, unique in database
- `password`: required string, minimum 8 characters, must contain uppercase, lowercase, number, and special character

## User Login Validation

- `email`: required valid email format
- `password`: required string, minimum 1 character

## Character Validation

- `name`: required string, 1-50 characters
- `surname`: optional string, max 50 characters
- `nickname`: optional string, max 30 characters
- `description`: optional string, max 1000 characters
- `raceId`: required integer, must exist in races table
- `archetypeId`: required integer, must exist in archetypes table
- `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma`: integers between 1-20
- `health`, `stamina`, `mana`: positive integers
- `isPublic`: required boolean

## Item Validation

- `name`: required string, 1-100 characters, unique
- `description`: optional string, max 500 characters
- `rarity`: enum value (Common, Uncommon, Rare, Epic, Legendary)
- `attack`, `defense`: non-negative integers
- All requirement and bonus stats: integers between 0-50
- `durability`: positive integer, max 10000
- `weight`: positive integer
- At least one item type boolean must be true

## Race Validation

- `name`: required string, 1-50 characters, unique
- `description`: optional string, max 500 characters
- All modifier fields: integers between -10 and +10

## Archetype Validation

- `name`: required string, 1-50 characters, unique
- `description`: optional string, max 500 characters

## Skill Validation

- `name`: required string, 1-100 characters, unique
- `description`: optional string, max 500 characters

## Tag Validation

- `name`: required string, 1-50 characters, unique

## Image Validation

- File types: JPEG, PNG, WebP only
- File size: Maximum 5MB
- Dimensions: Maximum 2048x2048 pixels
- Required metadata: filename, mimeType

---
[← Back to Main Documentation](../README.md)
