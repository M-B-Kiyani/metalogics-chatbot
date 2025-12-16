# Voice-Based Appointment Booking Guide

## Overview

The Metalogics chatbot now supports **voice-based appointment booking** through natural conversation. Users can book appointments, check availability, and manage their bookings entirely through voice commands.

## Features

### 🎤 Voice Booking Capabilities

- **Natural Conversation**: Book appointments using natural language
- **Information Collection**: AI automatically extracts name, email, phone, company, date, and time from conversation
- **Availability Checking**: Ask about available time slots for specific dates
- **Booking Confirmation**: Receive immediate confirmation with calendar integration
- **Multi-Duration Support**: Book 15, 30, 45, or 60-minute meetings

### 🔄 How It Works

1. **User Initiates**: User clicks the voice button and starts speaking
2. **AI Understands**: Gemini AI processes the voice input and detects booking intent
3. **Conversation Flow**: AI guides the user through collecting necessary information
4. **Booking Creation**: System creates the booking in the database
5. **Calendar Sync**: Automatically syncs to Google Calendar (if enabled)
6. **Confirmation**: User receives email confirmation with calendar invite

## Example Voice Conversations

### Booking an Appointment

**User**: "Hi, I'd like to book a meeting"

**AI**: "Great! I'd be happy to help you book a meeting. To get started, what's your full name?"

**User**: "My name is John Smith"

**AI**: "Perfect! What's your email address so I can send you the confirmation?"

**User**: "john.smith@example.com"

**AI**: "Thank you. Which date would you prefer for your appointment?"

**User**: "How about next Monday?"

**AI**: "Next Monday works. What time would be best for you?"

**User**: "2 PM would be great"

**AI**: "Perfect! I've booked your appointment for Monday, December 2nd at 2:00 PM. You'll receive a confirmation email at john.smith@example.com shortly with a calendar invite. Is there anything else I can help you with?"

### Checking Availability

**User**: "What times are available tomorrow?"

**AI**: "On November 29th, we have available slots at: 9:00 AM, 10:30 AM, 1:00 PM, 2:30 PM, and 4:00 PM. Would you like to book one of these times?"

**User**: "Yes, I'll take the 10:30 AM slot"

**AI**: "Great! To book your appointment at 10:30 AM tomorrow, I'll need your full name..."

### Quick Booking

**User**: "I want to schedule a 30-minute consultation for tomorrow at 3 PM. My name is Sarah Johnson, email sarah.j@company.com"

**AI**: "Perfect! Let me confirm: I'm booking a 30-minute consultation for tomorrow at 3:00 PM for Sarah Johnson at sarah.j@company.com. Is that correct?"

**User**: "Yes, that's correct"

**AI**: "Excellent! Your appointment is confirmed for tomorrow at 3:00 PM. You'll receive a confirmation email shortly with all the details and a calendar invite."

## Technical Implementation

### Architecture

```
Voice Input (Retell)
    ↓
RetellLLMService (WebSocket)
    ↓
ConversationService (Booking Logic)
    ↓
BookingService (Database & Calendar)
    ↓
Confirmation & Calendar Sync
```

### Key Components

1. **RetellLLMService**: Handles WebSocket connections for voice calls
2. **ConversationService**: Processes messages and manages booking flow
3. **BookingService**: Creates bookings and syncs with calendar/CRM
4. **GeminiService**: Provides AI-powered natural language understanding

### Booking Detection

The system automatically detects booking-related queries by looking for keywords:

- "book", "appointment", "schedule", "meeting"
- "available", "slots", "time"
- Date/time references

When detected, it switches to the ConversationService which has specialized booking logic.

## Configuration

### Required Environment Variables

```env
# Retell AI (Voice)
RETELL_API_KEY=your_retell_api_key
RETELL_AGENT_ID=your_agent_id

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Google Calendar (Optional)
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CALENDAR_ID=your_calendar_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Business Hours

Configure available booking times in `backend/src/config/index.ts`:

```typescript
businessHours: {
  monday: { start: "09:00", end: "17:00" },
  tuesday: { start: "09:00", end: "17:00" },
  wednesday: { start: "09:00", end: "17:00" },
  thursday: { start: "09:00", end: "17:00" },
  friday: { start: "09:00", end: "17:00" },
  saturday: null, // Closed
  sunday: null,   // Closed
}
```

## Frequency Limits

To prevent spam and ensure quality consultations:

| Duration | Max Bookings | Time Window |
| -------- | ------------ | ----------- |
| 15 min   | 2            | 90 minutes  |
| 30 min   | 2            | 3 hours     |
| 45 min   | 2            | 5 hours     |
| 60 min   | 2            | 12 hours    |

## Testing Voice Booking

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

### 2. Start the Frontend

```bash
npm run dev
```

### 3. Test Voice Booking

1. Open the chatbot in your browser
2. Click the microphone/voice button
3. Allow microphone permissions
4. Say: "I'd like to book an appointment"
5. Follow the AI's prompts to complete the booking

### 4. Verify Booking

- Check the database for the new booking
- Verify email confirmation was sent
- Check Google Calendar for the event (if enabled)

## Troubleshooting

### Voice Not Working

1. Check Retell API key is configured
2. Verify microphone permissions in browser
3. Check browser console for WebSocket errors
4. Review backend logs for connection issues

### Bookings Not Creating

1. Verify database connection
2. Check booking service logs
3. Ensure all required fields are collected
4. Verify no frequency limit violations

### Calendar Not Syncing

1. Check Google Calendar is enabled in config
2. Verify service account credentials
3. Check calendar permissions
4. Review calendar service logs

## Best Practices

### For Users

- Speak clearly and at a normal pace
- Provide information when asked
- Confirm details when AI repeats them back
- Use specific dates and times (e.g., "next Monday at 2 PM")

### For Developers

- Monitor WebSocket connections for stability
- Log all booking attempts for debugging
- Handle errors gracefully with user-friendly messages
- Test with various accents and speech patterns
- Implement rate limiting to prevent abuse

## Future Enhancements

- [ ] Multi-language support
- [ ] Rescheduling via voice
- [ ] Cancellation via voice
- [ ] SMS confirmations
- [ ] Voice-based availability search with filters
- [ ] Integration with more calendar providers
- [ ] Voice authentication for existing users

## Support

For issues or questions:

- Check logs in `backend/logs/`
- Review `VOICE_TROUBLESHOOTING.md`
- Contact support at support@metalogics.io
