# Characters Archive API – Technical Specification

## 🧾 Project Overview

The **Characters Archive API** is a RESTful CRUD service for managing character data, designed for maintainability, scalability, and developer ergonomics. It leverages modern technologies to ensure robust development and deployment workflows.

## 🔧 Technology Stack Explained

- **Node.js v24+**: The JavaScript runtime powering the backend, chosen for its performance and ecosystem.
- **TypeScript**: Adds static typing to JavaScript, improving code quality and maintainability.
- **Fastify v5+**: The web framework used for building the API. Fastify is lightweight, fast, and provides built-in schema validation for requests and responses.
- **Prisma ORM**: An advanced ORM for TypeScript/Node.js, used to define models and interact with the database in a type-safe way.
- **SQLite**: The default database for local development. It is file-based and easy to set up. For production, you can switch to PostgreSQL or another supported database.
- **pnpm**: A fast, disk-efficient package manager for Node.js projects.
- **Docker**: Used for containerizing the application, ensuring consistency across development, CI, and production environments.
- **ESLint**: A linter for JavaScript/TypeScript, enforcing code quality and style rules.
- **Prettier**: An opinionated code formatter for consistent code style.
- **Jest**: The testing framework for unit and integration tests.
- **Swagger (via @fastify/swagger)**: Automatically generates OpenAPI documentation and exposes a Swagger UI for API exploration.

## 🗂️ Project Structure Overview

The project is organized for clarity and scalability:

- `src/index.ts`: Fastify server entrypoint.
- `src/routes/`: HTTP route handlers for each resource (characters, authors, etc.).
- `src/controllers/`: Business logic layer, separating route logic from core operations.
- `src/constants/`: Shared enums and constants.
- `src/models/`: Prisma models (generated from schema).
- `src/schemas/`: JSON schemas for input validation (used by Fastify).
- `src/services/`: Database access abstraction, e.g., characterService.ts.
- `src/utils/`: Helpers and common logic.
- `prisma/schema.prisma`: Prisma schema definition.
- `prisma/migrations/`: Prisma migration files.
- `dist/`: Compiled JS output.
- `Dockerfile` & `docker-compose.yml`: Containerization and orchestration.
- `eslint.config.js`, `prettier.config.js`, `jest.config.json`, `tsconfig.json`: Tooling configs.
- `package.json`: Scripts and dependencies.
- `README.md`: Project documentation.

## � Implementation Roadmap (Recommended Order)

1. **Initialize Project & Tooling**
   - Set up a new Node.js project with pnpm.
   - Configure TypeScript (`tsconfig.json`).
   - Add ESLint and Prettier for code quality and formatting.
   - Set up Jest for testing.

2. **Database & ORM Setup**
   - Define models in `prisma/schema.prisma`.
   - Run `npx prisma migrate dev` to create the initial database and migrations.
   - Generate Prisma client.

3. **Fastify Server & Routing**
   - Create `src/index.ts` to initialize Fastify.
   - Implement route files in `src/routes/` for each resource (characters, authors, etc.).
   - Use Fastify's built-in schema validation for all endpoints.

4. **Business Logic & Services**
   - Implement controllers in `src/controllers/` to handle business logic.
   - Abstract database access in `src/services/` (e.g., characterService.ts).

5. **Validation & Schemas**
   - Define JSON schemas for requests and responses in `src/schemas/`.
   - Integrate schemas with Fastify route definitions.

6. **Testing**
   - Write unit and integration tests using Jest.
   - Ensure coverage for routes, controllers, and services.

7. **Documentation**
   - Integrate @fastify/swagger for OpenAPI docs.
   - Expose Swagger UI at `/docs` endpoint.

8. **Dockerization**
   - Create a `Dockerfile` for building the app image.
   - Optionally add `docker-compose.yml` for multi-service orchestration.

9. **CI/CD & Quality Assurance**
   - Add scripts for linting, formatting, and testing in `package.json`.
   - Ensure ESLint and Prettier are enforced in CI pipelines.

10. **Production Readiness**
    - Switch database to PostgreSQL if scaling is needed.
    - Review security, performance, and deployment best practices.

## 🔌 API Endpoints Overview

The API exposes RESTful CRUD endpoints for the following resources:

- **Characters**: `/characters`, `/characters/:id`
- **Authors**: `/authors`, `/authors/:id`
- **Archetypes**: `/archetypes`, `/archetypes/:id`
- **Items**: `/items`, `/items/:id`
- **Races**: `/races`, `/races/:id`
- **Skills**: `/skills`, `/skills/:id`

Each resource supports standard CRUD operations: Create (POST), Read (GET), Update (PUT/PATCH), and Delete (DELETE).
