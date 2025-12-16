# 🚀 Deploy Chatbot Widget to Hostinger - Complete Guide

## Overview

This guide will help you deploy your Metalogics chatbot widget to your Hostinger domain in 3 simple steps.

---

## Prerequisites

- ✅ Hostinger hosting account with your domain
- ✅ FTP/File Manager access
- ✅ Your Gemini API key
- ✅ Your backend deployed (or use localhost for testing)

---

## Step 1: Build the Widget (5 minutes)

### On Your Local Machine:

```bash
cd widget
npm install
npm run build
```

**This creates:**

- `widget/dist/metalogics-chatbot.iife.js` (~500KB, ~150KB gzipped)
- `widget/dist/metalogics-chatbot.css` (~15KB, ~5KB gzipped)

---

## Step 2: Upload to Hostinger (5 minutes)

### Option A: Using Hostinger File Manager (Easiest)

1. **Login to Hostinger:**

   - Go to https://hpanel.hostinger.com
   - Login to your account

2. **Open File Manager:**

   - Click on your hosting plan
   - Click "File Manager"

3. **Navigate to public_html:**

   - Open `public_html` folder (this is your website root)

4. **Create chatbot folder:**

   - Click "New Folder"
   - Name it `chatbot` or `assets`

5. **Upload files:**
   - Open the `chatbot` folder
   - Click "Upload Files"
   - Upload both files from `widget/dist/`:
     - `metalogics-chatbot.iife.js`
     - `metalogics-chatbot.css`

**Your files will be at:**

```
https://yourdomain.com/chatbot/metalogics-chatbot.iife.js
https://yourdomain.com/chatbot/metalogics-chatbot.css
```

### Option B: Using FTP (FileZilla)

1. **Get FTP credentials from Hostinger:**

   - Go to Hosting → FTP Accounts
   - Note: Hostname, Username, Password, Port

2. **Connect with FileZilla:**

   - Host: `ftp.yourdomain.com`
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21

3. **Upload files:**
   - Navigate to `public_html/chatbot/`
   - Drag and drop both files from `widget/dist/`

---

## Step 3: Add Widget to Your Website (5 minutes)

### For WordPress Sites:

1. **Install "Insert Headers and Footers" plugin:**

   - Go to Plugins → Add New
   - Search "Insert Headers and Footers"
   - Install and activate

2. **Add widget code:**
   - Go to Settings → Insert Headers and Footers
   - In "Scripts in Footer" section, paste:

```html
<!-- Retell SDK for voice features -->
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>

<!-- Chatbot Widget CSS -->
<link
  rel="stylesheet"
  href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
/>

<!-- Chatbot Widget Script -->
<script
  src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
  data-api-key="your_gemini_api_key_here"
  data-api-url="http://localhost:3000"
  data-retell-agent-id="your_retell_agent_id_heredb"
  data-brand-color="#3b82f6"
  data-position="bottom-right"
></script>
```

3. **Replace placeholders:**

   - `yourdomain.com` → Your actual domain
   - `YOUR_GEMINI_API_KEY` → Your Gemini API key
   - `https://your-backend.com` → Your backend URL
   - `YOUR_RETELL_AGENT_ID` → Your Retell agent ID (optional)

4. **Save changes**

### For Static HTML Sites:

1. **Edit your HTML files:**

   - Use Hostinger File Manager
   - Open your `index.html` or main HTML file
   - Click "Edit"

2. **Add before closing `</body>` tag:**

```html
<!-- Retell SDK for voice features -->
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>

<!-- Chatbot Widget CSS -->
<link
  rel="stylesheet"
  href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
/>

<!-- Chatbot Widget Script -->
<script
  src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
  data-api-key="YOUR_GEMINI_API_KEY"
  data-api-url="https://your-backend.com"
  data-brand-color="#3b82f6"
  data-position="bottom-right"
></script>
```

3. **Save the file**

### For Other Platforms (Wix, Weebly, etc.):

1. **Find "Custom Code" or "Embed Code" section**
2. **Add the same code snippet**
3. **Save and publish**

---

