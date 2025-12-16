# Voice Integration with Calendar & CRM

## Overview

The Metalogics AI Assistant provides natural voice conversations with full calendar and CRM integration. Users can check availability, book meetings, reschedule appointments, and manage their calendar entirely through voice.

## Quick Links

- **Quick Start**: [`../VOICE_CALENDAR_CRM_QUICKSTART.md`](../VOICE_CALENDAR_CRM_QUICKSTART.md)
- **Full Documentation**: [`VOICE_CALENDAR_CRM_INTEGRATION.md`](VOICE_CALENDAR_CRM_INTEGRATION.md)
- **Upgrade Summary**: [`../VOICE_UPGRADE_SUMMARY.md`](../VOICE_UPGRADE_SUMMARY.md)
- **Completion Report**: [`../VOICE_INTEGRATION_UPGRADE_COMPLETE.md`](../VOICE_INTEGRATION_UPGRADE_COMPLETE.md)

## Features

### 🗓️ Calendar Integration

- Real-time availability checking
- Automatic event creation/updates/deletion
- Business hours enforcement
- Conflict prevention

### 🎯 CRM Integration

- Automatic contact synchronization
- Booking history tracking
- Status updates
- Lead management

### 🎤 Voice Capabilities

- Natural language understanding
- Multi-turn conversations
- Context awareness
- Error recovery

## Architecture

```
Voice (Retell AI) → AI (Gemini) → Services → Calendar/CRM/Database
```

## Voice Commands

| User Says                            | System Does                                                   |
| ------------------------------------ | ------------------------------------------------------------- |
| "What times are available tomorrow?" | Queries Google Calendar, returns open slots                   |
| "Book a meeting for 2 PM"            | Collects info, creates booking + calendar event + CRM contact |
| "Reschedule my appointment"          | Finds booking, checks availability, updates calendar + CRM    |
| "Cancel my appointment"              | Finds booking, deletes calendar event, updates CRM            |

## Configuration

Required environment variables:

```bash
# Calendar
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=...
GOOGLE_CALENDAR_ID=...

# CRM
HUBSPOT_ENABLED=true
HUBSPOT_ACCESS_TOKEN=...

# Voice
RETELL_API_KEY=...
RETELL_AGENT_ID=...
GEMINI_API_KEY=...
```

## Testing

### Run Integration Test

```bash
cd backend
npx ts-node src/scripts/test-voice-calendar-crm.ts
```

### Test API Functions

```bash
curl -X POST http://localhost:3000/api/retell/function \
  -H "Content-Type: application/json" \
  -d '{"name":"check_availability","args":{"date":"2024-12-10"}}'
```

## Monitoring

### Watch Logs

```bash
tail -f backend/logs/app.log
```

### Health Check

```bash
curl http://localhost:3000/api/health
```

## Troubleshooting

### Calendar Issues

- Verify `GOOGLE_CALENDAR_ENABLED=true`
- Check service account credentials
- Ensure calendar is shared with service account

### CRM Issues

- Verify `HUBSPOT_ENABLED=true`
- Check access token validity
- Review HubSpot API permissions

### Voice Issues

- Check Retell WebSocket connection
- Verify Gemini API key
- Review conversation logs

## Documentation Structure

```
docs/
├── VOICE_INTEGRATION_README.md (this file)
├── VOICE_CALENDAR_CRM_INTEGRATION.md (full documentation)
├── VOICE_COMMANDS_REFERENCE.md
├── VOICE_BOOKING_GUIDE.md
└── INTEGRATION_SUMMARY.md

Root/
├── VOICE_CALENDAR_CRM_QUICKSTART.md (5-min quick start)
├── VOICE_UPGRADE_SUMMARY.md (developer summary)
└── VOICE_INTEGRATION_UPGRADE_COMPLETE.md (completion report)
```

## Support

For detailed information, see:

- [Full Documentation](VOICE_CALENDAR_CRM_INTEGRATION.md)
- [Quick Start Guide](../VOICE_CALENDAR_CRM_QUICKSTART.md)
- [Troubleshooting Guide](VOICE_CALENDAR_CRM_INTEGRATION.md#-troubleshooting)

## Success Metrics

Track these to measure success:

- Booking completion rate via voice
- Calendar sync success rate
- CRM sync success rate
- User satisfaction scores
- Average conversation length

## Next Steps

1. Run test script to verify setup
2. Test with actual voice calls
3. Monitor logs during interactions
4. Gather user feedback
5. Optimize based on usage patterns

---

**Voice integration is production-ready!** 🚀
