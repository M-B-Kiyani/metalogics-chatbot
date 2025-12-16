# Configuration Management System

This directory contains the configuration management system for the Metalogics Backend API. The system provides type-safe, validated access to environment variables with support for different environments.

## Overview

The configuration system:

- ✅ Loads and validates environment variables on startup
- ✅ Provides type-safe access to configuration values
- ✅ Supports multiple environments (development, staging, production, test)
- ✅ Validates required variables and provides helpful error messages
- ✅ Transforms string values to appropriate types (numbers, booleans, arrays)
- ✅ Provides sensible defaults for optional configuration

## Files

- **`index.ts`** - Main configuration module with validation and type definitions
- **`database.client.ts`** - Database client with connection management
- **`.env`** - Environment-specific configuration (not committed to git)
- **`.env.example`** - Template with all available configuration options

## Usage

### Importing Configuration

```typescript
import { config } from "./config";

// Access configuration values
const port = config.server.port;
const dbUrl = config.database.url;
const apiKey = config.auth.apiKey;
```

### Configuration Sections

#### Server Configuration

```typescript
config.server.nodeEnv; // Environment: development, staging, production, test
config.server.port; // Port number (default: 3000)
config.server.apiBaseUrl; // Base URL for the API
config.server.requestTimeout; // Request timeout in milliseconds (default: 30000)
```

#### Database Configuration

```typescript
config.database.url; // PostgreSQL connection string
config.database.poolSize; // Connection pool size (default: 20)
config.database.connectionTimeout; // Connection timeout in ms (default: 10000)
config.database.queryTimeout; // Query timeout in ms (default: 10000)
```

#### Email Configuration

```typescript
config.email.smtpHost; // SMTP server hostname
config.email.smtpPort; // SMTP server port
config.email.smtpUser; // SMTP authentication username
config.email.smtpPassword; // SMTP authentication password
config.email.adminEmail; // Administrator email address
config.email.fromEmail; // Email address to send from
config.email.fromName; // Name to display in "From" field
config.email.retryAttempts; // Number of retry attempts (default: 3)
config.email.retryDelay; // Initial retry delay in ms (default: 2000)
```

#### Authentication Configuration

```typescript
config.auth.apiKey; // API key for authentication (min 32 characters)
config.auth.apiKeyHeader; // Header name for API key (default: "Authorization")
```

#### Logging Configuration

```typescript
config.logging.level; // Log level: error, warn, info, debug
config.logging.filePath; // Path to log file (optional)
config.logging.enableConsole; // Enable console logging (default: true)
config.logging.enableFile; // Enable file logging (default: false in dev, true in prod)
config.logging.maxFileSize; // Max log file size (default: "20m")
config.logging.maxFiles; // Max number of log files to keep (default: "14d")
```

#### Rate Limiting Configuration

```typescript
config.rateLimit.windowMs; // Time window in ms (default: 60000)
config.rateLimit.maxRequests; // Max requests per window (default: 100)
config.rateLimit.skipSuccessfulRequests; // Skip counting successful requests (default: false)
```

#### CORS Configuration

```typescript
config.cors.allowedOrigins; // Array of allowed origins
config.cors.allowedMethods; // Array of allowed HTTP methods
config.cors.allowedHeaders; // Array of allowed headers
config.cors.credentials; // Allow credentials (default: true)
config.cors.maxAge; // Preflight cache duration in seconds (default: 86400)
```

### Helper Functions

```typescript
import {
  isProduction,
  isDevelopment,
  isTest,
  getEnvironment,
  printConfigSummary,
} from "./config";

// Check environment
if (isProduction()) {
  // Production-specific logic
}

// Get environment name
const env = getEnvironment(); // 'development' | 'staging' | 'production' | 'test'

// Print configuration summary (useful for debugging)
printConfigSummary();
```

## Environment Variables

All environment variables are defined in the `.env` file. See `.env.example` for a complete list with documentation.

