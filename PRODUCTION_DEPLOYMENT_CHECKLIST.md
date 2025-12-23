# Production Deployment Checklist for Railway

## ✅ Port & Host Configuration (FIXED)

### Backend Server Configuration

- ✅ **Server listens on `0.0.0.0`** (not `127.0.0.1` or `localhost`)
- ✅ **Port uses `process.env.PORT`** (Railway provides this automatically)
- ✅ **Dockerfile health check uses `0.0.0.0`** (fixed from `127.0.0.1`)

### Configuration Details

```typescript
// backend/src/server.ts - Line 84
server = app.listen(PORT, "0.0.0.0", () => {
  logger.info("Server started successfully", {
    port: PORT,
    environment: NODE_ENV,
    version: VERSION,
  });
});
```

```dockerfile
# backend/Dockerfile - Health check fixed
RUN echo '#!/bin/sh\ncurl -f http://0.0.0.0:${PORT:-3000}/health || exit 1' > /healthcheck.sh
```

## 🚀 Railway Deployment Configuration

### Railway.json Configuration

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Required Environment Variables for Railway

#### Essential Variables

```bash
# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://...  # Auto-provided by Railway PostgreSQL service

# Authentication
API_KEY=your-secure-api-key-min-32-characters-long
WIDGET_API_KEY=your-public-widget-key

# Server
NODE_ENV=production
# PORT is auto-provided by Railway - DO NOT SET MANUALLY

# CORS (Update with your actual frontend URL)
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-widget-domain.com
```

#### Email Configuration

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Company Name
```

#### Optional Integrations

```bash
# Google Calendar
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # Full JSON as string
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com

# HubSpot CRM
HUBSPOT_ENABLED=true
HUBSPOT_ACCESS_TOKEN=your-hubspot-token

# Retell AI Voice
RETELL_ENABLED=true
RETELL_API_KEY=your-retell-api-key
RETELL_AGENT_ID=your-agent-id
```

## 🔧 Production Optimizations

### 1. Logging Configuration

```bash
LOG_LEVEL=info
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=false  # Railway handles log aggregation
```

### 2. Performance Settings

```bash
REQUEST_TIMEOUT=30000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Configuration

```bash
DATABASE_POOL_SIZE=20
DATABASE_CONNECTION_TIMEOUT=10000
DATABASE_QUERY_TIMEOUT=10000
```

## 📋 Deployment Steps

### 1. Connect Railway to GitHub

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Choose the backend folder as the root

### 2. Configure Environment Variables

1. In Railway dashboard, go to your project
2. Click "Variables" tab
3. Add all required environment variables from the list above
4. **DO NOT set PORT** - Railway provides this automatically

### 3. Add PostgreSQL Database

1. In Railway dashboard, click "New Service"
2. Select "PostgreSQL"
3. Railway will automatically set `DATABASE_URL`

### 4. Deploy

1. Railway will automatically deploy when you push to main branch
2. Check deployment logs for any issues
3. Test health endpoint: `https://your-app.railway.app/health`

## 🧪 Testing Production Deployment

### Health Checks

```bash
# Test basic health
curl https://your-app.railway.app/health

# Test API health with detailed info
curl https://your-app.railway.app/api/health
```

### API Endpoints

```bash
# Test booking endpoint
curl -X POST https://your-app.railway.app/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"name":"Test","email":"test@example.com","date":"2024-12-24T10:00:00Z","duration":30}'
```

## 🔒 Security Checklist

- ✅ API keys are secure (32+ characters)
- ✅ CORS origins are restricted to your domains
- ✅ Database credentials are secure
- ✅ No sensitive data in logs
- ✅ Rate limiting is enabled
- ✅ Input sanitization is active

## 🚨 Common Issues & Solutions

### Issue: "EADDRINUSE" Error

**Cause:** Port already in use or hardcoded port
**Solution:** Ensure code uses `process.env.PORT` and listens on `0.0.0.0`

### Issue: Health Check Fails

**Cause:** Health check using wrong host
**Solution:** Use `0.0.0.0` instead of `127.0.0.1` in health checks

### Issue: Database Connection Fails

**Cause:** Wrong DATABASE_URL or connection timeout
**Solution:** Check Railway PostgreSQL service is running and DATABASE_URL is correct

### Issue: CORS Errors

**Cause:** Frontend domain not in ALLOWED_ORIGINS
**Solution:** Add your frontend domain to ALLOWED_ORIGINS environment variable

## 📊 Monitoring

### Railway Metrics

- CPU usage
- Memory usage
- Request count
- Response times
- Error rates

### Application Logs

```bash
# View logs in Railway dashboard
# Or use Railway CLI
railway logs
```

### Health Monitoring

Set up external monitoring to ping:

- `https://your-app.railway.app/health`
- `https://your-app.railway.app/api/health`

## 🎯 Performance Recommendations

1. **Enable Database Connection Pooling** (already configured)
2. **Use Environment-based Logging** (configured for production)
3. **Implement Request Timeout** (30s configured)
4. **Enable Rate Limiting** (100 req/min configured)
5. **Monitor Resource Usage** (use Railway metrics)

---

## ✅ Status: PRODUCTION READY

Your application is now configured for production deployment on Railway with:

- ✅ Correct host binding (`0.0.0.0`)
- ✅ Dynamic port configuration (`process.env.PORT`)
- ✅ Production-optimized Docker configuration
- ✅ Proper health checks
- ✅ Security configurations
- ✅ Performance optimizations

Deploy with confidence! 🚀
