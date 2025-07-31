# Technology Stack

## Backend Core

- **Node.js v24+**: JavaScript runtime powering the backend, chosen for its performance and ecosystem
- **TypeScript**: Adds static typing to JavaScript, improving code quality and maintainability
- **Fastify v5+**: Web framework for building the API, lightweight and fast with built-in schema validation

## Authentication & Security

- **@fastify/jwt**: Official Fastify plugin for JWT token management with native integration
- **@fastify/oauth2**: OAuth 2.0 implementation for social login (Google, GitHub, Discord)
- **@fastify/session**: Session management for OAuth flows and secure user sessions
- **bcrypt**: Industry-standard password hashing with configurable rounds

## Validation & Documentation

- **TypeBox**: Library for defining JSON Schema-compatible schemas with TypeScript types
- **Ajv**: High-performance JSON Schema validator for runtime validation
- **Swagger (@fastify/swagger)**: Automatically generates OpenAPI documentation and Swagger UI

## Database & ORM

- **Prisma ORM**: Advanced ORM for TypeScript/Node.js with type-safe database interactions
- **SQLite**: Default database for local development (file-based). PostgreSQL recommended for production

## Development Tools

- **pnpm**: Fast, disk-efficient package manager for Node.js projects
- **Docker**: Application containerization for consistency across environments
- **ESLint**: TypeScript linter with code quality and style rules
- **Prettier**: Opinionated code formatter for consistent style
- **Jest**: Testing framework for unit and integration tests

---
[← Back to Main Documentation](../README.md)
