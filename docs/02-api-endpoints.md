# API Endpoints

## Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me

# OAuth 2.0 Social Login
GET  /auth/google
GET  /auth/google/callback
GET  /auth/github
GET  /auth/github/callback
GET  /auth/discord
GET  /auth/discord/callback
```

## Users

```http
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/users/:id/characters
```

## Characters

```http
GET    /api/v1/characters
GET    /api/v1/characters/:id
POST   /api/v1/characters
PUT    /api/v1/characters/:id
DELETE /api/v1/characters/:id
```

## Races

```http
GET    /api/v1/races
GET    /api/v1/races/:id
POST   /api/v1/races
PUT    /api/v1/races/:id
DELETE /api/v1/races/:id
```

## Archetypes

```http
GET    /api/v1/archetypes
GET    /api/v1/archetypes/:id
POST   /api/v1/archetypes
PUT    /api/v1/archetypes/:id
DELETE /api/v1/archetypes/:id
```

## Skills

```http
GET    /api/v1/skills
GET    /api/v1/skills/:id
POST   /api/v1/skills
PUT    /api/v1/skills/:id
DELETE /api/v1/skills/:id
```

## Items

```http
GET    /api/v1/items
GET    /api/v1/items/:id
POST   /api/v1/items
PUT    /api/v1/items/:id
DELETE /api/v1/items/:id
```

## Tags

```http
GET    /api/v1/tags
GET    /api/v1/tags/:id
POST   /api/v1/tags
PUT    /api/v1/tags/:id
DELETE /api/v1/tags/:id
```

## Images

```http
GET    /api/v1/images/:id
POST   /api/v1/images
DELETE /api/v1/images/:id
```

---
[← Back to Main Documentation](../README.md)
