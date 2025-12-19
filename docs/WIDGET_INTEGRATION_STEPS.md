# 🚀 How to Add Widget Code to Your Website - Complete Guide

## 📋 Overview

This guide shows you exactly how to add the Metalogics chatbot widget to your website. The widget works on any website - WordPress, HTML, React, Shopify, etc.

---

## 🎯 Quick Start (3 Steps)

### Step 1: Build Your Widget

```bash
cd widget
npm install
npm run build
```

### Step 2: Upload Widget Files

Upload these files to your server:

- `widget/dist/metalogics-chatbot.iife.js`
- `widget/dist/metalogics-chatbot.css`

### Step 3: Add Code to Your Website

Add this code before the closing `</body>` tag:

```html
<!-- Retell SDK for voice features -->
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>

<!-- Widget CSS -->
<link
  rel="stylesheet"
  href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
/>

<!-- Widget Script -->
<script
  src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
  data-api-key="YOUR_GEMINI_API_KEY"
  data-api-url="https://bilal.metalogics.io/api"
  data-retell-agent-id="YOUR_RETELL_AGENT_ID"
  data-brand-color="#3b82f6"
  data-position="bottom-right"
></script>
```

---

## 🌐 Platform-Specific Instructions

### 🔹 Static HTML Website

If you have a regular HTML website:

1. **Open your main HTML file** (usually `index.html`)
2. **Find the closing `</body>` tag**
3. **Add the widget code right before it:**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Website</title>
  </head>
  <body>
    <!-- Your existing website content -->
    <h1>Welcome to My Website</h1>
    <p>Your content here...</p>

    <!-- ADD WIDGET CODE HERE - Before closing </body> tag -->
    <script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
    <link
      rel="stylesheet"
      href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
    />
    <script
      src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
      data-api-key="YOUR_GEMINI_API_KEY"
      data-api-url="https://bilal.metalogics.io/api"
      data-brand-color="#3b82f6"
      data-position="bottom-right"
    ></script>
  </body>
</html>
```

### 🔹 WordPress Website

#### Method 1: Using a Plugin (Recommended)

1. **Install "Insert Headers and Footers" plugin:**

   - Go to Plugins → Add New
   - Search "Insert Headers and Footers"
   - Install and activate

2. **Add widget code:**
   - Go to Settings → Insert Headers and Footers
   - In "Scripts in Footer" section, paste:

```html
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
<link
  rel="stylesheet"
  href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
/>
<script
  src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
  data-api-key="YOUR_GEMINI_API_KEY"
  data-api-url="https://bilal.metalogics.io/api"
  data-brand-color="#3b82f6"
  data-position="bottom-right"
></script>
```

3. **Save changes**

#### Method 2: Edit Theme Files

1. **Go to Appearance → Theme Editor**
2. **Select `footer.php`**
3. **Find the closing `</body>` tag**
4. **Add widget code before it**
5. **Update file**

### 🔹 Shopify Store

1. **Go to Online Store → Themes**
2. **Click "Actions" → "Edit code"**
3. **Open `theme.liquid` file**
4. **Find the closing `</body>` tag**
5. **Add widget code before it:**

```html
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
<link
  rel="stylesheet"
  href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
/>
<script
  src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
  data-api-key="{{ settings.chatbot_api_key }}"
  data-api-url="{{ settings.chatbot_api_url }}"
  data-brand-color="#3b82f6"
></script>
```

6. **Save the file**

### 🔹 React/Next.js Application

#### Method 1: Add to HTML Template

In `public/index.html` (React) or `pages/_document.js` (Next.js):

```html
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
<link
  rel="stylesheet"
  href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
/>
<script
  src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
  data-api-key="{process.env.REACT_APP_GEMINI_API_KEY}"
  data-api-url="{process.env.REACT_APP_API_URL}"
></script>
```

#### Method 2: Create a Component

```jsx
// components/ChatbotWidget.jsx
import { useEffect } from "react";

