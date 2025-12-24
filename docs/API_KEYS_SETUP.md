# API Keys Setup Guide

## Current Issues

Your application is missing essential API keys, which is causing:

1. **Voice button not working** - Missing Retell AI credentials
2. **Backend 500 errors** - Missing Gemini API key
3. **Chat functionality limited** - Missing Gemini API key

## Required API Keys

### 1. Google Gemini API Key

**What it's for**: Powers the AI chat functionality

**How to get it**:

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy the key (starts with `AIza...`)

**Where to add it**:

- Backend: `backend/.env` → `GEMINI_API_KEY=AIza...`
- Frontend: `frontend/.env` → `VITE_GEMINI_API_KEY=AIza...`

### 2. Google OAuth Credentials (Required for Authentication)

**What it's for**: Enables user authentication and Google Calendar integration

**How to get it**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Calendar API
   - Google People API (if using contacts)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure OAuth consent screen first if prompted
6. Set application type to "Web application"
7. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
8. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
9. Copy the Client ID and Client Secret

**Where to add it**:

- Backend: `backend/.env` →
  ```
  GOOGLE_CLIENT_ID=846039428651-vfs8p7a595l4npmmir3rt7q2l03bnmm9.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=your_google_client_secret
  GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
  ```
- Frontend: `frontend/.env` →
  ```
  VITE_GOOGLE_CLIENT_ID=your_google_client_id
  ```

### 3. Retell AI Credentials (Optional - for Voice)

**What it's for**: Enables voice calling functionality

**How to get it**:

1. Go to [Retell AI](https://www.retellai.com/)
2. Sign up for an account
3. Create a new agent
4. Get your API key and Agent ID from the dashboard

**Where to add it**:

- Backend: `backend/.env` →
  ```
  RETELL_API_KEY=your_retell_api_key
  RETELL_AGENT_ID=your_agent_id
  RETELL_ENABLED=true
  ```
- Frontend: `frontend/.env` →
  ```
  VITE_RETELL_API_KEY=your_retell_api_key
  VITE_RETELL_AGENT_ID=your_agent_id
  ```

## Quick Fix Steps

### Step 1: Add Gemini API Key (Essential)

1. **Backend** - Edit `backend/.env`:

```bash
# Replace this line:
GEMINI_API_KEY=

# With your actual key:
GEMINI_API_KEY=AIzaSyYourActualKeyHere
```

2. **Frontend** - Edit `frontend/.env`:

```bash
# Replace this line:
VITE_GEMINI_API_KEY=

# With your actual key:
VITE_GEMINI_API_KEY=AIzaSyYourActualKeyHere
```

### Step 2: Add Google OAuth Credentials (Required)

1. **Backend** - Edit `backend/.env`:

```bash
# Add these lines:
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

2. **Frontend** - Edit `frontend/.env`:

```bash
# Add this line:
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Step 3: Add Retell Credentials (Optional)

If you want voice functionality:

1. **Backend** - Edit `backend/.env`:

```bash
# Replace these lines:
RETELL_API_KEY=
RETELL_AGENT_ID=

# With your actual credentials:
RETELL_API_KEY=your_retell_api_key_here
RETELL_AGENT_ID=your_retell_agent_id_here
RETELL_ENABLED=true
```

2. **Frontend** - Edit `frontend/.env`:

```bash
# Replace these lines:
VITE_RETELL_API_KEY=
VITE_RETELL_AGENT_ID=

# With your actual credentials:
VITE_RETELL_API_KEY=your_retell_api_key_here
VITE_RETELL_AGENT_ID=your_retell_agent_id_here
```

### Step 4: Restart Services

After adding the API keys:

1. **Backend**: Restart your backend service
2. **Frontend**: Restart your frontend service
3. **Clear browser cache** and refresh the page

## Testing

### Test Google Authentication

1. Open the application
2. Look for "Sign in with Google" button
3. Click it and complete OAuth flow
4. You should be redirected back with authentication

### Test Chat (Gemini)

1. Open the application
2. Type a message in the chat
3. You should get an AI response (no more 500 errors)

### Test Voice (Retell - if configured)

1. Look for the "Call AI" button
2. Click it to start a voice call
3. The button should work without errors

## Current Status

Based on your environment files:

- ❌ **Gemini API Key**: Not configured (required for chat)
- ❌ **Google OAuth**: Not configured (required for authentication)
- ❌ **Retell API Key**: Not configured (optional for voice)
- ❌ **Retell Agent ID**: Not configured (optional for voice)

## Need Help?

1. **Google OAuth Issues**: Check [Google Cloud Console documentation](https://cloud.google.com/docs/authentication)
2. **Gemini API Issues**: Check [Google AI Studio documentation](https://ai.google.dev/docs)
3. **Retell AI Issues**: Check [Retell AI documentation](https://docs.retellai.com/)
4. **Still having problems**: Check the browser console for specific error messages

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Consider using different keys for development and production
- Regularly rotate your API keys for security
