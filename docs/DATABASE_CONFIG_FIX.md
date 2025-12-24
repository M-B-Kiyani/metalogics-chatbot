# Database Configuration Fix for Railway

## Critical Issues Found

### 🚨 **Hardcoded Database URL Override**

**Problem**: The `backend/.env` file contained a placeholder database URL that was overriding Railway's actual database connection string.

```bash
# This was preventing Railway's database from being used:
DATABASE_URL=postgresql://username:password@host:port/database
```

**Impact**:

- Railway provides the actual database URL as an environment variable
- The hardcoded placeholder was taking precedence
- This would cause database connection failures in production

**Fix Applied**: Removed the hardcoded value to allow Railway's environment variable to be used:

```bash
# Before
DATABASE_URL=postgresql://username:password@host:port/database

# After
DATABASE_URL=
```

### 🚨 **Hardcoded API Base URL**

**Problem**: The backend `.env` file had a hardcoded API base URL that might not match your current Railway deployment.

```bash
# This might not match your actual Railway URL:
API_BASE_URL=https://latest-chatbot-production.up.railway.app
```

**Fix Applied**: Removed hardcoded URL to allow Railway to set the correct one:

```bash
# Before
API_BASE_URL=https://latest-chatbot-production.up.railway.app

# After
API_BASE_URL=
```

### 🚨 **Placeholder Email Configuration**

**Problem**: Email configuration contained placeholder values that would cause email functionality to fail.

**Fix Applied**: Removed placeholder values:

```bash
# Before
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@metalogics.io

# After
SMTP_USER=
SMTP_PASSWORD=
ADMIN_EMAIL=
```

## Railway Environment Variables Required

### Essential Database Configuration

Railway automatically provides `DATABASE_URL` when you add a PostgreSQL service. **Do not override this in your .env file.**

### Required Environment Variables for Railway

**Backend Service:**

```bash
# Database - Railway provides this automatically
# DATABASE_URL=postgresql://... (provided by Railway PostgreSQL service)

# Essential API Keys
GEMINI_API_KEY=AIzaSy...your_actual_gemini_key
API_KEY=your_secure_api_key_min_32_chars

# Email Configuration (if using email features)
SMTP_USER=your_actual_email@gmail.com
SMTP_PASSWORD=your_actual_app_password
ADMIN_EMAIL=your_admin@email.com
FROM_EMAIL=noreply@yourdomain.com

# Voice Integration (Optional)
RETELL_API_KEY=your_retell_api_key
RETELL_AGENT_ID=your_retell_agent_id
RETELL_ENABLED=true

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend.up.railway.app,https://yourdomain.com
```

**Frontend Service:**

```bash
# Essential
VITE_GEMINI_API_KEY=AIzaSy...your_actual_gemini_key
VITE_API_BASE_URL=https://your-backend.up.railway.app
VITE_API_KEY=your_secure_api_key

# Voice Integration (Optional)
VITE_RETELL_API_KEY=your_retell_api_key
VITE_RETELL_AGENT_ID=your_retell_agent_id
```

## Database Configuration Verification

### 1. Check Railway Database Service

- Ensure you have a PostgreSQL service added to your Railway project
- Railway will automatically provide `DATABASE_URL` environment variable
- The URL format will be: `postgresql://username:password@host:port/database`

### 2. Verify Database Connection

After deployment, check the backend logs for:

```
📋 CONFIGURATION SUMMARY
...
💾 Database:
   Pool Size: 20
   Connection Timeout: 10000ms

✅ Database connection established
```

### 3. Test Database Health

```bash
curl https://your-backend.up.railway.app/api/health
```

Should return:

```json
{
  "status": "ok",
  "database": {
    "status": "healthy",
    "responseTime": 25
  }
}
```

## Common Database Issues

### Issue: "Database connection failed"

**Causes**:

1. No PostgreSQL service added to Railway project
2. Hardcoded `DATABASE_URL` in `.env` file overriding Railway's URL
3. Database service not ready during deployment

**Solutions**:

1. Add PostgreSQL service in Railway dashboard
2. Remove any hardcoded `DATABASE_URL` from `.env` files
3. Wait for database service to be fully provisioned

### Issue: "Prisma client initialization failed"

**Cause**: Database URL format issues or connection problems

**Solution**:

1. Check Railway logs for database connection errors
2. Verify PostgreSQL service is running
3. Ensure `npx prisma generate` runs during build

### Issue: "Connection pool exhausted"

**Cause**: Too many concurrent connections

**Solution**: Adjust `DATABASE_POOL_SIZE` environment variable (default: 20)

## Deployment Checklist

- [ ] **Remove hardcoded `DATABASE_URL`** from `backend/.env`
- [ ] **Add PostgreSQL service** in Railway dashboard
- [ ] **Set required environment variables** in Railway
- [ ] **Remove hardcoded `API_BASE_URL`** from `backend/.env`
- [ ] **Configure email settings** (if using email features)
- [ ] **Deploy and test** database connectivity
- [ ] **Run database migrations** if needed
- [ ] **Verify health endpoint** returns database status

## Database Migration Commands

If you need to run database migrations after deployment:

```bash
# In Railway backend service terminal or locally with production DATABASE_URL
npx prisma migrate deploy
npx prisma generate
```

## Security Notes

- **Never commit actual database URLs** to version control
- **Use Railway's provided DATABASE_URL** - don't override it
- **Ensure database is only accessible** from your Railway services
- **Use connection pooling** to manage database connections efficiently

The main issue was that hardcoded values in the `.env` file were preventing Railway's environment variables from being used. These fixes ensure Railway can properly provide and manage your database connection.
