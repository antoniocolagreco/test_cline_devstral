# Authentication & Authorization

## JWT Token Structure

```json
{
  "sub": "1",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "authProvider": "local", // "local", "google", "github", "discord"
  "isVerified": true,
  "iat": 1722422400,
  "exp": 1722508800
}
```

## Refresh Token Structure

```json
{
  "sub": "1",
  "type": "refresh",
  "iat": 1722422400,
  "exp": 1725014400 // 30 days
}
```

## Authentication Methods

### Local Authentication

- Email/password registration and login
- Password hashing with bcrypt (12 rounds)
- Email verification required for full access
- Password reset via email tokens

### OAuth 2.0 Social Login

- **Google OAuth**: Full profile access (name, email, avatar)
- **GitHub OAuth**: Public profile and email access
- **Discord OAuth**: User profile and avatar access
- Automatic account linking for existing emails
- New account creation for first-time OAuth users

## Authorization Levels

- **PUBLIC**: Publicly accessible endpoints (public characters, races, archetypes)
- **USER**: Requires valid JWT token (create/edit own characters)
- **VERIFIED**: Requires verified email (full character management)
- **ADMIN**: Requires admin role (manage races, archetypes, skills, global items)

## Resource Ownership

- Users can only modify their own characters and images
- Public characters are readable by all authenticated users
- Private characters are only accessible by their users
- Unverified users have limited character creation (max 3 characters)

## Token Management

- Access tokens expire in 24 hours
- Refresh tokens expire in 30 days
- Automatic token refresh on API requests
- Token blacklisting on logout
- Session management for OAuth flows

## OAuth Provider Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/auth/github/callback` (development)
   - `https://yourdomain.com/auth/github/callback` (production)

### Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 section
4. Add redirect URIs:
   - `http://localhost:3000/auth/discord/callback` (development)
   - `https://yourdomain.com/auth/discord/callback` (production)

---
[← Back to Main Documentation](../README.md)