export default function ChatbotWidget() {
  useEffect(() => {
    // Load Retell SDK
    const retellScript = document.createElement("script");
    retellScript.src =
      "https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js";
    document.body.appendChild(retellScript);

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://bilal.metalogics.io/chatbot/metalogics-chatbot.css";
    document.head.appendChild(link);

    // Load Widget Script
    const script = document.createElement("script");
    script.src =
      "https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js";
    script.onload = () => {
      // Initialize widget after script loads
      if (window.MetalogicsChatbot) {
        window.MetalogicsChatbot.init({
          apiKey: process.env.REACT_APP_GEMINI_API_KEY,
          apiUrl: process.env.REACT_APP_API_URL,
          brandColor: "#3b82f6",
          position: "bottom-right",
        });
      }
    };
    document.body.appendChild(script);

    // Cleanup
    return () => {
      if (window.MetalogicsChatbot) {
        window.MetalogicsChatbot.destroy();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
```

Then use it in your app:

```jsx
// App.jsx
import ChatbotWidget from "./components/ChatbotWidget";

function App() {
  return (
    <div className="App">
      {/* Your app content */}
      <ChatbotWidget />
    </div>
  );
}
```

### 🔹 Wix Website

1. **Go to your Wix Editor**
2. **Click "Settings" → "Custom Code"**
3. **Click "Add Custom Code"**
4. **Paste the widget code:**

```html
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
<link
  rel="stylesheet"
  href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
/>
<script
  src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
  data-api-key="YOUR_GEMINI_API_KEY"
  data-api-url="https://bilal.metalogics.io/api"
></script>
```

5. **Set "Add Code to" → "Body - end"**
6. **Apply to all pages**
7. **Save and publish**

### 🔹 Squarespace Website

1. **Go to Settings → Advanced → Code Injection**
2. **In "Footer" section, add:**

```html
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
<link
  rel="stylesheet"
  href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
/>
<script
  src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
  data-api-key="YOUR_GEMINI_API_KEY"
  data-api-url="https://bilal.metalogics.io/api"
></script>
```

3. **Save**

---

## ⚙️ Configuration Options

### Required Settings

```html
data-api-key="YOUR_GEMINI_API_KEY"
<!-- Your Gemini API key -->
data-api-url="https://bilal.metalogics.io/api"
<!-- Your backend URL -->
```

### Optional Settings

```html
data-retell-agent-id="agent_xxx"
<!-- For voice features -->
data-brand-color="#ff6b6b"
<!-- Custom color (hex) -->
data-position="bottom-left"
<!-- Position: bottom-left or bottom-right -->
data-greeting="Hello! How can I help?"
<!-- Custom greeting message -->
```

### Complete Example with All Options

```html
<script
  src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
  data-api-key="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  data-api-url="https://bilal.metalogics.io/api"
  data-retell-agent-id="agent_1234567890abcdef"
  data-brand-color="#ff6b6b"
  data-position="bottom-left"
  data-greeting="Welcome to Metalogics! How can we help you today?"
></script>
```

---

## 🎨 Customization

### Change Colors

```html
data-brand-color="#your-color-here"
```

**Popular color examples:**

- Blue: `#3b82f6`
- Red: `#ef4444`
- Green: `#10b981`
- Purple: `#8b5cf6`
- Orange: `#f97316`

### Change Position

```html
data-position="bottom-left"
<!-- Left side -->
data-position="bottom-right"
<!-- Right side (default) -->
```

### Custom CSS (Advanced)

Add custom styles to override widget appearance:

```html
<style>
  .metalogics-chat-window {
    width: 450px !important;
    height: 700px !important;
  }

  .metalogics-chat-button {
    background-color: #your-color !important;
  }
</style>
```

---

## 🔧 Advanced Integration

### JavaScript API

For more control, use the JavaScript API:

```html
<script src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"></script>
<script>
  // Initialize with JavaScript
  window.MetalogicsChatbot.init({
    apiKey: "YOUR_GEMINI_API_KEY",
    apiUrl: "https://bilal.metalogics.io/api",
    retellAgentId: "YOUR_RETELL_AGENT_ID",
    brandColor: "#3b82f6",
    position: "bottom-right",
    greeting: "Welcome! How can I help you today?",

    // Advanced options
    autoOpen: false, // Don't auto-open on load
    showOnPages: ["/contact"], // Only show on specific pages
    hideOnMobile: false, // Hide on mobile devices

    // Event callbacks
    onOpen: () => console.log("Chat opened"),
    onClose: () => console.log("Chat closed"),
    onMessage: (message) => console.log("Message sent:", message),
  });
</script>
```

### Conditional Loading

Only load on specific pages:

```html
<script>
  // Only load chatbot on certain pages
  if (
    window.location.pathname === "/contact" ||
    window.location.pathname === "/support"
  ) {
    // Load chatbot scripts here
  }
</script>
```

### Lazy Loading

Load chatbot only when needed:

```html
<script>
  // Load chatbot when user scrolls or after delay
  setTimeout(() => {
    const script = document.createElement("script");
    script.src =
      "https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js";
    script.setAttribute("data-api-key", "YOUR_API_KEY");
    script.setAttribute("data-api-url", "https://bilal.metalogics.io/api");
    document.body.appendChild(script);
  }, 3000); // Load after 3 seconds
</script>
```

---

## 🧪 Testing Your Integration

### 1. Check Files Load

Open browser developer tools (F12) and check:

1. **Network tab** - ensure files load without errors:

   - `metalogics-chatbot.iife.js` - should return 200 status
   - `metalogics-chatbot.css` - should return 200 status

2. **Console tab** - check for JavaScript errors

### 2. Test Widget Appearance

1. **Look for chat button** in bottom-right (or bottom-left) corner
2. **Button should be visible** and styled with your brand color
3. **Click the button** - chat window should open

### 3. Test Chat Functionality

1. **Click chat button** to open
2. **Type a test message** and press Enter
3. **Should see "typing..." indicator**
4. **Should receive AI response**

### 4. Test Voice (if enabled)

1. **Look for microphone icon** in chat window
2. **Click microphone** - should request permission
3. **Allow microphone access**
4. **Speak a message** - should see transcription
5. **Should hear AI voice response**

---

## 🚨 Troubleshooting

### Widget Doesn't Appear

**Check these common issues:**

1. **Script tag placement** - must be before `</body>`
2. **File URLs** - ensure files are accessible:
   ```
   https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js
   https://bilal.metalogics.io/chatbot/metalogics-chatbot.css
   ```
3. **API key** - ensure `data-api-key` is set correctly
4. **Browser console** - check for JavaScript errors

### Chat Not Responding

1. **Check API URL** - ensure backend is running
2. **Check CORS** - backend must allow your domain
3. **Check API key** - must be valid Gemini API key
4. **Test backend directly:**
   ```bash
   curl -X POST https://bilal.metalogics.io/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"test","sessionId":"test123"}'
   ```

### Voice Not Working

1. **HTTPS required** - voice features need secure connection
2. **Microphone permission** - user must allow access
3. **Retell SDK** - ensure it loads before widget
4. **Agent ID** - check `data-retell-agent-id` is correct

### CORS Errors

Add to your backend or `.htaccess`:

```apache
# .htaccess
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

---

## 📊 Performance Tips

### 1. Optimize Loading

```html
<!-- Preload critical resources -->
<link
  rel="preload"
  href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
  as="script"
/>
<link
  rel="preload"
  href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
  as="style"
/>
```

### 2. Use CDN

Upload files to a CDN for faster loading:

- AWS CloudFront
- Cloudflare
- jsDelivr
- unpkg

### 3. Enable Compression

Ensure your server serves files with gzip compression:

```apache
# .htaccess
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE application/javascript text/css
</IfModule>
```

### 4. Cache Headers

Set long cache times for widget files:

```apache
# .htaccess
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
</IfModule>
```

---

## 🔒 Security Best Practices

### 1. Don't Expose API Keys

**❌ Bad - API key in frontend:**

```html
data-api-key="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**✅ Good - API key in backend:**

```javascript
// Backend handles API key
app.post('/api/chat', (req, res) => {
  const response = await gemini.generateContent({
    apiKey: process.env.GEMINI_API_KEY, // Secure
    message: req.body.message
  });
});
```

### 2. Implement Rate Limiting

```javascript
// Backend rate limiting
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/chat", limiter);
```

### 3. Validate Inputs

```javascript
// Backend input validation
app.post("/api/chat", (req, res) => {
  const { message } = req.body;

  if (!message || message.length > 1000) {
    return res.status(400).json({ error: "Invalid message" });
  }

  // Process message...
});
```

---

## 📈 Analytics & Monitoring

### Track Widget Usage

Add event tracking to monitor chatbot usage:

```html
<script>
  // Google Analytics 4
  gtag("event", "chatbot_loaded", {
    event_category: "engagement",
  });

  // Track when chat opens
  window.addEventListener("chatbot_opened", () => {
    gtag("event", "chatbot_opened", {
      event_category: "engagement",
    });
  });

  // Track messages sent
  window.addEventListener("chatbot_message_sent", () => {
    gtag("event", "chatbot_message_sent", {
      event_category: "engagement",
    });
  });
</script>
```

---

## 🎯 Complete Example

Here's a complete HTML page with the widget integrated:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Website with AI Chatbot</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Welcome to My Website</h1>
      <p>
        This is my website with an AI-powered chatbot. Look for the chat button
        in the bottom-right corner!
      </p>

      <h2>Features</h2>
      <ul>
        <li>AI-powered conversations</li>
        <li>Voice chat capabilities</li>
        <li>Appointment booking</li>
        <li>24/7 availability</li>
      </ul>

      <p>
        Try asking the chatbot questions about our services or book a
        consultation!
      </p>
    </div>

    <!-- Chatbot Widget Integration -->
    <!-- Retell SDK for voice features -->
    <script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>

    <!-- Widget CSS -->
    <link
      rel="stylesheet"
      href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
    />

    <!-- Widget Script -->
    <script
      src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
      data-api-key="YOUR_GEMINI_API_KEY"
      data-api-url="https://bilal.metalogics.io/api"
      data-retell-agent-id="YOUR_RETELL_AGENT_ID"
      data-brand-color="#3b82f6"
      data-position="bottom-right"
      data-greeting="Hello! Welcome to our website. How can I help you today?"
    ></script>

    <!-- Optional: Analytics tracking -->
    <script>
      // Track chatbot usage
      window.addEventListener("load", () => {
        console.log("Chatbot widget loaded successfully!");
      });
    </script>
  </body>
</html>
```

---

## ✅ Final Checklist

Before going live, make sure:

- [ ] Widget files uploaded to server
- [ ] Script tag added before `</body>`
- [ ] API key configured (or backend handles it)
- [ ] Backend URL is correct
- [ ] HTTPS enabled (required for voice)
- [ ] CORS headers configured
- [ ] Tested on desktop browser
- [ ] Tested on mobile browser
- [ ] Chat functionality works
- [ ] Voice features work (if enabled)
- [ ] Custom colors applied
- [ ] Position is correct
- [ ] No JavaScript errors in console
- [ ] Files load without 404 errors

---

## 🎉 Success!

Your chatbot widget is now integrated into your website! Visitors can:

✅ **Chat with AI** - Get instant responses to questions
✅ **Use voice** - Speak naturally with the assistant  
✅ **Book appointments** - Schedule consultations directly
✅ **Get support** - 24/7 automated assistance

The widget will appear as a chat button in the bottom corner of your website. When clicked, it opens a full chat interface with your AI assistant.

**Need help?** Check the troubleshooting section above or contact support.

---

_Last updated: December 2024_
