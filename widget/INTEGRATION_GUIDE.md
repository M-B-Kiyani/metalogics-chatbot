# Metalogics Chatbot Widget - Complete Integration Guide

## 🎯 Overview

This widget provides a complete AI-powered chatbot with voice capabilities that can be embedded on any website with a single script tag.

## ✨ Features

- 💬 **Text Chat** - Powered by Google Gemini AI
- 🎤 **Voice Chat** - Real-time voice conversations with Retell AI
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 💾 **Chat History** - Persists across page reloads
- 🎨 **Customizable** - Match your brand colors and position
- 🔒 **Secure** - API key authentication
- ⚡ **Fast** - Optimized bundle size

---

## 🚀 Quick Start (3 Steps)

### Step 1: Build the Widget

```bash
cd widget
npm install
npm run build
```

This creates:

- `dist/metalogics-chatbot.iife.js` - The widget script (~150KB)
- `dist/metalogics-chatbot.css` - The widget styles (~5KB)

### Step 2: Host the Files

Upload both files to your CDN or web server:

- `https://your-domain.com/chatbot/metalogics-chatbot.iife.js`
- `https://your-domain.com/chatbot/metalogics-chatbot.css`

### Step 3: Add to Your Website

Add this code before the closing `</body>` tag:

```html
<!-- Retell SDK (required for voice features) -->
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>

<!-- Metalogics Widget CSS -->
<link
  rel="stylesheet"
  href="https://your-domain.com/chatbot/metalogics-chatbot.css"
/>

<!-- Metalogics Widget Script -->
<script
  src="https://your-domain.com/chatbot/metalogics-chatbot.iife.js"
  data-api-key="YOUR_GEMINI_API_KEY"
  data-api-url="https://your-backend.com"
  data-retell-agent-id="YOUR_RETELL_AGENT_ID"
  data-brand-color="#3b82f6"
  data-position="bottom-right"
></script>
```

**That's it!** The chatbot will appear on your website.

---

## ⚙️ Configuration Options

### Data Attributes (Simple Method)

| Attribute              | Required | Default        | Description                     |
| ---------------------- | -------- | -------------- | ------------------------------- |
| `data-api-key`         | ✅ Yes   | -              | Your Gemini API key             |
| `data-api-url`         | ✅ Yes   | -              | Your backend API URL            |
| `data-retell-agent-id` | ❌ No    | -              | Retell agent ID (for voice)     |
| `data-brand-color`     | ❌ No    | `#3b82f6`      | Primary color (hex)             |
| `data-position`        | ❌ No    | `bottom-right` | `bottom-right` or `bottom-left` |

### JavaScript API (Advanced Method)

```html
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
<link
  rel="stylesheet"
  href="https://your-domain.com/chatbot/metalogics-chatbot.css"
/>
<script src="https://your-domain.com/chatbot/metalogics-chatbot.iife.js"></script>

<script>
  // Initialize with custom config
  window.MetalogicsChatbot.init({
    apiKey: "YOUR_GEMINI_API_KEY",
    apiUrl: "https://your-backend.com",
    retellAgentId: "YOUR_RETELL_AGENT_ID",
    brandColor: "#ff6b6b",
    position: "bottom-left",
    greeting: "Hi! Welcome to our website. How can I help you today?",
  });
</script>
```

---

## 🌐 Platform-Specific Integration

### WordPress

1. Install "Insert Headers and Footers" plugin
2. Go to Settings → Insert Headers and Footers
3. Paste the widget code in the "Scripts in Footer" section
4. Save changes

### Shopify

1. Go to Online Store → Themes → Actions → Edit Code
2. Open `theme.liquid`
3. Paste the widget code before `</body>`
4. Save

### Wix

1. Go to Settings → Custom Code
2. Add new code snippet
3. Paste the widget code
4. Set to load on "All Pages" in the body (end)
5. Apply

### Squarespace

1. Go to Settings → Advanced → Code Injection
2. Paste the widget code in "Footer"
3. Save

### React/Next.js

