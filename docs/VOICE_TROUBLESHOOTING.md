# Voice Integration Troubleshooting Guide

## Current Issue

**Error:** `PublishTrackError: publishing rejected as engine not connected within timeout`

**Root Cause:** The Retell agent is configured to use a custom LLM endpoint (ngrok URL), but the ngrok tunnel is offline.

## Solution Options

### Option 1: Use General Prompt (Quick Fix - Recommended)

Configure the agent through the Retell Dashboard to use a built-in prompt:

1. Go to [Retell Dashboard](https://beta.retellai.com/dashboard)
2. Navigate to **Agents** → **Metalogics Assistant** (ID: `your_retell_agent_id_heredb`)
3. In the **LLM Configuration** section:

   - Select **"Use General Prompt"** instead of "Custom LLM"
   - Add this prompt:

     ```
     You are a helpful AI assistant for Metalogics, a technology consulting company.

     Your role is to:
     1. Answer questions about Metalogics services including AI solutions, cloud computing, and software development
     2. Help users book consultations
     3. Provide information about our expertise and past projects

     Be friendly, professional, and concise in your responses. Keep your answers brief and conversational since this is a voice call.

     If a user wants to book a consultation, collect their:
     - Name
     - Company
     - Email
     - Phone number
     - Preferred date and time

     Always confirm the details before finalizing a booking.
     ```

4. Click **Save**
5. Test the voice integration in your browser

### Option 2: Start ngrok Tunnel (For Custom LLM Integration)

If you want to use your custom backend LLM:

1. **Start your backend server:**

   ```bash
   cd backend
   npm run dev
   ```

2. **Start ngrok tunnel in a new terminal:**

   ```bash
   ngrok http 3000
   ```

3. **Update your .env file with the new ngrok URL:**

   ```bash
   # In backend/.env
   Custom_LLM_URL=https://YOUR-NEW-NGROK-URL.ngrok-free.app/api/retell/llm
   Agent_Level_Webhook_URL=https://YOUR-NEW-NGROK-URL.ngrok-free.app/api/retell/webhook
   ```

4. **Configure the agent in Retell Dashboard:**

   - Go to **Agents** → **Metalogics Assistant**
   - In **LLM Configuration**, select **"Custom LLM"**
   - Set **LLM Websocket URL** to: `wss://YOUR-NEW-NGROK-URL.ngrok-free.app/api/retell/llm`
   - Set **Agent Webhook URL** to: `https://YOUR-NEW-NGROK-URL.ngrok-free.app/api/retell/webhook`
   - Click **Save**

5. **Restart your backend server** to pick up the new environment variables

### Option 3: Remove Custom LLM Configuration (Temporary Fix)

If you just want to test quickly:

1. **Comment out the custom LLM URLs in backend/.env:**

   ```bash
   # Custom_LLM_URL=https://your-ngrok-url.ngrok-free.app.ngrok.io/retell/llm
   # Agent_Level_Webhook_URL=https://your-ngrok-url.ngrok-free.app.ngrok.io/retell/webhook
   ```

2. **Configure the agent in Retell Dashboard** to use "General Prompt" (see Option 1)

3. **Restart your backend server**

## Testing the Fix

After applying any of the above solutions:

1. **Refresh your browser** (http://localhost:5173)
2. **Click the green microphone button**
3. **Allow microphone access** when prompted
4. **Speak to test** the voice integration

You should see:

- Button turns red (call active)
- Console shows "Call started"
- Agent responds to your voice

## Verification Commands

Test backend health:

```bash
curl http://localhost:3000/api/retell/health
```

Test Retell configuration:

```bash
cd backend
npx tsx scripts/test-retell-connection.ts
```

## Common Issues

### 1. Microphone Permission Denied

- **Solution:** Allow microphone access in browser settings
- Chrome: Settings → Privacy and security → Site Settings → Microphone

### 2. CORS Errors

- **Solution:** Ensure backend CORS is configured for your frontend URL
- Check `backend/.env` → `ALLOWED_ORIGINS` includes `http://localhost:5173`

### 3. Backend Not Running

- **Solution:** Start the backend server
  ```bash
  cd backend
  npm run dev
  ```

### 4. ngrok Tunnel Expired

- **Solution:** Restart ngrok and update the URLs (see Option 2)
- Free ngrok tunnels expire after 2 hours

## Next Steps

Once voice is working:

1. **Integrate with your Gemini chatbot** - Connect voice transcripts to your existing chat logic
2. **Add booking functionality** - Enable voice-based appointment booking
3. **Improve prompts** - Refine the agent's responses based on testing
4. **Set up persistent ngrok** - Consider ngrok paid plan or alternative tunneling solution

## Support

If issues persist:

- Check browser console for detailed errors
- Review backend logs: `backend/logs/app.log`
- Test with: `npm run test:retell` (if available)
- Contact Retell support: https://docs.retellai.com/
