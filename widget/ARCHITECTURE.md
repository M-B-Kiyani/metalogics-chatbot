# Metalogics Chatbot Widget - Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ANY WEBSITE                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    HTML Page                                │ │
│  │                                                              │ │
│  │  <script src="metalogics-chatbot.iife.js"                  │ │
│  │          data-api-key="..."                                 │ │
│  │          data-api-url="..."></script>                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Loads Widget
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WIDGET (IIFE Bundle)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              window.MetalogicsChatbot                       │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  init()  - Initialize widget                         │  │ │
│  │  │  destroy() - Clean up widget                         │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              │ Renders                           │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         UnifiedChatWidget Component                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ Chat Button  │  │ Chat Window  │  │ Chat Input   │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  │  ┌──────────────┐  ┌──────────────┐                       │ │
│  │  │ Voice Button │  │ Messages     │                       │ │
│  │  └──────────────┘  └──────────────┘                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │                    │
                    │ Text Chat          │ Voice Call
                    ▼                    ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   YOUR BACKEND API       │  │   RETELL AI SERVICE      │
│                          │  │                          │
│  POST /api/chat          │  │  WebSocket Connection    │
│  POST /api/retell/       │  │  Voice Transcription     │
│       register-call      │  │  Text-to-Speech          │
└──────────────────────────┘  └──────────────────────────┘
```

---

## 📦 Widget Bundle Structure

```
metalogics-chatbot.iife.js
├── React Runtime
├── React DOM
├── UnifiedChatWidget Component
│   ├── State Management (useState, useEffect)
│   ├── Message Handling
│   ├── Voice Integration
│   └── Storage Management
├── Retell Client Integration
├── LocalStorage Service
└── Global API (window.MetalogicsChatbot)
```

---

## 🔄 Data Flow

### Text Chat Flow

```
User Types Message
       │
       ▼
Widget State Update
       │
       ▼
POST /api/chat
       │
       ▼
Backend Processing
       │
       ▼
Gemini AI Response
       │
       ▼
Widget Displays Response
       │
       ▼
Save to LocalStorage
```

### Voice Chat Flow

```
User Clicks Voice Button
       │
       ▼
Request Access Token
(POST /api/retell/register-call)
       │
       ▼
Start Retell Call
       │
       ▼
User Speaks
       │
       ▼
Retell Transcribes
       │
       ▼
Backend Processes
       │
       ▼
AI Generates Response
       │
       ▼
Retell Speaks Response
       │
       ▼
Widget Shows Transcript
       │
       ▼
Save to LocalStorage
```

---

## 🗂️ Component Hierarchy

```
UnifiedChatWidget
├── Chat Button (when closed)
│   └── SVG Icon
│
└── Chat Window (when open)
    ├── Header
    │   ├── Avatar
    │   ├── Title & Status
    │   ├── Clear Button
    │   └── Close Button
    │
    ├── Messages Container
    │   ├── Message (User)
    │   ├── Message (Assistant)
    │   └── Loader (when loading)
    │
    ├── Input Container
    │   ├── Text Input
    │   ├── Voice Button
    │   └── Send Button
    │
    └── Branding Footer
```

---

## 💾 State Management

### Widget State

```typescript
interface WidgetState {
  isOpen: boolean; // Chat window open/closed
  messages: Message[]; // Chat history
  userInput: string; // Current input text
  isLoading: boolean; // AI processing
  isVoiceActive: boolean; // Voice call active
  voiceStatus: string; // Voice status text
}
```

### LocalStorage Schema

```typescript
{
  "metalogics_chat_messages": Message[],
  "metalogics_session_id": string
}
```

### Session Storage Schema

```typescript
{
  "metalogics_session_id": string
}
```

---

## 🔌 API Integration

### Backend API Contract

**Chat Endpoint:**

```typescript
// Request
POST / api / chat;
{
  message: string;
  sessionId: string;
}

// Response
{
  response: string;
}
```

**Voice Registration:**

```typescript
// Request
POST / api / retell / register - call;
{
  agentId: string;
  sessionId: string;
}

// Response
{
  success: boolean;
  accessToken: string;
  callId: string;
}
```

---

## 🎨 Styling Architecture

### CSS Structure

```
styles.css
├── Base Styles
│   ├── Reset
│   └── Variables
│
├── Widget Components
│   ├── .metalogics-chat-button
│   ├── .metalogics-chat-window
│   ├── .metalogics-chat-header
│   ├── .metalogics-messages-container
│   ├── .metalogics-message
│   ├── .metalogics-input-container
│   └── .metalogics-branding
│
├── Utility Classes
│   ├── .metalogics-icon-button
│   ├── .metalogics-voice-button
│   └── .metalogics-send-button
│
└── Responsive Styles
    ├── Desktop (> 768px)
    └── Mobile (≤ 768px)
