# Railway Deployment Guide

This repository contains 3 distinct services that should be deployed separately on Railway.

## 1. Backend Service (`/backend`)

**Settings:**
- **Root Directory:** `backend`
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Watch Paths:** `/src/**`

**Environment Variables:**
```env
PORT=3000
DATABASE_URL=postgresql://...
ALLOWED_ORIGINS=*
API_KEY=your_secret_master_key
WIDGET_API_KEY=public_widget_key_for_clients
GEMINI_API_KEY=your_google_gemini_key
# ... other vars from .env.example
```

## 2. Frontend Service (`/frontend`)

**Settings:**
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Start Command:** `npm start` or `npm run preview`

**Environment Variables:**
```env
# The URL of your deployed Backend service
VITE_API_BASE_URL=https://your-backend.up.railway.app
# Your Gemini Key (Must match variable name in code)
GEMINI_API_KEY=your_google_gemini_key
```

## 3. Widget Service (`/widget`)

**Settings:**
- **Root Directory:** `widget`
- **Build Command:** `npm run build`
- **Start Command:** `npm run start:prod`

**Environment Variables:**
No strict variables required, as it serves static files. 
Default API URL can be overridden by the script tag on the client site.

## 4. Integration

To use the widget on a website, use the code snippet provided in `widget-loader.html`.
