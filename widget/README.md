# Metalogics Chatbot Widget

A professional, embeddable AI chatbot widget with voice capabilities that can be integrated into any website with a single script tag.

## ✨ Features

### Core Features

- ✅ **AI-Powered Chat** - Google Gemini AI with RAG support
- ✅ **Voice Chat** - Real-time voice conversations with Retell AI
- ✅ **Booking System** - Schedule consultations directly through chat
- ✅ **Chat History** - Persists across page reloads
- ✅ **Mobile Responsive** - Works perfectly on all devices
- ✅ **Easy Integration** - Single script tag to add to any website

### UI/UX

- ✅ **Professional Design** - Clean, modern interface
- ✅ **Customizable Colors** - Match your brand perfectly
- ✅ **Smooth Animations** - Loading indicators and transitions
- ✅ **Accessibility** - ARIA labels and keyboard navigation
- ✅ **Session Management** - Unique session IDs for tracking

### Technical

- ✅ **TypeScript** - Type-safe development
- ✅ **React 19** - Latest React features
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **Production Optimized** - Minified and tree-shaken
- ✅ **CORS Ready** - Works across domains

## 🚀 Quick Start

### Option 1: Automated Build (Recommended)

**Windows:**

```bash
cd widget
build-and-test.bat
```

**Mac/Linux:**

```bash
cd widget
chmod +x build-and-test.sh
./build-and-test.sh
```

### Option 2: Manual Build

```bash
cd widget
npm install
npm run build
npm run serve  # Test the build
```

This creates:

- `dist/metalogics-chatbot.iife.js` - Widget script (~150KB gzipped)
- `dist/metalogics-chatbot.css` - Widget styles (~5KB gzipped)

## 📦 Integration

### Simple Integration (Data Attributes)

Add to your HTML before closing `</body>`:

```html
<link rel="stylesheet" href="https://your-cdn.com/metalogics-chatbot.css" />
<script
  src="https://your-cdn.com/metalogics-chatbot.iife.js"
  data-api-key="YOUR_API_KEY"
  data-api-url="https://your-backend.com"
  data-brand-color="#3b82f6"
  data-position="bottom-right"
></script>
```

### Advanced Integration (JavaScript API)

```html
<script src="https://your-cdn.com/metalogics-chatbot.iife.js"></script>
<script>
  window.MetalogicsChatbot.init({
    apiKey: "YOUR_API_KEY",
    apiUrl: "https://your-backend.com",
    brandColor: "#ff6b6b",
    position: "bottom-left",
    greeting: "Hi! How can I help you today?",
  });
</script>
```

## ⚙️ Configuration

| Option       | Type   | Required | Default                 | Description                     |
| ------------ | ------ | -------- | ----------------------- | ------------------------------- |
| `apiKey`     | string | ✅ Yes   | -                       | Your API key                    |
| `apiUrl`     | string | ❌ No    | `http://localhost:3000` | Backend API URL                 |
| `brandColor` | string | ❌ No    | `#3b82f6`               | Primary brand color (hex)       |
| `position`   | string | ❌ No    | `bottom-right`          | `bottom-right` or `bottom-left` |
| `greeting`   | string | ❌ No    | Default greeting        | Custom welcome message          |

## 🎨 Customization

### Change Brand Color

```javascript
MetalogicsChatbot.init({
  apiKey: "YOUR_API_KEY",
  brandColor: "#ff6b6b", // Your brand color
});
```

### Change Position

```javascript
MetalogicsChatbot.init({
  apiKey: "YOUR_API_KEY",
  position: "bottom-left", // or 'bottom-right'
});
```

### Custom Greeting

```javascript
MetalogicsChatbot.init({
  apiKey: "YOUR_API_KEY",
  greeting: "Welcome to Acme Corp! How can we help?",
});
```

## 🔧 Backend Requirements

Your backend should have a POST endpoint at `/api/chat`:

**Request:**

```json
{
  "message": "User's message",
  "sessionId": "session_1234567890_abc123"
}
```

**Response:**

```json
{
  "response": "AI assistant's response"
}
```

## 📱 Mobile Support

The widget is fully responsive:

- Desktop: 400px × 600px floating window
- Mobile: Full-screen overlay with margins
- Tablet: Adaptive sizing

## 💾 Chat History

- Automatically saves to localStorage
- Persists across page reloads
- Users can clear history with trash icon
- Session IDs stored in sessionStorage

## 🧪 Testing

### Test in Development

```bash
npm run dev
```

### Test Production Build

```bash
npm run build
npm run serve
```

### Test on Your Website

1. Build the widget: `npm run build`
2. Copy `dist/metalogics-chatbot.iife.js` and `dist/metalogics-chatbot.css` to your server
3. Add the script tag to your HTML
4. Open your website and test

## 📚 Full Documentation

See [WIDGET_INTEGRATION.md](../docs/WIDGET_INTEGRATION.md) for complete integration guide with examples for:

- WordPress
- React/Next.js
- Shopify
- Static HTML
- And more!

## 🐛 Troubleshooting

### Widget doesn't appear

- Check browser console for errors
- Verify script URL is correct
- Ensure `data-api-key` is set

### CORS errors

- Add CORS headers to your backend
- Check API URL is correct

### Chat history not saving

- Check if localStorage is enabled
- Test in incognito mode

## 📄 License

© 2025 Metalogics. All rights reserved.
