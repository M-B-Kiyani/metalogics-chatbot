# 🎤 Voice-Based Appointment Booking - NOW ENABLED!

## What's New?

Your Metalogics AI Assistant now supports **voice-based appointment booking**! Users can book appointments, check availability, and manage their schedule entirely through natural voice conversations.

## Quick Start

### 1. Ensure Services Are Running

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in another terminal)
npm run dev
```

### 2. Test Voice Booking

1. Open the chatbot in your browser
2. Click the microphone/voice button
3. Say: **"I'd like to book an appointment"**
4. Follow the AI's prompts to complete your booking

### 3. Example Voice Commands

- "Book a meeting for tomorrow at 2 PM"
- "What times are available next Monday?"
- "Schedule a 30-minute consultation"
- "I need to book an appointment with John Smith at john@example.com"

## How It Works

```
User speaks → Retell AI transcribes → Gemini AI understands intent
    ↓
AI detects booking request → ConversationService handles flow
    ↓
Collects: name, email, date, time → Creates booking
    ↓
Syncs to Google Calendar → Sends email confirmation
```

## Features

✅ **Natural Language**: Book using everyday language
✅ **Smart Extraction**: AI automatically extracts booking details
✅ **Availability Check**: Ask about open time slots
✅ **Calendar Sync**: Automatic Google Calendar integration
✅ **Email Confirmation**: Instant confirmation with calendar invite
✅ **Multi-Duration**: Support for 15, 30, 45, and 60-minute meetings

## What Changed?

### Backend Updates

1. **RetellLLMService** (`backend/src/services/retell-llm.service.ts`)

   - Added ConversationService integration
   - Detects booking-related queries
   - Routes to specialized booking logic

2. **Server** (`backend/src/server.ts`)

   - Links ConversationService to voice system
   - Enables voice booking on startup

3. **Gemini Prompt** (`backend/src/services/gemini.service.ts`)
   - Enhanced with voice conversation best practices
   - Optimized for appointment booking flow

### No Frontend Changes Required

The existing voice interface already supports this feature - no updates needed!

## Testing

### Automated Test

```bash
cd backend
npm run test:voice-booking
```

This simulates a complete voice booking conversation.

### Manual Test

1. Start the application
2. Click the voice button
3. Try these scenarios:

**Scenario 1: Step-by-step booking**

- "I want to book an appointment"
- (AI asks for name) "John Smith"
- (AI asks for email) "john@example.com"
- (AI asks for date) "Tomorrow"
- (AI asks for time) "2 PM"

**Scenario 2: Quick booking**

- "Book a meeting for December 5th at 3 PM, my name is Sarah Johnson, email sarah@company.com"

**Scenario 3: Check availability**

- "What times are available tomorrow?"
- (AI shows slots) "I'll take the 10:30 AM slot"

## Configuration

### Required Environment Variables

Already configured if you have:

- ✅ Retell AI integration
- ✅ Gemini AI integration
- ✅ Database connection
- ✅ Email service (optional)
- ✅ Google Calendar (optional)

### Business Hours

Bookings are available during configured business hours:

- Monday - Friday: 9:00 AM - 5:00 PM
- Saturday - Sunday: Closed

Configure in `backend/src/config/index.ts`

## Frequency Limits

To ensure quality consultations:

| Duration | Max Bookings | Time Window |
| -------- | ------------ | ----------- |
| 15 min   | 2            | 90 minutes  |
| 30 min   | 2            | 3 hours     |
| 45 min   | 2            | 5 hours     |
| 60 min   | 2            | 12 hours    |

## Documentation

📚 **Comprehensive Guide**: [docs/VOICE_BOOKING_GUIDE.md](docs/VOICE_BOOKING_GUIDE.md)

Includes:

- Detailed conversation examples
- Technical architecture
- Troubleshooting guide
- Best practices
- Future enhancements

## Troubleshooting

### Voice button not working?

- Check Retell API key in `backend/.env`
- Verify microphone permissions in browser
- Check browser console for errors

### Bookings not creating?

- Verify database connection
- Check backend logs: `backend/logs/app.log`
- Ensure all required fields are collected

### Calendar not syncing?

- Check Google Calendar is enabled
- Verify service account credentials
- Review calendar service logs

## What's Next?

Future enhancements planned:

- Multi-language support
- Voice-based rescheduling
- Voice-based cancellation
- SMS confirmations
- Advanced availability filters

## Support

Need help?

- 📖 Read [docs/VOICE_BOOKING_GUIDE.md](docs/VOICE_BOOKING_GUIDE.md)
- 🔍 Check [VOICE_TROUBLESHOOTING.md](VOICE_TROUBLESHOOTING.md)
- 📧 Contact support@metalogics.io

---

**Status**: ✅ Voice booking is LIVE and ready to use!

**Last Updated**: November 28, 2024