```

### Tailwind Integration

The widget uses Tailwind CSS for utility classes, which are compiled into the final CSS bundle.

---

## 🔐 Security Architecture

### Client-Side Security

```
Widget (Frontend)
├── No API Keys Stored
├── Session ID Only
├── Input Sanitization
└── CORS Compliance
```

### Backend Security

```
Backend API
├── API Key Validation
├── Rate Limiting
├── CORS Configuration
├── Input Validation
└── Session Management
```

---

## 📊 Performance Optimization

### Bundle Optimization

```
Build Process
├── Tree Shaking (Remove unused code)
├── Minification (Reduce file size)
├── Code Splitting (Separate chunks)
└── Compression (Gzip/Brotli)
```

### Runtime Optimization

```
Widget Runtime
├── Lazy Loading (Load on demand)
├── Debouncing (Reduce API calls)
├── Memoization (Cache results)
└── Virtual Scrolling (Large message lists)
```

---

## 🔄 Lifecycle

### Initialization

```
1. Script Tag Loaded
2. Parse Data Attributes
3. Create Container Element
4. Mount React Component
5. Initialize Retell Client
6. Load Chat History
7. Ready for User Interaction
```

### Cleanup

```
1. User Closes Page
2. Unmount React Component
3. Stop Active Voice Call
4. Save Chat History
5. Remove Container Element
6. Clean Up Event Listeners
```

---

## 🌐 Cross-Origin Communication

### CORS Configuration

```
Widget Domain: https://yoursite.com
Backend Domain: https://api.yoursite.com

Required Headers:
- Access-Control-Allow-Origin: https://yoursite.com
- Access-Control-Allow-Methods: POST, GET, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 📱 Responsive Design

### Breakpoints

```
Desktop (> 768px)
├── Fixed Position (bottom-right/left)
├── 400px × 600px Window
└── Floating Button

Mobile (≤ 768px)
├── Full Screen Overlay
├── 100% Width × 100% Height
└── Fixed Button
```

---

## 🧪 Testing Architecture

### Unit Tests

```
Components
├── UnifiedChatWidget.test.tsx
├── Loader.test.tsx
└── Storage.test.ts
```

### Integration Tests

```
API Integration
├── Chat Endpoint Test
├── Voice Registration Test
└── Error Handling Test
```

### E2E Tests

```
User Flows
├── Open Widget
├── Send Message
├── Start Voice Call
└── Close Widget
```

---

## 🚀 Deployment Architecture

### CDN Distribution

```
CDN (CloudFront/Netlify/Vercel)
├── metalogics-chatbot.iife.js
│   ├── Cache: 1 year
│   ├── Compression: Gzip/Brotli
│   └── CORS: Enabled
│
└── metalogics-chatbot.css
    ├── Cache: 1 year
    ├── Compression: Gzip/Brotli
    └── CORS: Enabled
```

### Multi-Region Setup

```
Global Distribution
├── US East (Primary)
├── US West (Backup)
├── Europe (Primary)
└── Asia Pacific (Primary)
```

---

## 📈 Monitoring & Analytics

### Metrics Tracked

```
Widget Metrics
├── Load Time
├── Initialization Time
├── Message Count
├── Voice Call Duration
├── Error Rate
└── User Engagement
```

### Logging

```
Client-Side Logs
├── Widget Initialization
├── API Calls
├── Voice Events
├── Errors
└── User Actions
```

---

## 🔧 Configuration Management

### Environment-Based Config

```
Development
├── API URL: http://localhost:3000
├── Debug Mode: Enabled
└── Source Maps: Enabled

Production
├── API URL: https://api.yoursite.com
├── Debug Mode: Disabled
└── Source Maps: Disabled
```

---

## 📚 Technology Stack

### Core Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Retell SDK** - Voice integration

### Build Tools

- **Vite** - Fast builds
- **Rollup** - Bundling
- **PostCSS** - CSS processing
- **Autoprefixer** - Browser compatibility

---

## 🎯 Design Principles

1. **Minimal Footprint** - Small bundle size
2. **Zero Dependencies** - Self-contained
3. **Framework Agnostic** - Works anywhere
4. **Progressive Enhancement** - Graceful degradation
5. **Accessibility First** - WCAG compliant
6. **Mobile First** - Responsive design
7. **Performance** - Fast load times
8. **Security** - No sensitive data in frontend

---

This architecture ensures the widget is:

- ✅ Easy to integrate
- ✅ Performant
- ✅ Secure
- ✅ Maintainable
- ✅ Scalable
- ✅ Cross-platform compatible
