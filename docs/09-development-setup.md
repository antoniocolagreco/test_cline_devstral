# Development Setup

## Prerequisites

- Node.js v24+
- pnpm
- Docker (optional)

## Installation Steps

```bash
# Clone repository
git clone <repository-url>
cd fantasy-character-api

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
pnpm prisma generate
pnpm prisma db push

# Seed initial data
pnpm prisma db seed

# Start development server
pnpm dev
```

## Database Seeding

```bash
# Create initial races, archetypes, and skills
pnpm prisma db seed

# Reset database with fresh seed data
pnpm prisma migrate reset
```

## Development Commands

```bash
# Development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Database operations
pnpm prisma generate    # Generate Prisma client
pnpm prisma db push     # Push schema to database
pnpm prisma db seed     # Seed database
pnpm prisma migrate reset  # Reset database
pnpm prisma studio      # Open database browser
```

## Project Structure

```text
fantasy-character-api/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── schemas/
│   ├── types/
│   ├── helpers/
│   └── index.ts
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
├── .env.example
├── package.json
├── tsconfig.json
├── jest.config.js
├── eslint.config.js
├── prettier.config.js
└── Dockerfile
```

## IDE Configuration

### VS Code Recommended Extensions

- TypeScript Hero
- Prisma
- ESLint
- Prettier
- REST Client
- Thunder Client

### VS Code Settings

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Debugging

### VS Code Debug Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "ts-node/register"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

---
[← Back to Main Documentation](../README.md)
