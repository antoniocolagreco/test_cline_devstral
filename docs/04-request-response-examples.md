# Request/Response Examples

## User Registration

**Request:**

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "isVerified": false,
      "createdAt": "2025-07-31T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  },
  "message": "Registration successful. Please check your email for verification."
}
```

## User Login

**Request:**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "avatar": "https://example.com/avatars/john.jpg",
      "lastLoginAt": "2025-07-31T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  }
}
```

## OAuth 2.0 Social Login Flow

**Step 1: Initiate OAuth (Redirect):**

```http
GET /auth/google
```

**Step 2: OAuth Callback (Automatic):**

```http
GET /auth/google/callback?code=4/0AX4XfWh...&state=xyz
```

**Response (200 OK with redirect to frontend):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane.smith@gmail.com",
      "avatar": "https://lh3.googleusercontent.com/...",
      "googleId": "108234567890123456789",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  }
}
```

## Token Refresh

**Request:**

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

## Create Character

**Request:**

```http
POST /api/v1/characters
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Aragorn",
  "surname": "Elessar",
  "nickname": "Strider",
  "description": "Ranger of the North, heir to the throne of Gondor",
  "raceId": 1,
  "archetypeId": 2,
  "strength": 16,
  "dexterity": 14,
  "constitution": 15,
  "intelligence": 12,
  "wisdom": 13,
  "charisma": 14,
  "isPublic": true,
  "tags": [1, 3, 5]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Aragorn",
    "surname": "Elessar",
    "nickname": "Strider",
    "description": "Ranger of the North, heir to the throne of Gondor",
    "health": 115,
    "stamina": 110,
    "mana": 100,
    "strength": 16,
    "dexterity": 14,
    "constitution": 15,
    "intelligence": 12,
    "wisdom": 13,
    "charisma": 14,
    "race": {
      "id": 1,
      "name": "Human",
      "healthModifier": 5,
      "staminaModifier": 10
    },
    "archetype": {
      "id": 2,
      "name": "Ranger",
      "description": "Master of wilderness survival and tracking"
    },
    "isPublic": true,
    "createdAt": "2025-07-31T10:30:00.000Z",
    "updatedAt": "2025-07-31T10:30:00.000Z"
  }
}
```

## Get Characters with Filters

**Request:**

```http
GET /api/v1/characters?race=human&archetype=ranger&isPublic=true&page=1&limit=10
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "id": 1,
        "name": "Aragorn",
        "surname": "Elessar",
        "nickname": "Strider",
        "race": {
          "id": 1,
          "name": "Human"
        },
        "archetype": {
          "id": 2,
          "name": "Ranger"
        },
        "user": {
          "id": 1,
          "name": "John Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

## Equip Item to Character

**Request:**

```http
POST /api/v1/characters/1/equip
Content-Type: application/json
Authorization: Bearer <token>

{
  "itemId": 15,
  "slot": "primaryWeapon"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "character": {
      "id": 1,
      "name": "Aragorn",
      "primaryWeapon": {
        "id": 15,
        "name": "Andúril",
        "description": "Flame of the West, reforged blade of kings",
        "rarity": "Legendary",
        "attack": 25,
        "bonusStrength": 3
      }
    },
    "message": "Item equipped successfully"
  }
}
```

## Create Item

**Request:**

```http
POST /api/v1/items
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Steel Longsword",
  "description": "A well-crafted steel blade",
  "rarity": "Common",
  "isWeapon": true,
  "attack": 12,
  "requiredStrength": 10,
  "durability": 1000,
  "weight": 5,
  "tags": [1, 7]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": 16,
    "name": "Steel Longsword",
    "description": "A well-crafted steel blade",
    "rarity": "Common",
    "isWeapon": true,
    "attack": 12,
    "defense": 0,
    "requiredStrength": 10,
    "durability": 1000,
    "weight": 5,
    "tags": [
      {
        "id": 1,
        "name": "weapon"
      },
      {
        "id": 7,
        "name": "steel"
      }
    ]
  }
}
```

---
[← Back to Main Documentation](../README.md)