## Step 4: Test Your Widget ✅

1. **Open your website:**

   ```
   https://yourdomain.com
   ```

2. **Look for the chat button:**

   - Should appear in bottom-right corner (or bottom-left if configured)
   - Blue circular button with chat icon

3. **Click and test:**

   - Click the button
   - Chat window should open
   - Type a message and press Enter
   - You should get a response from the AI

4. **Test voice (if enabled):**
   - Click the microphone icon
   - Allow microphone permissions
   - Speak your message

---

## Configuration Options

### Required Settings:

```html
data-api-key="YOUR_GEMINI_API_KEY"
<!-- Your Gemini API key -->
data-api-url="https://your-backend.com"
<!-- Your backend URL -->
```

### Optional Settings:

```html
data-retell-agent-id="agent_xxx"
<!-- For voice features -->
data-brand-color="#ff6b6b"
<!-- Custom color (hex) -->
data-position="bottom-left"
<!-- Position: bottom-left or bottom-right -->
```

### Example with Custom Settings:

```html
<script
  src="https://yourdomain.com/chatbot/metalogics-chatbot.iife.js"
  data-api-key="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  data-api-url="https://api.yourdomain.com"
  data-retell-agent-id="agent_1234567890abcdef"
  data-brand-color="#ff6b6b"
  data-position="bottom-left"
></script>
```

---

## Backend Deployment on Hostinger

If you want to deploy your backend on Hostinger too:

### Option 1: Node.js Hosting (if available)

1. **Check if your plan supports Node.js:**

   - Go to Hosting → Advanced → Node.js
   - If available, you can deploy your backend

2. **Upload backend files:**
   - Upload your `backend` folder via FTP
   - Install dependencies: `npm install`
   - Start server: `npm start`

### Option 2: Use External Backend

Deploy backend elsewhere and use the URL:

- **Heroku:** Free tier available
- **Railway:** Easy Node.js deployment
- **Render:** Free tier with auto-deploy
- **DigitalOcean:** $5/month droplet

Then use that URL in `data-api-url`:

```html
data-api-url="https://your-app.herokuapp.com"
```

---

## Enable HTTPS (Important for Voice Features)

### Hostinger SSL Certificate:

1. **Go to Hostinger panel**
2. **Navigate to SSL**
3. **Enable "Free SSL Certificate"**
4. **Wait 10-15 minutes for activation**

**Why HTTPS is important:**

- Required for microphone access (voice features)
- Better security
- Better SEO ranking
- Browser trust

---

## Optimize Performance on Hostinger

### 1. Enable Gzip Compression

Create/edit `.htaccess` in `public_html`:

```apache
# Enable Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static files
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>

# Enable CORS (if needed)
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
</IfModule>
```

### 2. Use Hostinger CDN (if available)

- Go to Hosting → Performance
- Enable CDN if available in your plan
- This will speed up widget loading globally

---

## Troubleshooting

### Widget doesn't appear:

1. **Check browser console (F12):**

   - Look for errors
   - Common: "Failed to load resource"

2. **Verify file URLs:**

   - Open in browser: `https://yourdomain.com/chatbot/metalogics-chatbot.iife.js`
   - Should download the file

3. **Check API key:**
   - Ensure `data-api-key` is set correctly
   - No extra spaces or quotes

### CORS errors:

Add to `.htaccess`:

```apache
Header set Access-Control-Allow-Origin "*"
```

### Chat not responding:

1. **Check backend URL:**

   - Ensure `data-api-url` is correct
   - Backend must be running and accessible

2. **Check backend logs:**

   - Look for errors in backend console

3. **Test backend directly:**
   ```bash
   curl -X POST https://your-backend.com/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"test","sessionId":"test123"}'
   ```

### Voice not working:

1. **Check HTTPS:**

   - Voice requires HTTPS
   - Ensure SSL is enabled

2. **Check Retell SDK:**

   - Ensure Retell SDK loads before widget
   - Check browser console for errors

3. **Check microphone permissions:**
   - Browser must have microphone access
   - Check browser settings

---

## Update Widget (When You Make Changes)

