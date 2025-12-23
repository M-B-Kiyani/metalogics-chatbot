# Railway Environment Variables Checklist

## 🔑 **Required Environment Variables**

Copy these to your Railway Dashboard → Variables tab:

### **Essential Variables**

```bash
NODE_ENV=production
API_KEY=7eaeb10d330789a82e0883d89393cf57fcbc4771935a4b389f1f1ec4f924f2a5
```

### **Database** (Auto-set by Railway PostgreSQL service)

```bash
DATABASE_URL=postgresql://...  # This should appear automatically when you add PostgreSQL service
```

### **Email Configuration**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Metalogics AI Assistant
```

### **CORS Configuration**

```bash
ALLOWED_ORIGINS=https://frontend-production-metabot.up.railway.app,https://metalogics-chatbot-production.up.railway.app,https://bilal.metalogics.io,*
```

### **Optional Integrations** (Set if you want to use them)

```bash
# Google Calendar
GOOGLE_CALENDAR_ENABLED=false
GOOGLE_SERVICE_ACCOUNT_KEY=
GOOGLE_CALENDAR_ID=primary

# HubSpot CRM
HUBSPOT_ENABLED=false
HUBSPOT_ACCESS_TOKEN=

# Retell AI Voice
RETELL_ENABLED=false
RETELL_API_KEY=
RETELL_AGENT_ID=
```

## 🚨 **Critical Steps**

1. **Add PostgreSQL Service First**

   - In Railway Dashboard, click "New Service"
   - Select "PostgreSQL"
   - Wait for it to deploy
   - DATABASE_URL will appear automatically in Variables

2. **Set Environment Variables**

   - Go to Variables tab
   - Add all the variables above
   - **Don't set PORT** - Railway provides this automatically

3. **Redeploy**
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment
   - Or push a small change to trigger redeploy

## 🔍 **Common Issues**

### Issue: "Application failed to respond"

**Cause:** Missing DATABASE_URL or other critical env vars
**Solution:** Ensure PostgreSQL service is added and all required vars are set

### Issue: Build fails

**Cause:** Missing dependencies or TypeScript errors
**Solution:** Check build logs, fix any compilation errors

### Issue: Database connection fails

**Cause:** DATABASE_URL not set or PostgreSQL service not running
**Solution:** Add PostgreSQL service, verify DATABASE_URL is auto-set

## ✅ **Verification Steps**

After setting environment variables and redeploying:

1. **Check Service Status**

   - Service should show "Active" (not "Crashed" or "Failed")

2. **Test Endpoints**

   ```bash
   curl https://metalogics-chatbot-production.up.railway.app/health
   curl https://metalogics-chatbot-production.up.railway.app/api/health
   ```

3. **Check Logs**
   - Go to Deployments → Latest → Deploy Logs
   - Should see "Server started successfully" message

## 🆘 **If Still Not Working**

1. **Share Railway Logs**

   - Copy build logs and deploy logs
   - Look for specific error messages

2. **Verify File Structure**

   - Ensure `dist/server.js` exists after build
   - Check that `npm run build` completes successfully

3. **Test Locally**
   ```bash
   cd backend
   npm run build
   npm start
   # Should start without errors
   ```
