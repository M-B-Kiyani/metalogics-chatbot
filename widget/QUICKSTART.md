# Metalogics Chatbot Widget - Quick Start Guide

## 🚀 Get Your Widget Running in 5 Minutes

### Step 1: Build the Widget (2 minutes)

```bash
cd widget
npm install
npm run build
```

**Output:**

- `dist/metalogics-chatbot.iife.js` - Widget script
- `dist/metalogics-chatbot.css` - Widget styles

### Step 2: Upload Files (1 minute)

Upload both files to your web server or CDN:

- Example: `https://yoursite.com/assets/metalogics-chatbot.iife.js`
- Example: `https://yoursite.com/assets/metalogics-chatbot.css`

### Step 3: Add to Your Website (2 minutes)

Add this code **before the closing `</body>` tag** on every page where you want the chatbot:

```html
<!-- Retell SDK (for voice features) -->
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>

<!-- Widget CSS -->
<link
  rel="stylesheet"
  href="https://yoursite.com/assets/metalogics-chatbot.css"
/>

<!-- Widget Script -->
<script
  src="https://yoursite.com/assets/metalogics-chatbot.iife.js"
  data-api-key="YOUR_GEMINI_API_KEY"
  data-api-url="https://your-backend.com"
  data-retell-agent-id="YOUR_RETELL_AGENT_ID"
  data-brand-color="#3b82f6"
  data-position="bottom-right"
></script>
```

**Replace:**

- `YOUR_GEMINI_API_KEY` - Your Google Gemini API key
- `https://your-backend.com` - Your backend API URL
- `YOUR_RETELL_AGENT_ID` - Your Retell agent ID (optional, for voice)

### Step 4: Test It! ✅

1. Open your website
2. Look for the chat button in the bottom-right corner
3. Click it and start chatting!

---

## 📋 Configuration Checklist

### Required:

- ✅ `data-api-key` - Your Gemini API key
- ✅ `data-api-url` - Your backend URL

### Optional:

- ⭕ `data-retell-agent-id` - For voice features
- ⭕ `data-brand-color` - Custom color (default: #3b82f6)
- ⭕ `data-position` - "bottom-right" or "bottom-left"

---

## 🎨 Customization Examples

### Change Color

```html
data-brand-color="#ff6b6b"
```

### Change Position

```html
data-position="bottom-left"
```

### Custom Greeting (JavaScript API)

```html
<script>
  window.MetalogicsChatbot.init({
    apiKey: "YOUR_API_KEY",
    apiUrl: "https://your-backend.com",
    greeting: "Hi! Welcome to our site. How can I help?",
  });
</script>
```

---

## 🔧 Backend Setup

Your backend needs one endpoint:

**POST** `/api/chat`

```javascript
// Express.js example
app.post("/api/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  // Process with your AI
  const response = await yourAI.chat(message);

  res.json({ response });
});
```

For voice features, add:

**POST** `/api/retell/register-call`

```javascript
app.post("/api/retell/register-call", async (req, res) => {
  const { agentId, sessionId } = req.body;

  // Register with Retell
  const { accessToken, callId } = await retell.registerCall(agentId);

  res.json({ success: true, accessToken, callId });
});
```

---

## 🐛 Common Issues

### Widget doesn't appear

- Check browser console for errors
- Verify script URLs are correct
- Ensure `data-api-key` is set

### CORS errors

Add CORS headers to your backend:

```javascript
app.use(
  cors({
    origin: "https://yoursite.com",
  })
);
```

### Voice not working

- Check Retell SDK loaded before widget
- Verify microphone permissions
- Ensure `data-retell-agent-id` is set

---

## 📚 Next Steps

- Read [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed instructions
- Check [example-production.html](./example-production.html) for a complete example
- See [README.md](./README.md) for all features

---

## 💡 Pro Tips

1. **Test locally first**: Use `npm run serve` to test the built widget
2. **Use environment variables**: Don't hardcode API keys
3. **Enable HTTPS**: Required for microphone access
4. **Monitor performance**: Widget is ~150KB gzipped
5. **Customize colors**: Match your brand perfectly

---

## 🆘 Need Help?

- Email: support@metalogics.io
- Docs: https://metalogics.io/docs
- Issues: Check browser console first

---

**That's it! Your chatbot widget is now live on your website.** 🎉
