# 🚀 Production Backend Deployment Guide

## Complete Guide to Deploy Your Backend and Get Production URL

This guide covers multiple deployment options for your Node.js/Express backend with PostgreSQL database.

---

## 📋 Table of Contents

1. [Quick Comparison](#quick-comparison)
2. [Option 1: Railway (Recommended - Easiest)](#option-1-railway-recommended)
3. [Option 2: Render](#option-2-render)
4. [Option 3: Heroku](#option-3-heroku)
5. [Option 4: DigitalOcean App Platform](#option-4-digitalocean)
6. [Option 5: AWS (Advanced)](#option-5-aws)
7. [Option 6: Hostinger VPS](#option-6-hostinger-vps)
8. [Environment Variables Setup](#environment-variables-setup)
9. [Database Setup](#database-setup)
10. [Testing Your Deployment](#testing-deployment)

---

## Quick Comparison

| Platform          | Cost      | Ease       | Database     | Best For                 |
| ----------------- | --------- | ---------- | ------------ | ------------------------ |
| **Railway**       | $5/mo     | ⭐⭐⭐⭐⭐ | Included     | Beginners, Quick setup   |
| **Render**        | Free tier | ⭐⭐⭐⭐   | Included     | Free testing             |
| **Heroku**        | $7/mo     | ⭐⭐⭐⭐   | Add-on       | Established platform     |
| **DigitalOcean**  | $5/mo     | ⭐⭐⭐     | Separate     | Scalability              |
| **AWS**           | Variable  | ⭐⭐       | Separate     | Enterprise               |
| **Hostinger VPS** | $4/mo     | ⭐⭐       | Self-managed | Existing Hostinger users |

---

## Option 1: Railway (Recommended) ⭐

**Best for:** Quick deployment, automatic database setup, great developer experience

### Why Railway?

- ✅ Easiest deployment process
- ✅ PostgreSQL database included
- ✅ Automatic HTTPS
- ✅ GitHub integration
- ✅ Free $5 credit, then $5/month
- ✅ WebSocket support (for Retell voice)

### Step-by-Step Deployment:

#### 1. Prepare Your Backend

Create `backend/.env.production` (don't commit this):

```bash
NODE_ENV=production
PORT=3000
```

Create `backend/Procfile`:

```
web: npm start
```

Ensure your `backend/package.json` has:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "postinstall": "npm run build && npx prisma generate"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 2. Sign Up for Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub

#### 3. Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select your repository
5. Railway will detect it's a Node.js app

#### 4. Add PostgreSQL Database

1. In your project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway creates database automatically
4. Copy the `DATABASE_URL` from database settings

#### 5. Configure Environment Variables

In Railway project settings → Variables, add:

```bash
# Server
NODE_ENV=production
PORT=3000
API_BASE_URL=https://your-app.railway.app

# Database (automatically set by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Email
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=bilal@metalogics.io
SMTP_PASSWORD=BKiani123@0
ADMIN_EMAIL=bilal@metalogics.io
FROM_EMAIL=bilal@metalogics.io
FROM_NAME=Metalogics AI Assistant

# API Security
API_KEY=7dfeeaff41d8eb72c8e006524b69e4b57116a4dfb2314a0b068c9776c627430e

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Google Calendar
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
GOOGLE_CALENDAR_TIMEZONE=Europe/London

# HubSpot
HUBSPOT_ENABLED=true
HUBSPOT_ACCESS_TOKEN=your_hubspot_access_token_here

# Retell AI
RETELL_API_KEY=your_retell_api_key_here
RETELL_AGENT_ID=your_retell_agent_id_here
RETELL_ENABLED=true

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 6. Upload Google Service Account Key

For Google Calendar integration:

1. In Railway, go to your service
2. Click "Settings" → "Volumes"
3. Create a volume and mount at `/app/backend`
4. Upload `metalogics-chatbot-0cbe5759fdfc.json`

Or use environment variable:

```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

#### 7. Deploy

1. Railway automatically deploys on push to GitHub
2. Or click "Deploy" manually
3. Wait 2-3 minutes for build

#### 8. Get Your Production URL

1. Go to Settings → Domains
2. Railway provides: `your-app.railway.app`
3. Or add custom domain: `api.yourdomain.com`

**Your backend URL:**

```
https://your-app.railway.app
```

#### 9. Run Database Migrations

In Railway terminal:

```bash
npx prisma migrate deploy
```

#### 10. Test Your Backend

```bash
curl https://your-app.railway.app/api/health
```

Should return:

```json
{
  "status": "healthy",
  "timestamp": "2024-12-08T...",
  "version": "1.0.0"
}
```

---

## Option 2: Render

**Best for:** Free tier testing, automatic deployments

### Step-by-Step:

#### 1. Sign Up

1. Go to https://render.com
2. Sign up with GitHub

#### 2. Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name:** metalogics-backend
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install && npm run build && npx prisma generate`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free (or Starter $7/mo for always-on)

#### 3. Add PostgreSQL Database

1. Click "New +" → "PostgreSQL"
2. Name: metalogics-db
3. Plan: Free (or Starter $7/mo)
4. Copy Internal Database URL

#### 4. Add Environment Variables

In Web Service → Environment:

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=<from PostgreSQL service>
# ... add all other env vars from Railway example
```

#### 5. Deploy

- Render auto-deploys on GitHub push
- First deploy takes 5-10 minutes

**Your URL:**

```
https://metalogics-backend.onrender.com
```

**Note:** Free tier spins down after 15 min inactivity (cold starts)

---

## Option 3: Heroku

**Best for:** Established platform, lots of add-ons

### Step-by-Step:

#### 1. Install Heroku CLI

```bash
npm install -g heroku
heroku login
```

#### 2. Create Heroku App

```bash
cd backend
heroku create metalogics-backend
```

#### 3. Add PostgreSQL

```bash
heroku addons:create heroku-postgresql:mini
```

#### 4. Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set GEMINI_API_KEY=your_gemini_api_key_here
heroku config:set RETELL_API_KEY=your_retell_api_key_hereb4db
# ... set all other env vars
```

#### 5. Create Procfile

```bash
echo "web: npm start" > Procfile
```

#### 6. Deploy

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

#### 7. Run Migrations

```bash
heroku run npx prisma migrate deploy
```

**Your URL:**

```
https://metalogics-backend.herokuapp.com
```

**Cost:** $7/month (Eco Dynos)

---

## Option 4: DigitalOcean App Platform

**Best for:** Scalability, control, good pricing

### Step-by-Step:

#### 1. Sign Up

1. Go to https://cloud.digitalocean.com
2. Create account (get $200 credit)

#### 2. Create App

1. Click "Create" → "Apps"
2. Connect GitHub repository
3. Select branch: `main`
4. Autodeploy: Yes

#### 3. Configure App

- **Name:** metalogics-backend
- **Type:** Web Service
- **Build Command:** `cd backend && npm install && npm run build`
- **Run Command:** `cd backend && npm start`
- **HTTP Port:** 3000

#### 4. Add Database

1. In app settings, add "Database"
2. Select PostgreSQL
3. Plan: $7/month (Basic)
4. Database URL auto-injected as `${db.DATABASE_URL}`

#### 5. Environment Variables

Add in App Settings → Environment Variables

#### 6. Deploy

- Auto-deploys on GitHub push
- Takes 3-5 minutes

**Your URL:**

```
https://metalogics-backend-xxxxx.ondigitalocean.app
```

**Cost:** $5/month (app) + $7/month (database) = $12/month

---

## Option 5: AWS (Advanced)

**Best for:** Enterprise, full control, scalability

### Services Needed:

1. **Elastic Beanstalk** - Application hosting
2. **RDS** - PostgreSQL database
3. **Route 53** - DNS (optional)
4. **CloudWatch** - Monitoring

### Quick Setup:

#### 1. Install AWS CLI & EB CLI

```bash
pip install awsebcli
aws configure
```

#### 2. Initialize Elastic Beanstalk

```bash
cd backend
eb init -p node.js metalogics-backend
```

#### 3. Create Environment

```bash
eb create production --database.engine postgres
```

#### 4. Set Environment Variables

```bash
eb setenv NODE_ENV=production \
  GEMINI_API_KEY=your_gemini_api_key_here \
  RETELL_API_KEY=your_retell_api_key_hereb4db
```

#### 5. Deploy

```bash
eb deploy
```

**Your URL:**

```
http://metalogics-backend.us-east-1.elasticbeanstalk.com
```

**Cost:** ~$15-30/month (t3.micro + RDS)

---

## Option 6: Hostinger VPS

**Best for:** You already have Hostinger, want full control

### Requirements:

- Hostinger VPS plan ($4-8/month)
- SSH access
- Basic Linux knowledge

### Step-by-Step:

#### 1. Order VPS

1. Go to Hostinger
2. Order VPS hosting
3. Choose Ubuntu 22.04

#### 2. Connect via SSH

```bash
ssh root@your-vps-ip
```

#### 3. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should be v18+
```

#### 4. Install PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 5. Create Database

```bash
sudo -u postgres psql
CREATE DATABASE metalogics_bookings;
CREATE USER metalogics_user WITH PASSWORD 'YourSecurePassword123';
GRANT ALL PRIVILEGES ON DATABASE metalogics_bookings TO metalogics_user;
\q
```

#### 6. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

#### 7. Upload Your Backend

```bash
# On your local machine
cd backend
npm run build
scp -r dist package.json package-lock.json root@your-vps-ip:/var/www/backend/
```

Or use Git:

```bash
# On VPS
cd /var/www
git clone https://github.com/yourusername/your-repo.git
cd your-repo/backend
npm install
npm run build
```

#### 8. Create .env File

```bash
nano /var/www/backend/.env
```

Paste your production environment variables.

#### 9. Run Migrations

```bash
cd /var/www/backend
npx prisma migrate deploy
```

#### 10. Start with PM2

```bash
cd /var/www/backend
pm2 start dist/server.js --name metalogics-backend
pm2 save
pm2 startup
```

#### 11. Install Nginx (Reverse Proxy)

```bash
sudo apt install nginx
```

Create Nginx config:

```bash
sudo nano /etc/nginx/sites-available/backend
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 12. Install SSL Certificate

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

**Your URL:**

```
https://api.yourdomain.com
```

---

## Environment Variables Setup

### Required Variables:

```bash
# Server
NODE_ENV=production
PORT=3000
API_BASE_URL=https://your-production-url.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Email
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
ADMIN_EMAIL=admin@domain.com
FROM_EMAIL=noreply@domain.com

# Security
API_KEY=your-secure-api-key

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Retell AI (optional)
RETELL_API_KEY=your-retell-api-key
RETELL_AGENT_ID=your-agent-id
RETELL_ENABLED=true

# Google Calendar (optional)
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com

# HubSpot (optional)
HUBSPOT_ENABLED=true
HUBSPOT_ACCESS_TOKEN=your-hubspot-token
```

### Security Best Practices:

1. **Never commit .env files**

   ```bash
   echo ".env*" >> .gitignore
   ```

2. **Use strong API keys**

   ```bash
   # Generate secure key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Rotate keys regularly**

   - Every 90 days minimum
   - After any security incident

4. **Use environment-specific configs**
   - `.env.development` - Local development
   - `.env.staging` - Staging environment
   - `.env.production` - Production (never commit)

---

## Database Setup

### PostgreSQL Connection String Format:

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### Examples:

**Railway:**

```
postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
```

**Render:**

```
postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com/dbname
```

**Heroku:**

```
postgres://user:pass@ec2-xxx.compute-1.amazonaws.com:5432/dbname
```

### Run Migrations:

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### Seed Database (optional):

```bash
npx prisma db seed
```

---

## Testing Your Deployment

### 1. Health Check

```bash
curl https://your-backend-url.com/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-12-08T12:00:00.000Z",
  "version": "1.0.0",
  "database": "connected",
  "integrations": {
    "calendar": "connected",
    "crm": "connected"
  }
}
```

### 2. Test Chat Endpoint

```bash
curl -X POST https://your-backend-url.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "sessionId": "test-123"
  }'
```

### 3. Test Booking Endpoint

```bash
curl -X POST https://your-backend-url.com/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "consultationType": "30min",
    "preferredDate": "2024-12-15",
    "preferredTime": "14:00"
  }'
```

### 4. Monitor Logs

**Railway:**

```bash
# In Railway dashboard → Deployments → View Logs
```

**Render:**

```bash
# In Render dashboard → Logs
```

**Heroku:**

```bash
heroku logs --tail
```

**PM2 (VPS):**

```bash
pm2 logs metalogics-backend
```

---

## Update Your Widget Configuration

Once deployed, update your widget integration:

```html
<script
  src="https://yourdomain.com/chatbot/metalogics-chatbot.iife.js"
  data-api-key="YOUR_GEMINI_API_KEY"
  data-api-url="https://your-backend-url.com"
  data-retell-agent-id="YOUR_RETELL_AGENT_ID"
></script>
```

---

## Monitoring & Maintenance

### 1. Set Up Monitoring

**Railway:** Built-in metrics
**Render:** Built-in metrics
**Heroku:** Use Heroku Metrics or add-ons
**VPS:** Install monitoring tools

### 2. Set Up Alerts

Monitor:

- Server uptime
- Response times
- Error rates
