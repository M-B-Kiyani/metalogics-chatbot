# 🔐 Production API Keys & Security Configuration

**Generated:** December 19, 2025  
**Status:** Ready for Production

## 🔑 Secure API Keys

### Primary Backend API Key

```
API_KEY=7eaeb10d330789a82e0883d89393cf57fcbc4771935a4b389f1f1ec4f924f2a5
```

- **Usage:** Backend authentication, admin operations
- **Security:** 64-character hex, cryptographically secure
- **Access:** Server-side only, never expose to frontend

### Widget Public API Key

```
WIDGET_API_KEY=12cc3551cb0bf1665f8ca67060bb9e23c57ebe1e5c7d3bce
```

- **Usage:** Widget authentication, public embeds
- **Security:** 48-character hex, safe for frontend
- **Access:** Can be embedded in websites

### Session Secret

```
SESSION_SECRET=d17fd81f257a6b2ac171dfd4c54b4f1d7e4a6e253a734a02ec2839bd8d6d7d8e
```

- **Usage:** Session encryption, JWT signing
- **Security:** 64-character hex, cryptographically secure
- **Access:** Server-side only

## 🚀 Quick Setup Guide

### 1. Backend Setup

```bash
cd backend
# Environment file is already created with secure keys
# Just add your external service keys:
```

**Required External Keys to Add:**

- `GEMINI_API_KEY` - Get from Google AI Studio
- `DATABASE_URL` - Your PostgreSQL connection string
- `SMTP_USER` & `SMTP_PASSWORD` - Your email credentials

**Optional Service Keys:**

- `RETELL_API_KEY` & `RETELL_AGENT_ID` - For voice features
- `HUBSPOT_ACCESS_TOKEN` - For CRM integration
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - For calendar integration

### 2. Frontend Setup

```bash
# Root directory environment is ready
# Just add your Gemini API key
```

### 3. Widget Setup

```bash
cd widget
# Widget environment is ready with public key
# Add Retell keys if using voice features
```

## 🔒 Security Features

### API Key Security

- ✅ **64-bit entropy** - Cryptographically secure random generation
- ✅ **Separate keys** - Different keys for different access levels
- ✅ **Public/Private separation** - Widget key safe for frontend
- ✅ **No hardcoding** - All keys in environment variables

### Authentication Flow

1. **Backend API** uses `API_KEY` for admin operations
2. **Widget** uses `WIDGET_API_KEY` for public access
3. **Sessions** encrypted with `SESSION_SECRET`
4. **Rate limiting** prevents abuse

### CORS Configuration

- Configurable origins for security
- Proper headers for API access
- Credentials handling for authenticated requests

## 📋 Environment File Locations

```
├── .env                    # Frontend environment
├── backend/.env           # Backend environment
├── widget/.env           # Widget environment
└── PRODUCTION_API_KEYS.md # This reference (keep secure)
```

## 🚨 Security Checklist

### ✅ Completed

- [x] Secure API keys generated
- [x] Environment files created
- [x] Public/private key separation
- [x] Rate limiting configured
- [x] CORS security setup

### 📝 TODO - Add Your Service Keys

- [ ] Add Gemini API key to `GEMINI_API_KEY`
- [ ] Add database URL to `DATABASE_URL`
- [ ] Add email credentials to `SMTP_USER` & `SMTP_PASSWORD`
- [ ] Add Retell keys (optional) for voice features
- [ ] Add HubSpot token (optional) for CRM
- [ ] Add Google Calendar credentials (optional)

## 🔧 How to Get External API Keys

### Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Add to `GEMINI_API_KEY` in both `.env` and `backend/.env`

### Retell AI (Voice Features)

1. Sign up at [Retell AI](https://www.retellai.com/)
2. Create agent and get API key
3. Add `RETELL_API_KEY` and `RETELL_AGENT_ID`

### Database (PostgreSQL)

1. Use Railway, Supabase, or your preferred provider
2. Get connection string
3. Add to `DATABASE_URL`

### Email (SMTP)

1. Use Gmail App Password or SendGrid
2. Add credentials to `SMTP_USER` and `SMTP_PASSWORD`

## 🌐 Production Deployment

### Railway Deployment

```bash
# Backend
cd backend
railway login
railway link
railway up

# Frontend
cd ..
railway login
railway link
railway up
```

### Environment Variables in Railway

Add these in Railway dashboard:

- All variables from `backend/.env`
- Make sure `API_KEY` and `WIDGET_API_KEY` match

### Widget Deployment

```bash
cd widget
npm run build
# Upload dist/ folder to your CDN/hosting
```

## 🔍 Testing Your Setup

### Test Backend API

```bash
curl -X GET "https://your-backend.com/api/health" \
  -H "x-api-key: 7eaeb10d330789a82e0883d89393cf57fcbc4771935a4b389f1f1ec4f924f2a5"
```

### Test Widget API

```bash
curl -X POST "https://your-backend.com/api/widget/chat" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 12cc3551cb0bf1665f8ca67060bb9e23c57ebe1e5c7d3bce" \
  -d '{"message": "Hello", "sessionId": "test123"}'
```

## 🚨 Important Security Notes

1. **Never commit .env files** - They're in .gitignore
2. **Rotate keys regularly** - Generate new keys periodically
3. **Monitor usage** - Watch for unusual API activity
4. **Use HTTPS only** - All production traffic must be encrypted
5. **Backup keys securely** - Store in password manager

## 📞 Support

If you need help with API key setup:

- Check the logs for authentication errors
- Verify environment variables are loaded
- Test with curl commands above
- Contact support if issues persist

---

**🔐 Keep this file secure and never commit to version control!**
