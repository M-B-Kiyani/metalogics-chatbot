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

### 6. Verify Deployment

Once all services are active:

1.  Open your **Frontend URL**.
2.  Test the chat functionality.
3.  Book a meeting to verify the database connection.

## 🛠️ Troubleshooting

### CORS Errors (Backend Blocking Frontend)
If you see "CORS error" or "Access-Control-Allow-Origin" errors in the browser console:
1.  We have updated the code to automatically allow `*.up.railway.app` domains. **Redeploy the Backend Service.**
2.  If the issue persists, go to the Backend Service in Railway -> **Settings** -> **Variables**.
3.  Add or Update `ALLOWED_ORIGINS` to include your frontend URL:
    ```
    *,https://your-frontend-url.up.railway.app
    ```

### Widget Deployment Crashes
If the Widget service shows a Red X or crashes:
1.  Check the **Deploy Logs** in Railway for the specific error.
2.  Ensure `dist/metalogics-chatbot.iife.js` is being built.
3.  We have updated the `Dockerfile` to be more robust. **Redeploy the Widget Service.**
4.  Verify that your build command in Railway is effectively `npm install && npm run build`.

### Widget Connection Error "Unable to connect"
If the widget loads but says "Unable to connect":
1.  Check the `data-api-url` in your HTML snippet. It must match your **Backend Service URL**.
    ```html
    data-api-url="https://backend-production-....up.railway.app"
    ```
2.  Verify the CORS settings on the Backend (see above).
