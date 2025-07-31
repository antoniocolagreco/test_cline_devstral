# Testing Strategy

## Test Categories

- **Unit Tests**: Individual function and model testing
- **Integration Tests**: Complete API endpoint testing
- **Database Tests**: CRUD operations and relationships
- **Authentication Tests**: JWT, OAuth flows, and authorization
- **Security Tests**: Password hashing, token validation, input sanitization
- **File Upload Tests**: Image handling and validation
- **OAuth Integration Tests**: Social login flows with mocked providers

## Test Coverage Requirements

- Minimum 85% code coverage
- 100% coverage for authentication and validation
- 100% coverage for OAuth flows and token management
- All CRUD endpoints must have tests
- Equipment system integration tests
- Security vulnerability tests

## Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test suite
pnpm test characters.test.ts

# Run integration tests only
pnpm test:integration

# Run unit tests only
pnpm test:unit

# Watch mode for development
pnpm test:watch
```

## Test Structure

### Unit Tests

```typescript
// tests/unit/services/character.service.test.ts
describe('CharacterService', () => {
  describe('createCharacter', () => {
    it('should create character with valid data', async () => {
      // Test implementation
    });

    it('should throw error for invalid race', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/characters.test.ts
describe('Characters API', () => {
  describe('POST /api/v1/characters', () => {
    it('should create character successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/characters',
        headers: { authorization: `Bearer ${token}` },
        payload: characterData
      });

      expect(response.statusCode).toBe(201);
    });
  });
});
```

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
};
```

## Test Data Management

### Test Database

- Use separate test database
- Reset database before each test suite
- Use database transactions for test isolation

### Fixtures

```typescript
// tests/fixtures/characters.ts
export const mockCharacter = {
  name: 'Test Character',
  raceId: 1,
  archetypeId: 1,
  strength: 15,
  // ... other properties
};
```

## Mocking Strategies

### External Services

```typescript
// Mock OAuth providers
jest.mock('@fastify/oauth2');

// Mock email service
jest.mock('nodemailer');

// Mock file uploads
jest.mock('multer');
```

### Database Mocking

```typescript
// Mock Prisma client for unit tests
const mockPrisma = {
  character: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};
```

## Performance Testing

### Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Run load tests
artillery run load-test.yml
```

### Load Test Configuration

```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Character CRUD operations'
    flow:
      - get:
          url: '/api/v1/characters'
      - post:
          url: '/api/v1/characters'
          json:
            name: 'Load Test Character'
```

---
[← Back to Main Documentation](../README.md)
