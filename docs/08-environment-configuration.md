# Environment Configuration

## Required Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Authentication
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
JWT_REFRESH_EXPIRES_IN="30d"

# OAuth 2.0 - Google
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OAuth 2.0 - GitHub
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# OAuth 2.0 - Discord
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# OAuth Redirect URLs
OAUTH_REDIRECT_URL="http://localhost:3000/auth/callback"
FRONTEND_URL="http://localhost:5173"

# Email Service (for verification and password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@yourapp.com"

# Security
BCRYPT_ROUNDS="12"
SESSION_SECRET="your-session-secret-key"

# Server
PORT=3000
NODE_ENV="development"

# File Upload
MAX_FILE_SIZE="5MB"
ALLOWED_IMAGE_TYPES="image/jpeg,image/png,image/webp"

# Swagger
SWAGGER_HOST="localhost:3000"
SWAGGER_SCHEMES=["http"]
```

## Environment-Specific Configurations

### Development Environment

```env
NODE_ENV="development"
DATABASE_URL="file:./dev.db"
SWAGGER_HOST="localhost:3000"
SWAGGER_SCHEMES=["http"]
FRONTEND_URL="http://localhost:5173"
```

### Production Environment

```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:password@host:5432/dbname"
SWAGGER_HOST="api.yourdomain.com"
SWAGGER_SCHEMES=["https"]
FRONTEND_URL="https://yourdomain.com"
```

### Testing Environment

```env
NODE_ENV="test"
DATABASE_URL="file:./test.db"
JWT_SECRET="test-secret-key-for-testing-only"
JWT_REFRESH_SECRET="test-refresh-secret-key"
```

---
[← Back to Main Documentation](../README.md)
