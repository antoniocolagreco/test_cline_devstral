# Deployment Specifications

## Production Environment

- **Database**: PostgreSQL 15+ with connection pooling
- **Container**: Docker with Node.js Alpine image
- **Reverse Proxy**: Nginx with SSL termination
- **File Storage**: AWS S3 or compatible object storage
- **Monitoring**: Application metrics and health checks

## CI/CD Pipeline

1. Code quality checks (ESLint, Prettier)
2. Unit and integration test execution
3. Docker image building and scanning
4. Database migration execution
5. Staging deployment and smoke tests
6. Production deployment with blue-green strategy

## Docker Configuration

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM node:18-alpine AS runner

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api

volumes:
  postgres_data:
```

## Infrastructure as Code

### Terraform Configuration

```hcl
# main.tf
provider "aws" {
  region = var.aws_region
}

resource "aws_ecs_cluster" "fantasy_api" {
  name = "fantasy-character-api"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_rds_instance" "postgres" {
  identifier = "fantasy-api-db"
  engine     = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  allocated_storage = 20

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
}

resource "aws_s3_bucket" "file_storage" {
  bucket = "fantasy-api-files-${random_id.bucket_suffix.hex}"
}
```

## Database Migration Strategy

### Production Migrations

```bash
# Run migrations before deployment
pnpm prisma migrate deploy

# Backup before major changes
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Rollback strategy
pnpm prisma migrate diff --from-migrations ./migrations --to-schema-datamodel schema.prisma
```

### Zero-Downtime Deployment

1. **Blue-Green Deployment**
   - Deploy to green environment
   - Run database migrations
   - Switch traffic from blue to green
   - Keep blue environment for rollback

2. **Database Compatibility**
   - Backward compatible migrations only
   - Add columns before removing
   - Use feature flags for breaking changes

## Monitoring & Observability

### Health Checks

```typescript
// Health check endpoint
app.get('/health', async (request, reply) => {
  try {
    // Database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Redis connectivity (if used)
    await redis.ping();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      uptime: process.uptime()
    };
  } catch (error) {
    reply.status(503);
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
});
```

### Metrics Collection

```typescript
// Prometheus metrics
const promClient = require('prom-client');

const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const httpRequests = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Metrics endpoint
app.get('/metrics', async (request, reply) => {
  reply.type('text/plain');
  return promClient.register.metrics();
});
```

### Logging Configuration

```typescript
// Structured logging with Pino
const logger = require('pino')({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`
});

// Request logging
app.register(require('@fastify/sensible'));
app.register(require('pino-pretty'), {
  target: 'pino-pretty',
  options: {
    colorize: process.env.NODE_ENV === 'development'
  }
});
```

## Security in Production

### SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Security

```bash
# Secrets management
export JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id jwt-secret --query SecretString --output text)
export DATABASE_URL=$(aws secretsmanager get-secret-value --secret-id db-url --query SecretString --output text)

# Database encryption
export DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

## Backup & Recovery

### Database Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://fantasy-api-backups/

# Retain last 30 days
find . -name "backup_*.sql" -mtime +30 -delete
```

### Disaster Recovery

1. **Recovery Time Objective (RTO)**: 4 hours
2. **Recovery Point Objective (RPO)**: 1 hour
3. **Backup frequency**: Every 6 hours
4. **Cross-region replication**: Daily snapshots

## Performance Optimization

### Database Optimization

```sql
-- Production indexes
CREATE INDEX CONCURRENTLY idx_characters_user_id ON characters(user_id);
CREATE INDEX CONCURRENTLY idx_characters_race_archetype ON characters(race_id, archetype_id);
CREATE INDEX CONCURRENTLY idx_items_rarity ON items(rarity);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '4MB';
```

### Application Optimization

```typescript
// Connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=20'
    }
  }
});

// Response caching
app.register(require('@fastify/caching'), {
  privacy: 'private',
  expiresIn: 3600 // 1 hour
});

// Compression
app.register(require('@fastify/compress'), {
  global: true,
  threshold: 1024
});
```

## Scaling Strategy

### Horizontal Scaling

- Load balancer with multiple API instances
- Database read replicas for read-heavy operations
- CDN for static file serving
- Redis cluster for session management

### Vertical Scaling

- Monitor CPU and memory usage
- Auto-scaling based on metrics
- Database connection pool optimization
- Memory leak detection and prevention

---
[← Back to Main Documentation](../README.md)