```jsx
// components/MetalogicsChatbot.tsx
import { useEffect } from "react";

export default function MetalogicsChatbot() {
  useEffect(() => {
    // Load Retell SDK
    const retellScript = document.createElement("script");
    retellScript.src =
      "https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js";
    document.body.appendChild(retellScript);

    // Load widget CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://your-domain.com/chatbot/metalogics-chatbot.css";
    document.head.appendChild(link);

    // Load widget script
    const script = document.createElement("script");
    script.src = "https://your-domain.com/chatbot/metalogics-chatbot.iife.js";
    script.onload = () => {
      window.MetalogicsChatbot?.init({
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
        retellAgentId: process.env.NEXT_PUBLIC_RETELL_AGENT_ID,
        brandColor: "#3b82f6",
        position: "bottom-right",
      });
    };
    document.body.appendChild(script);

    return () => {
      window.MetalogicsChatbot?.destroy();
    };
  }, []);

  return null;
}
```

Then add to your layout:

```jsx
// app/layout.tsx or pages/_app.tsx
import MetalogicsChatbot from "@/components/MetalogicsChatbot";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <MetalogicsChatbot />
    </>
  );
}
```

### Vue.js

```vue
<!-- components/MetalogicsChatbot.vue -->
<template>
  <div></div>
</template>

<script>
export default {
  name: "MetalogicsChatbot",
  mounted() {
    // Load Retell SDK
    const retellScript = document.createElement("script");
    retellScript.src =
      "https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js";
    document.body.appendChild(retellScript);

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://your-domain.com/chatbot/metalogics-chatbot.css";
    document.head.appendChild(link);

    // Load widget
    const script = document.createElement("script");
    script.src = "https://your-domain.com/chatbot/metalogics-chatbot.iife.js";
    script.onload = () => {
      window.MetalogicsChatbot?.init({
        apiKey: process.env.VUE_APP_GEMINI_API_KEY,
        apiUrl: process.env.VUE_APP_API_URL,
        retellAgentId: process.env.VUE_APP_RETELL_AGENT_ID,
        brandColor: "#3b82f6",
      });
    };
    document.body.appendChild(script);
  },
  beforeUnmount() {
    window.MetalogicsChatbot?.destroy();
  },
};
</script>
```

---

## 🔧 Backend Requirements

Your backend must provide these endpoints:

### 1. Chat Endpoint

**POST** `/api/chat`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

**Request:**

```json
{
  "message": "User's message",
  "sessionId": "session_1234567890"
}
```

**Response:**

```json
{
  "response": "AI assistant's response"
}
```

### 2. Voice Registration Endpoint (Optional - for voice features)

**POST** `/api/retell/register-call`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

**Request:**

```json
{
  "agentId": "agent_xxx",
  "sessionId": "session_1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "accessToken": "retell_access_token_xxx",
  "callId": "call_xxx"
}
```

---

## 🎨 Customization Examples

### Custom Brand Colors

```html
<script
  src="https://your-domain.com/chatbot/metalogics-chatbot.iife.js"
  data-api-key="YOUR_API_KEY"
  data-api-url="https://your-backend.com"
  data-brand-color="#ff6b6b"
></script>
```

### Left Position

```html
<script
  src="https://your-domain.com/chatbot/metalogics-chatbot.iife.js"
  data-api-key="YOUR_API_KEY"
  data-api-url="https://your-backend.com"
  data-position="bottom-left"
></script>
```

### Custom Greeting

```javascript
window.MetalogicsChatbot.init({
  apiKey: "YOUR_API_KEY",
  apiUrl: "https://your-backend.com",
  greeting: "Welcome to Acme Corp! How can we help you today?",
});
```

### Custom CSS Overrides

```css
/* Override widget styles */
.metalogics-chat-window {
  width: 450px !important;
  height: 700px !important;
}

.metalogics-chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.metalogics-message-user {
  background-color: #8b5cf6 !important;
}
```

---

## 🧪 Testing

### Local Testing

1. Build the widget:

```bash
cd widget
npm run build
```

2. Start a local server:

```bash
npm run serve
```

3. Open `http://localhost:4173` in your browser

### Test on Your Website

1. Build the widget
2. Copy files to your server
3. Add the script tag to your website
4. Test on desktop and mobile
5. Check browser console for errors

---

## 🐛 Troubleshooting

### Widget doesn't appear

**Check:**

- Browser console for errors
- Script URL is correct and accessible
- `data-api-key` is set
- CSS file is loaded

**Solution:**

