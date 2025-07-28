# Characters Archive API – Technical Specification

## 🧾 Project Overview

The **Characters Archive API** is a RESTful CRUD service for managing character data, designed with maintainability, scalability, and developer ergonomics in mind.

## 🔧 Technology Stack

- **Runtime**: Node.js v24+
- **Framework**: Fastify v5+
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: SQLite
- **Package Manager**: pnpm
- **Containerization**: Docker
- **Linting**: ESLint + TypeScript rules
- **Formatting**: Prettier
- **Typing Support**: TypeScript types

> **Note**: SQLite is used for simplicity in development; can be swapped with PostgreSQL for production scenarios.

---

## 📁 Project Structure

```plaintext
CharactersArchive/
├── src/
│   ├── index.ts              # Fastify server entrypoint
│   ├── routes/               # HTTP route handlers
│   ├── controllers/          # Business logic layer
│   ├── constants/            # Enum e costanti condivise
│   ├── models/               # Prisma models (generated)
│   ├── schemas/              # Input validation schemas
│   ├── services/             # Database access abstraction
│   └── utils/                # Helpers and common logic
├── prisma/
│   ├── schema.prisma         # Prisma schema definition
│   └── migrations/           # Prisma migrations
├── dist/                     # Compiled JS (output)
├── eslint.config.js          # ESLint config
├── prettier.config.js        # Prettier config
├── jest.config.json          # Jest config
├── tsconfig.json             # TypeScript config
├── Dockerfile                # Docker build instructions
├── docker-compose.yml        # (optional) Container orchestration
├── package.json              # Scripts and dependencies
└── README.md                 # Project documentation
```

## 🔌 API Endpoints

### Planned Character Routes

| Method | Endpoint        | Description                      |
| ------ | --------------- | -------------------------------- |
| POST   | /characters     | Create a new character           |
| GET    | /characters     | Retrieve all characters          |
| GET    | /characters/:id | Retrieve character by ID         |
| PUT    | /characters/:id | Update character by ID           |
| PATCH  | /characters/:id | Partially update character by ID |
| DELETE | /characters/:id | Delete character by ID           |

| POST   | /authors              | Create a new author              |
| GET    | /authors              | Retrieve all authors             |
| GET    | /authors/:id          | Retrieve author by ID            |
| PUT    | /authors/:id          | Update author by ID              |
| PATCH  | /authors/:id          | Partially update author by ID    |
| DELETE | /authors/:id          | Delete author by ID              |

| POST   | /classes              | Create a new character class     |
| GET    | /classes              | Retrieve all character classes   |
| GET    | /classes/:id          | Retrieve character class by ID   |
| PUT    | /classes/:id          | Update character class by ID     |
| PATCH  | /classes/:id          | Partially update character class by ID |
| DELETE | /classes/:id          | Delete character class by ID     |

| POST   | /items                | Create a new character item      |
| GET    | /items                | Retrieve all character items     |
| GET    | /items/:id            | Retrieve character item by ID    |
| PUT    | /items/:id            | Update character item by ID      |
| PATCH  | /items/:id            | Partially update character item by ID |
| DELETE | /items/:id            | Delete character item by ID      |

| POST   | /races                | Create a new character race      |
| GET    | /races                | Retrieve all character races     |
| GET    | /races/:id            | Retrieve character race by ID    |
| PUT    | /races/:id            | Update character race by ID      |
| PATCH  | /races/:id            | Partially update character race by ID |
| DELETE | /races/:id            | Delete character race by ID      |

| POST   | /skills               | Create a new character skill     |
| GET    | /skills               | Retrieve all character skills    |
| GET    | /skills/:id           | Retrieve character skill by ID   |
| PUT    | /skills/:id           | Update character skill by ID     |
| PATCH  | /skills/:id           | Partially update character skill by ID |
| DELETE | /skills/:id           | Delete character skill by ID     |

## 🧬 Database Schema

```typescript
// src/models/index.ts
/**
 * Character model definition.
 */
model Character {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

- The schema is defined in `prisma/schema.prisma`.
- Use `npx prisma migrate dev` to manage migrations.
- Data access is abstracted using a service layer (`src/services/characterService.ts`).

## 🚀 Implementation Roadmap

### Setup

1. Initialize Fastify with TypeScript and tsconfig.
2. Install and configure ESLint with sensible defaults.

### Database Integration

1. Define schema with Prisma.
2. Implement SQLite for local development.

### CRUD API

1. Implement routes with validation and error handling.

### Dockerization

1. Create Dockerfile and optionally docker-compose.yml.
2. Ensure local and production consistency.

### Documentation

1. Add OpenAPI documentation (via @fastify/swagger).
2. Expose Swagger UI at `/docs`.

## ✅ Linting & Quality

- ESLint configured with TypeScript and Fastify rules.
- Key rules:
  - no-unused-vars
  - eqeqeq
  - quotes ('single')
  - prefer-const

- Optional: Prettier integration for formatting.
- CI-ready with `eslint . --ext .ts` script.

## 📌 Notes

- The API should follow RESTful conventions.
- Type-safe interfaces should be shared and validated at runtime.
- SQLite is fine for local or small deployments — to be replaced by PostgreSQL in scalable environments.
- Docker setup is intended for local dev, CI pipelines, and production builds.
