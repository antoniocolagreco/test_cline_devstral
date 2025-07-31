# Security Considerations

## Data Protection

- Password hashing with bcrypt (12 rounds)
- JWT token signing with strong secrets (min 32 characters)
- Input sanitization for XSS prevention
- SQL injection protection via Prisma ORM
- OAuth state parameter validation
- Email verification tokens with expiration
- Password reset tokens with single-use policy
- File upload validation and sanitization
- Rate limiting per IP and user

## API Security

- JWT access token expiration (24 hours)
- JWT refresh token expiration (30 days)
- Token blacklisting on logout
- OAuth CSRF protection with state parameters
- Request rate limiting: 1000 req/hour per authenticated user
- Brute force protection on login endpoints
- Input validation on all endpoints
- CORS configuration for authorized domains
- Security headers (HSTS, CSP, X-Frame-Options)
- Audit logging for sensitive operations

## File Upload Security

- Image type validation (JPEG, PNG, WebP only)
- File size limits (5MB max)
- Virus scanning (production)
- Secure file storage with unique naming

## Security Headers

```typescript
// Security headers implementation
app.register(require('@fastify/helmet'), {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});
```

## Input Validation

```typescript
// Schema validation example
const createCharacterSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 50 }),
  email: Type.String({ format: 'email' }),
  strength: Type.Integer({ minimum: 1, maximum: 20 }),
  raceId: Type.Integer({ minimum: 1 })
});
```

## Authentication Security

### Password Requirements

- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Must contain special character

### JWT Security

```typescript
// JWT configuration
const jwtOptions = {
  secret: process.env.JWT_SECRET, // min 32 characters
  expiresIn: '24h',
  algorithm: 'HS256'
};

// Token blacklisting
const blacklistedTokens = new Set();

const verifyToken = (token) => {
  if (blacklistedTokens.has(token)) {
    throw new Error('Token is blacklisted');
  }
  return jwt.verify(token, jwtOptions.secret);
};
```

## Rate Limiting

```typescript
// API rate limiting
app.register(require('@fastify/rate-limit'), {
  max: 1000, // requests
  timeWindow: '1 hour',
  skipOnError: false,
  skipSuccessfulRequests: false,
  keyGenerator: (request) => {
    return request.user?.id || request.ip;
  }
});

// Stricter limits for auth endpoints
app.register(require('@fastify/rate-limit'), {
  max: 5, // login attempts
  timeWindow: '15 minutes'
}, { prefix: '/auth/login' });
```

## CORS Configuration

```typescript
app.register(require('@fastify/cors'), {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://yourdomain.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
});
```

## SQL Injection Prevention

```typescript
// Prisma automatically prevents SQL injection
// But avoid raw queries when possible

// Safe - Prisma handles parameterization
const user = await prisma.user.findFirst({
  where: { email: userEmail }
});

// Dangerous - Avoid raw SQL
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userEmail}
`;
```

## Audit Logging

```typescript
// Audit log for sensitive operations
const auditLog = {
  userId: user.id,
  action: 'CHARACTER_CREATED',
  resource: 'character',
  resourceId: character.id,
  timestamp: new Date(),
  ipAddress: request.ip,
  userAgent: request.headers['user-agent']
};

await prisma.auditLog.create({ data: auditLog });
```

## Environment Security

### Development

- Use separate secrets for development
- Never commit secrets to version control
- Use .env files with .gitignore

### Production

- Use environment-specific secrets
- Rotate secrets regularly
- Use secrets management service (AWS Secrets Manager, etc.)
- Enable database encryption at rest
- Use HTTPS only
- Regular security updates

## Security Checklist

- [ ] Password hashing with bcrypt (12+ rounds)
- [ ] JWT secrets are 32+ characters
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] File upload validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Audit logging for sensitive operations
- [ ] Regular dependency updates
- [ ] Security testing in CI/CD
- [ ] Environment-specific configurations

---
[← Back to Main Documentation](../README.md)
