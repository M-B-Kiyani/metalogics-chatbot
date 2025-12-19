# 🚨 Railway Backend Deployment Fix

## Problem

Railway is currently serving your frontend React app instead of your backend API. When you visit:

```
https://metalogics-chatbot-production.up.railway.app/api/health
```

You get HTML instead of JSON, which means the backend isn't running.

## 🔧 Solution Options

### Option 1: Fix Current Deployment (Quick)

1. **Go to your Railway dashboard**
2. **Click on your service**
3. **Go to Settings → Service Settings**
4. **Update these settings:**

   **Root Directory:** `backend`
   **Build Command:** `npm ci && npm run build && npx prisma generate`
   **Start Command:** `npm start`

5. **Redeploy the service**

### Option 2: Create New Backend-Only Service (Recommended)

1. **In Railway dashboard, create a NEW service**
2. **Connect to your GitHub repo**
3. **Set Root Directory to:** `backend`
4. **Railway will auto-detect it's a Node.js app**
5. **Configure environment variables** (see below)

### Option 3: Use Railway CLI (Advanced)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set root directory
railway service --root backend

# Deploy
railway up
```

## 🔧 Required Environment Variables

In Railway dashboard → Variables, add these:

```bash
# Server
NODE_ENV=production
PORT=3000

# Database (Railway auto-provides this)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Email Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=bilal@metalogics.io
SMTP_PASSWORD=BKiani123@0
ADMIN_EMAIL=bilal@metalogics.io
FROM_EMAIL=bilal@metalogics.io
FROM_NAME=Metalogics AI Assistant

# API Security
API_KEY=7dfeeaff41d8eb72c8e006524b69e4b57116a4dfb2314a0b068c9776c627430e

# CORS (Allow your domain)
ALLOWED_ORIGINS=https://bilal.metalogics.io,https://www.bilal.metalogics.io

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Retell AI (Optional - for voice)
RETELL_API_KEY=your_retell_api_key_here
RETELL_AGENT_ID=your_retell_agent_id_here
RETELL_ENABLED=true

# Google Calendar (Optional)
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
GOOGLE_CALENDAR_TIMEZONE=Europe/London

# HubSpot (Optional)
HUBSPOT_ENABLED=true
HUBSPOT_ACCESS_TOKEN=your_hubspot_access_token_here
```

## 🗄️ Add PostgreSQL Database

1. **In Railway project, click "New"**
2. **Select "Database" → "PostgreSQL"**
3. **Railway will auto-connect it to your service**
4. **The DATABASE_URL will be automatically set**

## 🧪 Test After Fix

Once fixed, test these endpoints:

```bash
# Health check
curl https://metalogics-chatbot-production.up.railway.app/api/health

# Should return:
{
  "status": "healthy",
  "timestamp": "2024-12-16T...",
  "version": "1.0.0"
}

# Test chat endpoint
curl -X POST https://metalogics-chatbot-production.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","sessionId":"test123"}'

# Should return:
{
  "response": "Hello! How can I help you today?"
}
```

## 🚀 Quick Fix Steps (Recommended)

1. **Go to Railway dashboard**
2. **Settings → Service Settings**
3. **Set Root Directory:** `backend`
4. **Set Build Command:** `npm ci && npm run build && npx prisma generate`
5. **Set Start Command:** `npm start`
6. **Add environment variables** (see list above)
7. **Add PostgreSQL database**
8. **Redeploy**
9. **Test:** `curl https://your-url.railway.app/api/health`

## 📋 Checklist

- [ ] Root directory set to `backend`
- [ ] Build command updated
- [ ] Start command updated
- [ ] Environment variables added
- [ ] PostgreSQL database added
- [ ] Service redeployed
- [ ] Health endpoint returns JSON
- [ ] Chat endpoint works
- [ ] No errors in Railway logs

## 🆘 If Still Not Working

1. **Check Railway logs** for errors
2. **Verify environment variables** are set correctly
3. **Make sure PostgreSQL is connected**
4. **Check that Prisma migrations ran**

Run migrations manually if needed:

```bash
# In Railway terminal
npx prisma migrate deploy
```

## ✅ Success Indicators

When fixed, you should see:

1. **Health endpoint returns JSON:**

   ```json
   { "status": "healthy", "timestamp": "..." }
   ```

2. **Railway logs show:**

   ```
   Server started successfully on port 3000
   Database connection established
   ```

3. **No HTML responses** from API endpoints

Once this is fixed, you can proceed with widget integration!
