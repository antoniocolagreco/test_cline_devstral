# Error Handling

## Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided data is invalid",
    "details": [
      {
        "field": "strength",
        "message": "Strength must be between 1 and 20"
      }
    ]
  }
}
```

## Custom Error Codes

### Authentication Errors

- `INVALID_CREDENTIALS`: Wrong email or password
- `EMAIL_ALREADY_EXISTS`: Email is already registered
- `TOKEN_EXPIRED`: JWT token has expired
- `TOKEN_INVALID`: JWT token is malformed or invalid
- `REFRESH_TOKEN_INVALID`: Refresh token is invalid or expired
- `OAUTH_ERROR`: OAuth provider authentication failed
- `EMAIL_NOT_VERIFIED`: User email is not verified
- `ACCOUNT_SUSPENDED`: User account is suspended or disabled

### Resource Errors

- `CHARACTER_NOT_FOUND`: Character doesn't exist
- `ITEM_NOT_EQUIPPED`: Item is not currently equipped
- `EQUIPMENT_SLOT_OCCUPIED`: Slot already has an item equipped
- `INSUFFICIENT_REQUIREMENTS`: Character doesn't meet item requirements
- `RACE_ARCHETYPE_MISMATCH`: Invalid race/archetype combination
- `USER_MISMATCH`: User doesn't own the resource

### Validation Errors

- `VALIDATION_ERROR`: General validation failure
- `REQUIRED_FIELD_MISSING`: Required field not provided
- `INVALID_FORMAT`: Field format is incorrect
- `DUPLICATE_RESOURCE`: Resource already exists

### File Upload Errors

- `IMAGE_TOO_LARGE`: Image exceeds size limits
- `INVALID_FILE_TYPE`: File type not supported
- `UPLOAD_FAILED`: File upload process failed

### Business Logic Errors

- `INSUFFICIENT_STATS`: Character stats don't meet requirements
- `EQUIPMENT_CONFLICT`: Equipment slot conflict
- `INVALID_OPERATION`: Operation not allowed in current state

## HTTP Status Codes

- `200`: Success
- `201`: Resource created successfully
- `400`: Bad request (validation errors)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Resource not found
- `409`: Conflict (duplicate resource)
- `422`: Unprocessable entity (business logic error)
- `500`: Internal server error

## Error Response Examples

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

### Authentication Error

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}
```

### Resource Not Found

```json
{
  "success": false,
  "error": {
    "code": "CHARACTER_NOT_FOUND",
    "message": "Character with ID 123 does not exist"
  }
}
```

### Business Logic Error

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_REQUIREMENTS",
    "message": "Character does not meet item requirements",
    "details": [
      {
        "requirement": "strength",
        "required": 15,
        "current": 12
      }
    ]
  }
}
```

---
[← Back to Main Documentation](../README.md)
