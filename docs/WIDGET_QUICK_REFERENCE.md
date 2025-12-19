# 🚀 Metalogics Chatbot Widget - Quick Reference Card

## One-Minute Integration

```html
<!-- Add before </body> -->
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
<link rel="stylesheet" href="https://your-cdn.com/metalogics-chatbot.css" />
<script
  src="https://your-cdn.com/metalogics-chatbot.iife.js"
  data-api-key="YOUR_GEMINI_API_KEY"
  data-api-url="https://your-backend.com"
  data-retell-agent-id="YOUR_RETELL_AGENT_ID"
  data-brand-color="#3b82f6"
  data-position="bottom-right"
></script>
```

---

## Build Commands

```bash
cd widget
npm install          # Install dependencies
npm run dev          # Development mode
npm run build        # Build for production
npm run serve        # Test production build
```

**Windows:** `build-and-test.bat`  
**Mac/Linux:** `./build-and-test.sh`

---

## Configuration Options

| Option                 | Required | Default        | Description             |
| ---------------------- | -------- | -------------- | ----------------------- |
| `data-api-key`         | ✅       | -              | Gemini API key          |
| `data-api-url`         | ✅       | -              | Backend URL             |
| `data-retell-agent-id` | ❌       | -              | Retell agent ID (voice) |
| `data-brand-color`     | ❌       | `#3b82f6`      | Primary color           |
| `data-position`        | ❌       | `bottom-right` | Widget position         |

---

## JavaScript API

```javascript
// Initialize
window.MetalogicsChatbot.init({
  apiKey: "YOUR_API_KEY",
  apiUrl: "https://your-backend.com",
  retellAgentId: "YOUR_RETELL_AGENT_ID",
  brandColor: "#ff6b6b",
  position: "bottom-left",
  greeting: "Welcome! How can I help?",
});

// Destroy
window.MetalogicsChatbot.destroy();
```

---

## Backend Endpoints

### Chat (Required)

```
POST /api/chat
Body: { message: string, sessionId: string }
Response: { response: string }
```

### Voice Registration (Optional)

```
POST /api/retell/register-call
Body: { agentId: string, sessionId: string }
Response: { success: boolean, accessToken: string, callId: string }
```

---

## File Sizes

- **JS:** ~150KB (gzipped)
- **CSS:** ~5KB (gzipped)
- **Total:** ~155KB

---

## Platform Examples

### WordPress

```html
<!-- Settings → Insert Headers and Footers → Footer -->
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
<link rel="stylesheet" href="https://your-cdn.com/metalogics-chatbot.css" />
<script
  src="https://your-cdn.com/metalogics-chatbot.iife.js"
  data-api-key="YOUR_KEY"
  data-api-url="https://your-backend.com"
></script>
```

### React/Next.js

```jsx
useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://your-cdn.com/metalogics-chatbot.iife.js";
  script.onload = () => {
    window.MetalogicsChatbot?.init({
      apiKey: process.env.NEXT_PUBLIC_API_KEY,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
    });
  };
  document.body.appendChild(script);
  return () => window.MetalogicsChatbot?.destroy();
}, []);
```

### Shopify

```html
<!-- theme.liquid before </body> -->
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
<link rel="stylesheet" href="https://your-cdn.com/metalogics-chatbot.css" />
<script
  src="https://your-cdn.com/metalogics-chatbot.iife.js"
  data-api-key="YOUR_KEY"
  data-api-url="https://your-backend.com"
></script>
```

---

## Troubleshooting

### Widget doesn't appear

```bash
# Check browser console
# Verify script URL
# Ensure data-api-key is set
```

### CORS errors

```javascript
// Add to backend
app.use(cors({ origin: "https://yoursite.com" }));
```

### Voice not working

```bash
# Check Retell SDK loaded first
# Verify microphone permissions
# Ensure data-retell-agent-id is set
```

---

## Documentation

- **[QUICKSTART.md](widget/QUICKSTART.md)** - 5-minute setup
- **[INTEGRATION_GUIDE.md](widget/INTEGRATION_GUIDE.md)** - Complete guide
- **[DEPLOYMENT.md](widget/DEPLOYMENT.md)** - Deployment options
- **[WIDGET_INTEGRATION_COMPLETE.md](WIDGET_INTEGRATION_COMPLETE.md)** - Full package

---

## Support

📧 support@metalogics.io  
🌐 https://metalogics.io  
📚 https://metalogics.io/docs

---

**Quick Links:**

- Build: `cd widget && npm run build`
- Test: `npm run serve`
- Deploy: Upload `dist/` files to CDN
- Integrate: Add script tag to website

✅ **Ready to go!**
