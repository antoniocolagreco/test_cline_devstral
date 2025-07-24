# Characters Archive API – Technical Specification

## 🧾 Project Overview

The **Characters Archive API** is a RESTful CRUD service for managing character data, designed with maintainability, scalability, and developer ergonomics in mind.

## 🔧 Technology Stack

- **Runtime**: Node.js v20+
- **Framework**: Fastify v5+
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: SQLite (dev/local)
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
├── .eslintrc.json            # ESLint config
├── tsconfig.json             # TypeScript config
├── Dockerfile                # Docker build instructions
├── docker-compose.yml        # (optional) Container orchestration
├── package.json              # Scripts and dependencies
└── README.md                 # Project documentation
```

## 🔌 API Endpoints

### Implemented

- **GET /** – Welcome endpoint with metadata

### Planned Character Routes

| Method | Endpoint        | Description                      |
| ------ | --------------- | -------------------------------- |
| POST   | /characters     | Create a new character           |
| GET    | /characters     | Retrieve all characters          |
| GET    | /characters/:id | Retrieve character by ID         |
| PUT    | /characters/:id | Update character by ID           |
| PATCH  | /characters/:id | Partially update character by ID |
| DELETE | /characters/:id | Delete character by ID           |

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

## 🎖 Future Enhancements (Optional)

- JWT-based authentication (/login, /me)
- Role-based access (admin, guest)
- Pagination and filtering (GET /characters?limit=10&offset=0)
- Unit and integration tests (Jest or Vitest)
- CI/CD setup (GitHub Actions or similar)