### Required Variables

These variables **must** be set for the application to start:

- `DATABASE_URL` - PostgreSQL connection string
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP authentication username
- `SMTP_PASSWORD` - SMTP authentication password
- `ADMIN_EMAIL` - Administrator email address
- `API_KEY` - API key (minimum 32 characters)

### Optional Variables

These variables have sensible defaults but can be customized:

- `NODE_ENV` - Environment (default: "development")
- `PORT` - Server port (default: 3000)
- `DATABASE_POOL_SIZE` - Connection pool size (default: 20)
- `LOG_LEVEL` - Logging level (default: "info")
- `RATE_LIMIT_MAX_REQUESTS` - Rate limit (default: 100)
- And many more... see `.env.example`

## Validation

The configuration system validates all environment variables on startup using Zod schemas. If validation fails, the application will:

1. Print detailed error messages showing which variables are invalid
2. Provide helpful hints about what's expected
3. Exit with a non-zero status code

Example validation error:

```
❌ Environment variable validation failed:

  - DATABASE_URL: DATABASE_URL is required
  - API_KEY: API_KEY must be at least 32 characters
  - SMTP_USER: SMTP_USER must be a valid email

💡 Please check your .env file and ensure all required variables are set.
   Refer to .env.example for the complete list of required variables.
```

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
LOG_LEVEL=debug
LOG_ENABLE_FILE=false
ALLOWED_ORIGINS=http://localhost:5173
```

### Staging

```bash
NODE_ENV=staging
LOG_LEVEL=info
LOG_ENABLE_FILE=true
ALLOWED_ORIGINS=https://staging.metalogics.io
```

### Production

```bash
NODE_ENV=production
LOG_LEVEL=warn
LOG_ENABLE_FILE=true
ALLOWED_ORIGINS=https://metalogics.io,https://www.metalogics.io
RATE_LIMIT_MAX_REQUESTS=50
```

## Testing Configuration

To verify your configuration is set up correctly:

```bash
# Run the configuration verification script
npm run verify:config

# Or directly with ts-node
npx ts-node src/scripts/verify-config.ts
```

This will:

- Load and validate all configuration
- Print a summary of all configuration sections
- Verify that all required variables are set
- Show helpful error messages if anything is wrong

## Best Practices

1. **Never commit `.env` files** - They contain sensitive information
2. **Always update `.env.example`** - When adding new configuration options
3. **Use strong API keys** - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. **Validate early** - Configuration is validated on startup, so errors are caught immediately
5. **Use type-safe access** - Always import and use the `config` object instead of `process.env`
6. **Document new options** - Add comments to `.env.example` for any new configuration

## Troubleshooting

### "Environment variable validation failed"

- Check that all required variables are set in your `.env` file
- Refer to `.env.example` for the complete list
- Ensure values match the expected format (e.g., valid email addresses, URLs)

### "API_KEY must be at least 32 characters"

- Generate a secure API key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Update the `API_KEY` variable in your `.env` file

### "DATABASE_URL is required"

- Ensure you have a valid PostgreSQL connection string
- Format: `postgresql://username:password@host:port/database`

### Configuration not loading

- Ensure the `.env` file is in the `backend` directory
- Check that the file is named exactly `.env` (not `.env.txt` or similar)
- Verify file permissions allow reading

## Migration from Direct `process.env` Access

If you're migrating from direct `process.env` access:

**Before:**

```typescript
const port = parseInt(process.env.PORT || "3000", 10);
const apiKey = process.env.API_KEY;
```

**After:**

```typescript
import { config } from "./config";

const port = config.server.port;
const apiKey = config.auth.apiKey;
```

Benefits:

- ✅ Type safety - TypeScript knows the types
- ✅ Validation - Invalid values caught on startup
- ✅ Defaults - No need to handle undefined values
- ✅ Centralized - All configuration in one place