```javascript
// Check if widget loaded
console.log(window.MetalogicsChatbot);
```

### CORS errors

**Problem:** Backend doesn't allow requests from your domain

**Solution:** Add CORS headers to your backend:

```javascript
// Express.js example
app.use(
  cors({
    origin: "https://your-website.com",
    credentials: true,
  })
);
```

### Voice not working

**Check:**

- Retell SDK is loaded before widget
- `data-retell-agent-id` is set
- Microphone permissions granted
- Backend `/api/retell/register-call` endpoint works

**Solution:**

```javascript
// Check Retell SDK
console.log(window.RetellWebClient);

// Check microphone permission
navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then(() => console.log("Microphone OK"))
  .catch((err) => console.error("Microphone error:", err));
```

### Chat history not saving

**Check:**

- localStorage is enabled
- Not in incognito/private mode
- No browser extensions blocking storage

**Solution:**

```javascript
// Test localStorage
try {
  localStorage.setItem("test", "test");
  localStorage.removeItem("test");
  console.log("localStorage OK");
} catch (e) {
  console.error("localStorage blocked:", e);
}
```

---

## 📊 Analytics Integration

### Google Analytics

```javascript
// Track widget opens
window.MetalogicsChatbot.init({
  apiKey: "YOUR_API_KEY",
  apiUrl: "https://your-backend.com",
  onOpen: () => {
    gtag("event", "chatbot_opened", {
      event_category: "engagement",
      event_label: "Metalogics Chatbot",
    });
  },
});
```

### Custom Events

```javascript
// Listen for widget events
document.addEventListener("metalogics:message:sent", (e) => {
  console.log("User sent message:", e.detail.message);
});

document.addEventListener("metalogics:voice:started", () => {
  console.log("Voice call started");
});
```

---

## 🔒 Security Best Practices

1. **Never expose API keys in frontend code**

   - Use environment variables
   - Validate on backend

2. **Use HTTPS only**

   - Widget requires secure context for microphone

3. **Implement rate limiting**

   - Prevent API abuse
   - Limit messages per session

4. **Validate all inputs**
   - Sanitize user messages
   - Check session IDs

---

## 📦 CDN Hosting Options

### Option 1: Your Own Server

Upload files to your web server

### Option 2: AWS S3 + CloudFront

```bash
aws s3 cp dist/ s3://your-bucket/chatbot/ --recursive
```

### Option 3: Netlify

```bash
netlify deploy --prod --dir=dist
```

### Option 4: Vercel

```bash
vercel --prod
```

---

## 🚀 Performance Optimization

### Lazy Loading

```html
<script>
  // Load widget only when user scrolls or after delay
  setTimeout(() => {
    const script = document.createElement("script");
    script.src = "https://your-domain.com/chatbot/metalogics-chatbot.iife.js";
    script.setAttribute("data-api-key", "YOUR_API_KEY");
    script.setAttribute("data-api-url", "https://your-backend.com");
    document.body.appendChild(script);
  }, 3000); // Load after 3 seconds
</script>
```

### Preload Resources

```html
<link
  rel="preload"
  href="https://your-domain.com/chatbot/metalogics-chatbot.iife.js"
  as="script"
/>
<link
  rel="preload"
  href="https://your-domain.com/chatbot/metalogics-chatbot.css"
  as="style"
/>
```

---

## 📱 Mobile Optimization

The widget automatically adapts to mobile:

- Full-screen on small devices
- Touch-optimized buttons
- Responsive text input
- Optimized for portrait/landscape

---

## 🌍 Multi-Language Support

```javascript
window.MetalogicsChatbot.init({
  apiKey: "YOUR_API_KEY",
  apiUrl: "https://your-backend.com",
  greeting:
    {
      en: "Welcome! How can I help you?",
      es: "¡Bienvenido! ¿Cómo puedo ayudarte?",
      fr: "Bienvenue! Comment puis-je vous aider?",
    }[navigator.language.split("-")[0]] || "Welcome!",
});
```

---

## 📞 Support

For issues or questions:

- Email: support@metalogics.io
- Documentation: https://metalogics.io/docs
- GitHub: https://github.com/metalogics/chatbot-widget

---

## 📄 License

© 2025 Metalogics. All rights reserved.
