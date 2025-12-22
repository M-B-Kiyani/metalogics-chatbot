# Railway Deployment Guide

This guide explains how to deploy the three separate services (backend, frontend, widget) to Railway.

## Repository Structure

```
/
├── backend/          # API service
│   ├── Dockerfile
│   ├── railway.json
│   ├── package.json
│   └── src/
├── frontend/         # Website/dashboard
│   ├── Dockerfile
│   ├── railway.json
│   ├── package.json
│   ├── components/
│   └── services/
├── widget/          # Embeddable chatbot widget
│   ├── Dockerfile
│   ├── railway.json
│   ├── package.json
│   └── src/
└── package.json     # Root monorepo management
```

## Deployment Steps

### 1. Backend Service

1. **Create Railway Service:**

   - Connect your GitHub repository
   - Set root directory to `backend`
   - Railway will automatically detect the Dockerfile

2. **Environment Variables:**

   ```bash
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://...  # Railway will provide this
   API_KEY=your-secure-api-key-min-32-characters-long
   WIDGET_API_KEY=your-public-widget-key-for-embeds
   ALLOWED_ORIGINS=*
   ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
   ALLOWED_HEADERS=Content-Type,Authorization,x-api-key

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ADMIN_EMAIL=admin@metalogics.io

   # Optional: Google Calendar
   GOOGLE_CALENDAR_ENABLED=false

   # Optional: HubSpot CRM
   HUBSPOT_ENABLED=false

   # Optional: Retell AI Voice
   RETELL_ENABLED=false
   ```

3. **Database:**

   - Add PostgreSQL plugin in Railway
   - DATABASE_URL will be automatically set

4. **Custom Domain (Optional):**
   - Add your custom domain in Railway settings
   - Update ALLOWED_ORIGINS if needed

### 2. Frontend Service

1. **Create Railway Service:**

   - Connect the same GitHub repository
   - Set root directory to `frontend`
   - Railway will detect the Dockerfile

2. **Environment Variables:**

   ```bash
   VITE_API_BASE_URL=https://your-backend-url.up.railway.app
   VITE_API_KEY=your-secure-api-key-min-32-characters-long
   VITE_GEMINI_API_KEY=your-gemini-api-key
   ```

3. **Build Configuration:**
   - Build command: `npm run build`
   - Start command: `serve -s dist -l $PORT`

### 3. Widget Service

1. **Create Railway Service:**

   - Connect the same GitHub repository
   - Set root directory to `widget`
   - Railway will detect the Dockerfile

2. **Environment Variables:**

   ```bash
   VITE_API_URL=https://your-backend-url.up.railway.app
   PUBLIC_WIDGET_KEY=your-public-widget-key-for-embeds
   NODE_ENV=production
   ```

3. **Build Configuration:**
   - Build command: `npm run build` (handled by Dockerfile)
   - Start command: `serve -s dist -l 0.0.0.0:$PORT --cors` (handled by Dockerfile)
   - Health check: `/metalogics-chatbot.iife.js`

## Service URLs

After deployment, you'll have three services:

- **Backend API:** `https://backend-service.up.railway.app`
- **Frontend:** `https://frontend-service.up.railway.app`
- **Widget:** `https://widget-service.up.railway.app`

## Widget Integration

To embed the widget on external websites:

```html
<!-- Load the widget script -->
<script
  src="https://widget-service.up.railway.app/metalogics-chatbot.iife.js"
  data-api-key="your-public-widget-key-for-embeds"
  data-api-url="https://backend-service.up.railway.app"
  data-brand-color="#3b82f6"
  data-position="bottom-right"
></script>

<!-- Load the widget styles -->
<link
  rel="stylesheet"
  href="https://widget-service.up.railway.app/metalogics-chatbot.css"
/>
```

## Security Configuration

### CORS Settings

The backend is configured to allow:

- All origins (`*`) for widget embedding
- Required headers: `Content-Type`, `Authorization`, `x-api-key`
- All standard HTTP methods

### API Keys

- **API_KEY**: Main API key for admin/frontend access
- **WIDGET_API_KEY**: Public key for widget embedding (less privileged)

### Rate Limiting

- Standard endpoints: 100 requests/minute
- Widget endpoints: 30 requests/minute
- Health endpoints: No rate limiting

## Health Checks

All services include health check endpoints:

- Backend: `/health`
- Frontend: Served by static file server
- Widget: Served by static file server

## Monitoring

Check service health:

```bash
# Backend API
curl https://backend-service.up.railway.app/health

# Frontend (should return HTML)
curl https://frontend-service.up.railway.app

# Widget (should return JS file)
curl https://widget-service.up.railway.app/metalogics-chatbot.iife.js
```

## Troubleshooting

### Common Issues

1. **CORS Errors:**

   - Ensure `ALLOWED_ORIGINS=*` in backend
   - Check widget is using correct API URL

2. **Widget Not Loading:**

   - Verify widget service is deployed
   - Check browser console for errors
   - Ensure API key is correct
   - Test widget files directly: `https://widget-service.up.railway.app/metalogics-chatbot.iife.js`

3. **API Errors:**

   - Check backend logs in Railway dashboard
   - Verify environment variables are set
   - Test health endpoint

4. **Widget Deployment Failures:**
   - Ensure root directory is set to `widget` in Railway
   - Check that Dockerfile builds successfully locally
   - Verify environment variables are set correctly
   - Check Railway build logs for specific errors
   - Ensure PORT environment variable is available

### Logs

View logs in Railway dashboard:

- Go to your service
- Click "Deployments" tab
- Click on latest deployment
- View logs in real-time

## Production Checklist

- [ ] Backend deployed with health check passing
- [ ] Frontend deployed and accessible
- [ ] Widget deployed and JS/CSS files accessible
- [ ] Database connected and migrations run
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] API keys generated and secured
- [ ] Widget integration tested on external site
- [ ] Health checks responding
- [ ] Logs showing no errors

## Support

For deployment issues:

- Check Railway documentation
- Review service logs
- Test individual endpoints
- Verify environment variables
