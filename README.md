# Metalogics AI Assistant - Monorepo

A complete AI-powered booking system with intelligent chatbot interface, consisting of three independent services.

## 🏗️ Repository Structure

```
metalogics-chatbot/
├── backend/              # 🔧 API Service
│   ├── src/             # Source code
│   ├── prisma/          # Database schema
│   ├── Dockerfile       # Container configuration
│   ├── railway.json     # Railway deployment config
│   ├── package.json     # Dependencies & scripts
│   └── .env.example     # Environment template
│
├── frontend/            # 🌐 Website/Dashboard
│   ├── components/      # React components
│   ├── services/        # API services
│   ├── public/          # Static assets
│   ├── Dockerfile       # Container configuration
│   ├── railway.json     # Railway deployment config
│   ├── package.json     # Dependencies & scripts
│   └── .env.example     # Environment template
│
├── widget/              # 🔗 Embeddable Widget
│   ├── src/            # Widget source code
│   ├── dist/           # Built widget files
│   ├── Dockerfile      # Container configuration
│   ├── railway.json    # Railway deployment config
│   ├── package.json    # Dependencies & scripts
│   └── .env.example    # Environment template
│
├── docs/               # 📚 Documentation
├── package.json        # 📦 Monorepo management
├── validate-deployment.js  # 🧪 Deployment validator
└── README.md          # 📖 This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database
- Railway account (for deployment)

### 1. Install Dependencies

```bash
# Install all services at once
npm run install:all

# Or install individually
npm install --prefix backend
npm install --prefix frontend
npm install --prefix widget
```

### 2. Environment Setup

Copy and configure environment files for each service:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration

# Widget
cp widget/.env.example widget/.env
# Edit widget/.env with your configuration
```

### 3. Development

```bash
# Start all services in development mode
npm run dev:backend    # API server on port 3000
npm run dev:frontend   # Frontend on port 5173
npm run dev:widget     # Widget dev server on port 5174
```

### 4. Build & Production

```bash
# Build all services
npm run build:all

# Start production servers
npm run start:backend
npm run start:frontend
npm run start:widget
```

## 🏢 Services Overview

### 🔧 Backend Service (`/backend`)

- **Purpose**: REST API and WebSocket server
- **Tech Stack**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Features**:
  - Booking management API
  - Voice integration (Retell AI)
  - Calendar integration (Google Calendar)
  - CRM integration (HubSpot)
  - Real-time chat via WebSocket
  - Health monitoring

### 🌐 Frontend Service (`/frontend`)

- **Purpose**: Main website and admin dashboard
- **Tech Stack**: React, TypeScript, Vite, Tailwind CSS
- **Features**:
  - Interactive chatbot interface
  - Voice conversation support
  - Booking management UI
  - Real-time messaging
  - Responsive design

### 🔗 Widget Service (`/widget`)

- **Purpose**: Embeddable chatbot widget for external websites
- **Tech Stack**: React, TypeScript, Vite (IIFE build)
- **Features**:
  - Lightweight embeddable widget
  - Cross-domain compatibility
  - Voice integration support
  - Customizable branding
  - Easy integration

## 🚢 Railway Deployment

Each service deploys independently on Railway:

### 1. Backend Deployment

```bash
# Railway Service Settings:
Root Directory: backend
Build: Dockerfile
Health Check: /health
```

### 2. Frontend Deployment

```bash
# Railway Service Settings:
Root Directory: frontend
Build: Dockerfile
Serves: Static files
```

### 3. Widget Deployment

```bash
# Railway Service Settings:
Root Directory: widget
Build: Dockerfile
Serves: Widget files (JS/CSS)
```

### Environment Variables

#### Backend

```env
NODE_ENV=production
API_KEY=your-secure-api-key-min-32-characters-long
WIDGET_API_KEY=your-public-widget-key-for-embeds
DATABASE_URL=postgresql://...
ALLOWED_ORIGINS=*
```

#### Frontend

```env
VITE_API_BASE_URL=https://your-backend-url.up.railway.app
VITE_API_KEY=your-secure-api-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

#### Widget

```env
VITE_API_URL=https://your-backend-url.up.railway.app
PUBLIC_WIDGET_KEY=your-public-widget-key
```

## 🔗 Widget Integration

Embed the chatbot widget on any website:

```html
<!-- Load widget script -->
<script
  src="https://your-widget-url.up.railway.app/metalogics-chatbot.iife.js"
  data-api-key="your-public-widget-key"
  data-api-url="https://your-backend-url.up.railway.app"
  data-brand-color="#3b82f6"
  data-position="bottom-right"
></script>

<!-- Load widget styles -->
<link
  rel="stylesheet"
  href="https://your-widget-url.up.railway.app/metalogics-chatbot.css"
/>
```

## 🧪 Testing & Validation

### Validate Deployment

```bash
# Test all services after deployment
npm run validate

# Or run directly
node validate-deployment.js
```

### Manual Testing

```bash
# Test backend health
curl https://your-backend-url.up.railway.app/health

# Test frontend
curl https://your-frontend-url.up.railway.app

# Test widget files
curl https://your-widget-url.up.railway.app/metalogics-chatbot.iife.js
```

## 📚 Documentation

- [`docs/`](./docs/) - **Complete documentation index**
- [`docs/RAILWAY_DEPLOYMENT_GUIDE.md`](./docs/RAILWAY_DEPLOYMENT_GUIDE.md) - Railway deployment
- [`docs/WIDGET_INTEGRATION_COMPLETE.md`](./docs/WIDGET_INTEGRATION_COMPLETE.md) - Widget setup
- [`docs/VOICE_INTEGRATION_README.md`](./docs/VOICE_INTEGRATION_README.md) - Voice features
- [`backend/README.md`](./backend/README.md) - Backend API documentation
- [`widget/README.md`](./widget/README.md) - Widget integration guide

## 🛠️ Development Scripts

```bash
# Monorepo Management
npm run install:all     # Install all dependencies
npm run build:all       # Build all services
npm run clean          # Clean all node_modules and dist folders

# Individual Service Development
npm run dev:backend    # Start backend in development
npm run dev:frontend   # Start frontend in development
npm run dev:widget     # Start widget in development

# Individual Service Production
npm run start:backend  # Start backend in production
npm run start:frontend # Start frontend in production
npm run start:widget   # Start widget in production

# Validation & Testing
npm run validate       # Validate deployment
```

## 🔐 Security Features

- **API Key Authentication**: Separate keys for admin and widget access
- **CORS Configuration**: Properly configured for cross-domain embedding
- **Rate Limiting**: Different limits for different endpoints
- **Input Sanitization**: XSS protection on all inputs
- **Environment Isolation**: No secrets in widget code

## 🎯 Key Features

- **Voice Integration**: Real-time voice conversations via Retell AI
- **Smart Booking**: AI-powered appointment scheduling
- **Calendar Sync**: Google Calendar integration
- **CRM Integration**: HubSpot contact management
- **Cross-Platform**: Works on any website via widget
- **Real-time Chat**: WebSocket-based messaging
- **Responsive Design**: Mobile-friendly interface

## 📞 Support

For deployment issues or questions:

1. Check the documentation in `/docs`
2. Review service logs in Railway dashboard
3. Run the validation script: `npm run validate`
4. Test individual endpoints manually

## 📄 License

ISC License - See LICENSE file for details

---

**Powered by Metalogics** | [Website](https://metalogics.io) | [Documentation](./docs/)
