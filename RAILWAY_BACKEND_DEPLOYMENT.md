# Railway Backend Deployment Guide

## 🎯 Target URL: `https://metalogics-chatbot-production.up.railway.app`

## 📋 Deployment Steps

### 1. **Create New Railway Project**

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `metalogics-chatbot`
5. Select the `backend` folder as the root directory

### 2. **Configure Service Settings**

1. In Railway dashboard, go to your project
2. Click on the backend service
3. Go to "Settings" tab
4. Under "Service Name", change it to: `metalogics-chatbot-production`
5. Under "Custom Domain", you can optionally add a custom domain

### 3. **Set Environment Variables**

Add these environment variables in Railway dashboard → Variables tab:

```bash
# Essential Variables
NODE_ENV=production
DATABASE_URL=postgresql://...  # Auto-provided by Railway PostgreSQL service
API_KEY=7eaeb10d330789a82e0883d89393cf57fcbc4771935a4b389f1f1ec4f924f2a5

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Metalogics AI Assistant

# CORS Configuration
ALLOWED_ORIGINS=https://frontend-production-metabot.up.railway.app,https://metalogics-chatbot-production.up.railway.app,https://bilal.metalogics.io

# Optional Integrations
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
HUBSPOT_ENABLED=true
HUBSPOT_ACCESS_TOKEN=your-token
RETELL_ENABLED=true
RETELL_API_KEY=your-key
RETELL_AGENT_ID=your-agent-id
```

### 4. **Add PostgreSQL Database**

1. In Railway dashboard, click "New Service"
2. Select "PostgreSQL"
3. Railway will automatically set the `DATABASE_URL` environment variable

### 5. **Deploy**

1. Railway will automatically deploy when you push to the main branch
2. Monitor the deployment logs in Railway dashboard
3. Once deployed, your backend will be available at: `https://metalogics-chatbot-production.up.railway.app`

### 6. **Test Deployment**

```bash
# Test health endpoint
curl https://metalogics-chatbot-production.up.railway.app/health

# Test API health
curl https://metalogics-chatbot-production.up.railway.app/api/health

# Test CORS
curl -X OPTIONS -H "Origin: https://frontend-production-metabot.up.railway.app" \
  https://metalogics-chatbot-production.up.railway.app/api/bookings
```

## 🔧 Alternative: Update Existing Deployment

If you already have a Railway deployment at `latest-chatbot-production`, you can:

### Option A: Rename Existing Service

1. Go to Railway dashboard
2. Click on your existing backend service
3. Go to Settings → Service Name
4. Change from `latest-chatbot-production` to `metalogics-chatbot-production`
5. The URL will automatically update

### Option B: Create New Deployment

1. Follow steps 1-6 above to create a completely new deployment
2. Once the new deployment is working, delete the old one

## 🚨 Important Notes

1. **Database Migration**: If you're moving from an existing deployment, you'll need to:

   - Export data from the old database
   - Import it to the new database
   - Or connect the new service to the existing database

2. **Environment Variables**: Make sure all environment variables are copied from the old deployment to the new one

3. **Custom Domains**: If you have custom domains pointing to the old deployment, update them to point to the new one

4. **Frontend Update**: The frontend is already configured to use the new URL, so it will automatically connect once the backend is deployed

## ✅ Verification Checklist

- [ ] Backend deployed at `https://metalogics-chatbot-production.up.railway.app`
- [ ] Health endpoint returns 200: `/health`
- [ ] API health endpoint returns 200: `/api/health`
- [ ] Database connection working
- [ ] CORS configured for frontend domain
- [ ] Environment variables set correctly
- [ ] Frontend can connect to backend
- [ ] Booking functionality works
- [ ] Voice integration works (if enabled)

## 🆘 Troubleshooting

### Backend Returns 502 Bad Gateway

- Check Railway deployment logs for errors
- Verify all environment variables are set
- Ensure DATABASE_URL is connected
- Check if the service is running

### CORS Errors

- Verify ALLOWED_ORIGINS includes frontend domain
- Check CORS middleware configuration
- Test with curl commands above

### Database Connection Issues

- Verify PostgreSQL service is running
- Check DATABASE_URL format
- Review connection timeout settings

---

**Ready to deploy!** Follow the steps above to get your backend running at the desired URL.