1. **Rebuild locally:**

   ```bash
   cd widget
   npm run build
   ```

2. **Upload new files:**

   - Use File Manager or FTP
   - Replace old files with new ones

3. **Clear cache:**
   - Add version parameter to force reload:
   ```html
   <script src="https://yourdomain.com/chatbot/metalogics-chatbot.iife.js?v=2"></script>
   ```

---

## Security Best Practices

### 1. Don't expose API keys in frontend

**Bad:**

```html
data-api-key="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Good:**

- Store API key in backend
- Frontend calls backend
- Backend uses API key to call Gemini

### 2. Implement rate limiting

In your backend:

```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests
});

app.use("/api/chat", limiter);
```

### 3. Validate inputs

```javascript
app.post("/api/chat", (req, res) => {
  const { message } = req.body;

  if (!message || message.length > 1000) {
    return res.status(400).json({ error: "Invalid message" });
  }

  // Process message...
});
```

---

## Cost Considerations

### Hostinger Hosting:

- **Shared hosting:** $2-4/month (sufficient for most sites)
- **VPS:** $4-8/month (if you need Node.js backend)

### API Costs:

- **Gemini API:** Free tier available, then pay-per-use
- **Retell AI:** Pay-per-minute for voice calls

### Bandwidth:

- Widget files: ~155KB total (gzipped)
- 1000 page loads = ~155MB bandwidth
- Most Hostinger plans include unlimited bandwidth

---

## Monitoring & Analytics

### Track widget usage:

Add to your backend:

```javascript
app.post("/api/chat", (req, res) => {
  // Log to file or database
  console.log("Chat message:", {
    sessionId: req.body.sessionId,
    timestamp: new Date(),
    message: req.body.message,
  });

  // Process message...
});
```

### Google Analytics:

Add custom events:

```javascript
// When chat opens
gtag("event", "chatbot_opened", {
  event_category: "engagement",
});

// When message sent
gtag("event", "chatbot_message_sent", {
  event_category: "engagement",
});
```

---

## Quick Reference

### File Locations:

```
public_html/
├── chatbot/
│   ├── metalogics-chatbot.iife.js
│   └── metalogics-chatbot.css
└── index.html (or your main HTML file)
```

### Widget URLs:

```
https://yourdomain.com/chatbot/metalogics-chatbot.iife.js
https://yourdomain.com/chatbot/metalogics-chatbot.css
```

### Integration Code:

```html
<script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
<link
  rel="stylesheet"
  href="https://yourdomain.com/chatbot/metalogics-chatbot.css"
/>
<script
  src="https://yourdomain.com/chatbot/metalogics-chatbot.iife.js"
  data-api-key="YOUR_API_KEY"
  data-api-url="https://your-backend.com"
></script>
```

---

## Next Steps

1. ✅ Build widget locally
2. ✅ Upload to Hostinger
3. ✅ Add integration code to website
4. ✅ Test on your domain
5. ✅ Enable HTTPS
6. ✅ Deploy backend (if needed)
7. ✅ Monitor usage
8. ✅ Customize branding

---

## Support

**Documentation:**

- [WIDGET_QUICK_REFERENCE.md](WIDGET_QUICK_REFERENCE.md)
- [widget/QUICKSTART.md](widget/QUICKSTART.md)
- [widget/INTEGRATION_GUIDE.md](widget/INTEGRATION_GUIDE.md)

**Hostinger Support:**

- Live chat: Available 24/7
- Knowledge base: https://support.hostinger.com

**Need help?**

- Check browser console (F12) for errors
- Test backend endpoint directly
- Verify file URLs are accessible

---

## Success! 🎉

Your chatbot widget is now live on your Hostinger domain. Visitors can chat with your AI assistant, use voice features, and book appointments directly from your website.

**What you've accomplished:**

- ✅ Built production-ready widget
- ✅ Deployed to Hostinger hosting
- ✅ Integrated on your website
- ✅ Enabled AI-powered conversations
- ✅ Added voice capabilities
- ✅ Set up appointment booking

**Your website now has a professional AI chatbot!** 🚀
