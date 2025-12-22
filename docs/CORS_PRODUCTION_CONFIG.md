# CORS Production Configuration

## Overview

The CORS (Cross-Origin Resource Sharing) configuration has been updated to support production domains and global access.

## Current Configuration

### Environment Variables

```env
ALLOWED_ORIGINS=*,https://bilal.metalogics.io,https://www.bilal.metalogics.io,https://frontend-production-metabot.up.railway.app
ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
ALLOWED_HEADERS=Content-Type,Authorization,x-api-key
CORS_CREDENTIALS=true
```

### Supported Origins

1. **Wildcard Access (`*`)**

   - Allows global access from any origin
   - Required for widget embedding on any website
   - Properly handled with credentials support

2. **Custom Domains**

   - `https://bilal.metalogics.io`
   - `https://www.bilal.metalogics.io`
   - Hardcoded in CORS middleware for guaranteed access

3. **Railway Domains**
   - `https://frontend-production-metabot.up.railway.app`
   - Auto-discovery for any `https://*.up.railway.app` domain
   - Supports dynamic Railway deployments

## CORS Middleware Features

### Smart Origin Handling

- **No Origin**: Allows requests without origin (mobile apps, server-to-server)
- **File Protocol**: Supports `file://` for local testing
- **Known Frontends**: Hardcoded support for main frontend
- **Custom Domains**: Explicit support for production domains
- **Railway Auto-Discovery**: Regex-based Railway domain detection
- **Configured Origins**: Environment variable-based configuration

### Security Features

- ✅ **Credentials Support**: Properly handles authentication cookies/headers
- ✅ **Method Restrictions**: Only allows specified HTTP methods
- ✅ **Header Validation**: Controls allowed request headers
- ✅ **Request Logging**: Logs blocked CORS requests for debugging
- ✅ **Legacy Browser Support**: Uses 200 status for OPTIONS requests

## Production Readiness

### Global Access ✅

- Widget can be embedded on any website via wildcard origin
- API accessible from any domain for maximum flexibility

### Domain-Specific Access ✅

- Guaranteed access from production domains
- Fallback support if wildcard is restricted

### Railway Integration ✅

- Auto-discovery of Railway deployment URLs
- No manual configuration needed for new deployments

### Security ✅

- Proper credential handling
- Request validation and logging
- Method and header restrictions

## Testing CORS

### Test Commands

```bash
# Test custom domain
curl -H "Origin: https://bilal.metalogics.io" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     "https://latest-chatbot-production.up.railway.app/api/health"

# Test Railway domain
curl -H "Origin: https://frontend-production-metabot.up.railway.app" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     "https://latest-chatbot-production.up.railway.app/api/health"

# Test widget endpoint
curl -H "Origin: https://bilal.metalogics.io" \
     "https://latest-chatbot-production.up.railway.app/api/bookings/available-slots?startDate=2024-12-25T00:00:00.000Z&endDate=2024-12-30T00:00:00.000Z&duration=30"
```

## Railway Environment Variables

Make sure these are set in Railway:

```env
ALLOWED_ORIGINS=*,https://bilal.metalogics.io,https://www.bilal.metalogics.io,https://frontend-production-metabot.up.railway.app
CORS_CREDENTIALS=true
```

## Widget Integration

The widget can now be embedded on:

- ✅ `bilal.metalogics.io`
- ✅ `www.bilal.metalogics.io`
- ✅ Any other website (via wildcard)
- ✅ Railway frontend deployments

## Status

🟢 **Production Ready** - CORS configuration supports global access and specific production domains.
