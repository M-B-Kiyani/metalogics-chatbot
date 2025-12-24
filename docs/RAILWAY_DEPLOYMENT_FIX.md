# Railway Deployment Configuration Fix

## Issues Found and Fixed

### 1. **Frontend Environment Variable Loading**

**Problem**: Vite config was loading `GEMINI_API_KEY` before `VITE_GEMINI_API_KEY`, causing Railway environment variables to be ignored.

**Fix**: Updated `frontend/vite.config.ts` to prioritize `VITE_GEMINI_API_KEY` over `GEMINI_API_KEY`.

```typescript
// Before
"process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ""),

// After
"process.env.API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ""),
```

### 2. **Backend Missing Gemini Configuration**

**Problem**: Backend configuration system didn't include `GEMINI_API_KEY` validation and loading.

**Fixes**:

- Added `GEMINI_API_KEY` to Zod schema validation
- Created `GeminiConfig` interface
- Added `buildGeminiConfig()` function
- Updated `AppConfig` interface to include `gemini: GeminiConfig`
- Updated services to use `config.gemini.apiKey` instead of `process.env.GEMINI_API_KEY`

### 3. **Service Configuration Updates**

**Problem**: Backend services were using `process.env.GEMINI_API_KEY` directly instead of the config system.

**Fixes**:

- Updated `GeminiService` constructor to use `config.gemini.apiKey`
- Updated `EmbeddingService` constructor to use `config.gemini.apiKey`
- Added proper imports for config in both services

### 4. **Voice Button User Experience**

**Problem**: Voice button was completely hidden when not configured, providing no feedback to users.

**Fix**: Updated `VoiceButton.tsx` to show a disabled button with helpful message when not configured.

### 5. **Configuration Monitoring**

**Problem**: No visibility into Retell and Gemini configuration status during startup.

**Fix**: Updated `printDetailedConfigSummary()` to show:

- 🎙️ Retell AI Voice status and configuration
- 🤖 Gemini AI API key status

## Railway Environment Variables Required

### Backend Service

```bash
# Essential
GEMINI_API_KEY=AIzaSy...your_actual_gemini_key
DATABASE_URL=postgresql://...

# Voice Integration (Optional)
RETELL_API_KEY=your_retell_api_key
RETELL_AGENT_ID=your_retell_agent_id
RETELL_ENABLED=true

# Other required vars...
API_KEY=your_secure_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
# ... etc
```

### Frontend Service

```bash
# Essential
VITE_GEMINI_API_KEY=AIzaSy...your_actual_gemini_key
VITE_API_BASE_URL=https://your-backend.up.railway.app
VITE_API_KEY=your_secure_api_key

# Voice Integration (Optional)
VITE_RETELL_API_KEY=your_retell_api_key
VITE_RETELL_AGENT_ID=your_retell_agent_id
```

## Verification Steps

### 1. Check Backend Configuration

After deployment, check the backend logs for:

```
📋 CONFIGURATION SUMMARY
...
🤖 Gemini AI:
   API Key: ✓ Configured

🎙️ Retell AI Voice:
   Status: ✓ Enabled
   API Key: Configured
   Agent ID: Configured
```

### 2. Test API Endpoints

```bash
# Health check
curl https://your-backend.up.railway.app/api/health

# Retell health (if configured)
curl https://your-backend.up.railway.app/api/retell/health
```

### 3. Test Frontend

- Chat should work without 500 errors
- Voice button should appear (enabled if configured, disabled with message if not)
- No console errors about missing API keys

## Common Issues

### Issue: "Voice integration not configured"

**Cause**: Missing `VITE_RETELL_AGENT_ID` or `VITE_RETELL_API_KEY`
**Solution**: Add Retell credentials to Railway frontend environment variables

### Issue: "Sorry, I encountered an error"

**Cause**: Missing `VITE_GEMINI_API_KEY` or backend `GEMINI_API_KEY`
**Solution**: Add Gemini API key to both frontend and backend Railway environment variables

### Issue: 500 errors in browser console

**Cause**: Backend missing `GEMINI_API_KEY`
**Solution**: Add `GEMINI_API_KEY` to Railway backend environment variables

## Deployment Checklist

- [ ] Added `GEMINI_API_KEY` to Railway backend environment
- [ ] Added `VITE_GEMINI_API_KEY` to Railway frontend environment
- [ ] Added `VITE_API_BASE_URL` pointing to backend Railway URL
- [ ] Added Retell credentials (if using voice features)
- [ ] Redeployed both services
- [ ] Verified configuration in backend logs
- [ ] Tested chat functionality
- [ ] Tested voice button (if configured)

## Next Steps

1. **Deploy the fixes**: Push these changes to trigger Railway redeployment
2. **Add environment variables**: Set the required variables in Railway dashboard
3. **Monitor logs**: Check backend startup logs for configuration status
4. **Test functionality**: Verify chat and voice features work correctly

The main issue was that Railway environment variables weren't being properly loaded due to configuration system problems. These fixes ensure that Railway environment variables are correctly prioritized and loaded by both frontend and backend services.
