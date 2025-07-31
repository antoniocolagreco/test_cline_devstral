# Performance Requirements

## Response Time Targets

- Simple GET requests: < 100ms
- Complex character queries with relations: < 300ms
- Character creation/updates: < 500ms
- Image uploads: < 2000ms

## Database Optimization

- Indexed fields: name, email on all major entities
- Pagination required for all list endpoints (max 100 items)
- Lazy loading for character equipment and items
- Connection pooling for concurrent requests

## API Performance Guidelines

### Query Optimization

```typescript
// Good: Use select to limit fields
const characters = await prisma.character.findMany({
  select: {
    id: true,
    name: true,
    race: { select: { name: true } },
    archetype: { select: { name: true } }
  },
  take: 20,
  skip: page * 20
});

// Bad: Loading all relations
const characters = await prisma.character.findMany({
  include: { race: true, archetype: true, items: true }
});
```

### Caching Strategy

```typescript
// Redis caching for frequently accessed data
const cachedRaces = await redis.get('races:all');
if (cachedRaces) {
  return JSON.parse(cachedRaces);
}

const races = await prisma.race.findMany();
await redis.setex('races:all', 3600, JSON.stringify(races));
```

## Scalability Considerations

### Database Scaling

- Read replicas for heavy read operations
- Database sharding for large datasets
- Connection pooling (max 20 connections)
- Query optimization with EXPLAIN ANALYZE

### Application Scaling

- Horizontal scaling with load balancer
- Stateless application design
- Session storage in Redis
- File storage in object storage (S3)

## Monitoring Metrics

### Response Time Metrics

- 95th percentile response time < 500ms
- 99th percentile response time < 1000ms
- Average response time < 200ms

### Throughput Metrics

- Minimum 1000 requests/minute
- Peak load: 5000 requests/minute
- Database queries: < 100ms average

### Resource Usage

- CPU usage < 70% under normal load
- Memory usage < 80% of available RAM
- Database connections < 80% of pool size

## Performance Testing

### Load Testing Scenarios

1. **Normal Load**: 100 concurrent users
2. **Peak Load**: 500 concurrent users
3. **Stress Test**: 1000+ concurrent users
4. **Endurance Test**: 6 hours continuous load

### Benchmark Targets

```bash
# API Endpoints Response Times
GET /api/v1/characters     < 100ms
POST /api/v1/characters    < 200ms
GET /api/v1/characters/:id < 50ms
PUT /api/v1/characters/:id < 150ms

# Authentication
POST /auth/login           < 300ms
POST /auth/register        < 400ms
POST /auth/refresh         < 100ms

# File Operations
POST /api/v1/images        < 2000ms
GET /api/v1/images/:id     < 200ms
```

## Optimization Strategies

### Database Indexing and Query Optimization

1. **Indexing Strategy**

   ```sql
   CREATE INDEX idx_characters_user_id ON characters(user_id);
   CREATE INDEX idx_characters_race_archetype ON characters(race_id, archetype_id);
   CREATE INDEX idx_items_rarity ON items(rarity);
   ```

2. **Query Optimization**
   - Use select instead of include when possible
   - Implement pagination for all list endpoints
   - Avoid N+1 queries with proper includes

3. **Connection Pooling**

   ```typescript
   // Prisma connection pool configuration
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     connection_limit = 20
   }
   ```

### Application Optimization

1. **Response Compression**

   ```typescript
   await app.register(require('@fastify/compress'));
   ```

2. **Request Rate Limiting**

   ```typescript
   await app.register(require('@fastify/rate-limit'), {
     max: 1000,
     timeWindow: '1 hour'
   });
   ```

3. **Caching Headers**

   ```typescript
   reply.header('Cache-Control', 'public, max-age=3600');
   ```

---
[← Back to Main Documentation](../README.md)
