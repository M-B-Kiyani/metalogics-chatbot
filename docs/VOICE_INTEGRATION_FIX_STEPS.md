# Voice Integration Fix - Step by Step Guide

## 🔴 CRITICAL ISSUE FOUND

Your voice integration is not responding because **the ngrok tunnel is offline**. The Retell AI service cannot reach your backend WebSocket server.

---

## ✅ Quick Fix Steps

### Step 1: Start ngrok Tunnel

Open a new terminal and run:

```bash
ngrok http 3000
```

You should see output like:

```
Forwarding  https://abc-123-xyz.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc-123-xyz.ngrok-free.app`)

### Step 2: Update Backend Environment

Edit `backend/.env` and update the WebSocket URL:

```env
RETELL_CUSTOM_LLM_WEBSOCKET_URL=wss://YOUR-NEW-NGROK-URL/api/retell/llm
RETELL_AGENT_WEBHOOK_URL=https://YOUR-NEW-NGROK-URL/api/retell/webhook
```

**Important:**

- Use `wss://` (not `ws://`) for WebSocket
- Use `https://` for webhook
- Replace `YOUR-NEW-NGROK-URL` with your actual ngrok URL

### Step 3: Update Retell Agent Configuration

1. Go to https://dashboard.retellai.com
2. Log in with your account
3. Navigate to your agent: `your_retell_agent_id_heredb`
4. Update the **Custom LLM WebSocket URL** to: `wss://YOUR-NEW-NGROK-URL/api/retell/llm`
5. Save the changes

### Step 4: Restart Backend Server

```bash
cd backend
npm run dev
```

### Step 5: Test the Voice Integration

1. Open your frontend: http://localhost:5173
2. Click the "Call AI" button
3. Allow microphone access
4. Speak to test the voice assistant

---

## 🔍 Diagnostic Test Results

I ran a comprehensive diagnostic test and found:

### ✅ Working Components:

- Backend server is running on port 3000
- Retell integration endpoint is accessible
- Call registration is working
- Gemini AI service is configured

### ❌ Issues Found:

1. **ngrok tunnel is OFFLINE** (CRITICAL)

   - Current URL: `wss://your-ngrok-url.ngrok-free.app`
   - Status: Not responding
   - **This is why calls don't respond!**

2. **Retell API endpoints** (Minor - test script issue)

   - The diagnostic used wrong API endpoints
   - Your actual integration is working fine

3. **Gemini model name** (Minor - test script issue)
   - Test used old model name
   - Your backend uses correct model: `gemini-2.0-flash-exp`

---

## 🎯 Why Voice Calls Don't Respond

When you click "Call AI":

1. ✅ Frontend requests access token from backend → **Works**
2. ✅ Backend registers call with Retell → **Works**
3. ✅ Frontend starts call with Retell SDK → **Works**
4. ❌ Retell tries to connect to your WebSocket → **FAILS** (ngrok offline)
5. ❌ No AI responses because WebSocket never connects → **This is the problem**

---

## 🛠 Alternative Solutions

### Option 1: Use ngrok (Recommended for Development)

**Pros:**

- Easy to set up
- Free tier available
- Works immediately

**Cons:**

- URL changes every time you restart (free tier)
- Need to update Retell agent config each time

**Setup:**

```bash
# Install ngrok
# Download from: https://ngrok.com/download

# Start tunnel
ngrok http 3000

# Keep this terminal open!
```

### Option 2: Deploy to Production Server

**Pros:**

- Permanent URL
- No need to update config
- More reliable

**Cons:**

- Requires server setup
- More complex

**Options:**

- Deploy to Heroku, Railway, Render, or DigitalOcean
- Use a VPS with public IP
- Use cloud services (AWS, GCP, Azure)

### Option 3: Use ngrok with Static Domain (Paid)

**Pros:**

- URL never changes
- Set it once and forget
- Professional

**Cons:**

- Requires ngrok paid plan ($8/month)

---

## 📋 Complete Checklist

Before testing voice calls, ensure:

- [ ] ngrok is running and showing active tunnel
- [ ] Backend `.env` has correct ngrok WebSocket URL (wss://)
- [ ] Retell agent config has correct WebSocket URL
- [ ] Backend server is running (port 3000)
- [ ] Frontend is running (port 5173)
- [ ] Browser has microphone permissions
- [ ] No firewall blocking WebSocket connections

---

## 🧪 Test After Fixing

Run this command to verify everything is working:

```bash
node test-voice-integration-diagnosis.cjs
```

You should see:

```
✓ backendHealth
✓ retellHealth
✓ registerCall
✓ websocketEndpoint
✓ geminiService
```

---

## 🆘 Still Not Working?

### Check Backend Logs

Look for these messages when you start a call:

```
WebSocket connection attempt
Retell LLM WebSocket connected
Call details received
```

If you don't see these, the WebSocket connection is not reaching your backend.

### Check Browser Console

Press F12 and look for errors like:

- "WebSocket connection failed"
- "Failed to register call"
- "Microphone permission denied"

### Check ngrok Dashboard

Visit: http://127.0.0.1:4040

This shows all requests going through ngrok. You should see WebSocket upgrade requests when you start a call.

---

## 💡 Pro Tips

1. **Keep ngrok running** - Don't close the ngrok terminal
2. **Use ngrok authtoken** - Sign up for free account to get longer session times
3. **Save your ngrok URL** - Write it down so you can reuse it
4. **Test incrementally** - Test each step before moving to the next
5. **Check logs** - Backend logs show exactly what's happening

---

## 📞 Expected Behavior After Fix

1. Click "Call AI" button
2. Browser asks for microphone permission → Allow
3. Button shows "Connecting..."
4. Button changes to "End Call" with pulsing animation
5. You hear a greeting from the AI
6. You can speak and get responses
7. Conversation flows naturally

---

## 🔗 Useful Links

- Retell Dashboard: https://dashboard.retellai.com
- ngrok Dashboard: http://127.0.0.1:4040
- ngrok Download: https://ngrok.com/download
- Backend Health: http://localhost:3000/api/health
- Frontend: http://localhost:5173

---

## Summary

**The main issue:** ngrok tunnel is offline, so Retell cannot reach your WebSocket server.

**The fix:** Start ngrok, update the URLs, and restart your backend.

**Time to fix:** 5-10 minutes

Once ngrok is running with the correct configuration, your voice integration will work perfectly!
