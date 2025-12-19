# Voice + Calendar + CRM Integration - Quick Start Guide

## 🚀 What's New?

Your voice assistant can now:

- ✅ Check Google Calendar availability in real-time
- ✅ Book meetings and create calendar events
- ✅ Reschedule appointments with calendar updates
- ✅ Cancel appointments and delete calendar events
- ✅ Sync all contacts to HubSpot CRM automatically

## ⚡ Quick Test (5 minutes)

### 1. Verify Configuration

Check that these are set in `backend/.env`:

```bash
# Calendar
GOOGLE_CALENDAR_ENABLED=true

# CRM
HUBSPOT_ENABLED=true

# Voice
RETELL_ENABLED=true
GEMINI_API_KEY=AIzaSy...
```

### 2. Start the Server

```bash
cd backend
npm run dev
```

Look for these success messages:

```
✅ Google Calendar initialized successfully
✅ HubSpot CRM initialized successfully
Voice integration enabled with calendar and CRM access
```

### 3. Run Test Script

```bash
cd backend
npx ts-node src/scripts/test-voice-calendar-crm.ts
```

This will test:

- Calendar availability checking
- Booking with calendar event creation
- HubSpot contact synchronization
- Rescheduling with calendar updates
- Cancellation with calendar deletion

### 4. Test Voice Functions via API

**Check Availability:**

```bash
curl -X POST http://localhost:3000/api/retell/function \
  -H "Content-Type: application/json" \
  -d '{
    "name": "check_availability",
    "args": {
      "date": "2024-12-10",
      "duration": 30
    }
  }'
```

**Book Appointment:**

```bash
curl -X POST http://localhost:3000/api/retell/function \
  -H "Content-Type: application/json" \
  -d '{
    "name": "book_appointment",
    "args": {
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "date": "2024-12-10",
      "time": "14:00",
      "duration": 30
    }
  }'
```

Expected response:

```json
{
  "success": true,
  "bookingId": "...",
  "calendarEventId": "...",
  "crmContactId": "...",
  "message": "Appointment booked successfully..."
}
```

### 5. Verify in Google Calendar

1. Open Google Calendar
2. Look for the calendar: `your_calendar_id@group.calendar.google.com`
3. You should see the test appointment

### 6. Verify in HubSpot

1. Log into HubSpot
2. Go to Contacts
3. Search for the test email
4. You should see the contact with booking details

## 🎤 Voice Conversation Examples

### Example 1: Quick Booking

```
User: "Book a meeting for tomorrow at 2 PM"
AI: "I'd be happy to help! What's your name?"
User: "Sarah Johnson"
AI: "And your email address?"
User: "sarah@company.com"
AI: "Perfect! I'm booking a 30-minute meeting for tomorrow at 2:00 PM. Is that correct?"
User: "Yes"
AI: "Done! Your appointment is confirmed. You'll receive a confirmation email at sarah@company.com with a calendar invite."
```

### Example 2: Check Availability First

```
User: "What times are available next Monday?"
AI: "Next Monday I have slots available at 9:00 AM, 10:00 AM, 2:00 PM, 3:00 PM, and 4:00 PM. Which time works best for you?"
User: "10 AM please"
AI: "Great choice! What's your name?"
[continues with booking flow]
```

### Example 3: Reschedule

```
User: "I need to reschedule my appointment"
AI: "I can help with that. What's your email address?"
User: "sarah@company.com"
AI: "I found your appointment on December 10th at 2:00 PM. What new date would you like?"
User: "December 12th at 3 PM"
AI: "Let me check availability... Yes, 3:00 PM on December 12th is available. Should I move your appointment?"
User: "Yes"
AI: "Done! Your appointment has been rescheduled to December 12th at 3:00 PM. You'll receive an updated confirmation email."
```

## 📋 Available Voice Functions

| Function                    | What It Does                                   | Example                              |
| --------------------------- | ---------------------------------------------- | ------------------------------------ |
| `check_availability`        | Queries Google Calendar for open slots         | "What times are available tomorrow?" |
| `book_appointment`          | Creates booking + calendar event + CRM contact | "Book a meeting for 2 PM"            |
| `reschedule_appointment`    | Updates booking + calendar + CRM               | "Reschedule my appointment"          |
| `cancel_appointment`        | Deletes booking + calendar + CRM               | "Cancel my appointment"              |
| `get_upcoming_appointments` | Lists user's appointments                      | "What appointments do I have?"       |

## 🔍 Monitoring

### Watch Logs in Real-Time

```bash
tail -f backend/logs/app.log
```

### Key Log Messages to Look For

```
Voice integration enabled with calendar and CRM access
Checking calendar availability
Booking appointment via voice
Contact synced to HubSpot
Calendar event created
```

### Check Health Status

```bash
curl http://localhost:3000/api/health
```

Should return:

```json
{
  "status": "healthy",
  "database": "connected",
  "calendar": "connected",
  "crm": "connected"
}
```

## 🚨 Troubleshooting

### Calendar Not Working?

**Check 1:** Is it enabled?

```bash
grep GOOGLE_CALENDAR_ENABLED backend/.env
```

Should show: `GOOGLE_CALENDAR_ENABLED=true`

**Check 2:** Service account file exists?

```bash
ls backend/metalogics-chatbot-0cbe5759fdfc.json
```

**Check 3:** Check logs

```bash
grep "Google Calendar" backend/logs/app.log
```

### CRM Not Syncing?

**Check 1:** Is it enabled?

```bash
grep HUBSPOT_ENABLED backend/.env
```

Should show: `HUBSPOT_ENABLED=true`

**Check 2:** Valid access token?

```bash
grep HUBSPOT_ACCESS_TOKEN backend/.env
```

Should start with `pat-na`

**Check 3:** Check logs

```bash
grep "HubSpot" backend/logs/app.log
```

### Voice Not Responding?

**Check 1:** Retell WebSocket connected?

```bash
grep "WebSocket" backend/logs/app.log
```

**Check 2:** Gemini API working?

```bash
grep "Gemini" backend/logs/app.log
```

**Check 3:** Test function endpoint

```bash
curl http://localhost:3000/api/retell/function \
  -H "Content-Type: application/json" \
  -d '{"name":"get_company_info","args":{}}'
```

## 📚 Full Documentation

- **Complete Guide**: `docs/VOICE_CALENDAR_CRM_INTEGRATION.md`
- **Upgrade Summary**: `VOICE_UPGRADE_SUMMARY.md`
- **Architecture**: See diagrams in documentation

## ✅ Success Checklist

- [ ] Server starts without errors
- [ ] Google Calendar shows "initialized successfully"
- [ ] HubSpot shows "initialized successfully"
- [ ] Test script passes all tests
- [ ] API function calls return success
- [ ] Calendar events appear in Google Calendar
- [ ] Contacts appear in HubSpot
- [ ] Voice conversations work end-to-end

## 🎉 You're Ready!

Your voice assistant now has full calendar and CRM integration. Users can:

- Check availability through voice
- Book meetings that create calendar events
- Reschedule with automatic calendar updates
- Cancel with automatic calendar deletion
- All contacts automatically sync to HubSpot

## 💡 Pro Tips

1. **Test with Real Voice**: Use Retell AI web interface to test actual voice
2. **Monitor First Calls**: Watch logs during first few voice interactions
3. **Check Calendar**: Verify events appear correctly in Google Calendar
4. **Verify CRM**: Check HubSpot to see contact synchronization
5. **User Feedback**: Ask early users about their voice experience

## 🆘 Need Help?

1. Check logs: `backend/logs/app.log`
2. Review documentation: `docs/VOICE_CALENDAR_CRM_INTEGRATION.md`
3. Test individual components with test scripts
4. Verify environment variables are set correctly
5. Ensure all API keys are valid and have proper permissions

## 🚀 Next Steps

1. **Production Deployment**: Update production environment variables
2. **User Training**: Share voice command examples with users
3. **Analytics**: Monitor booking completion rates
4. **Optimization**: Refine prompts based on real conversations
5. **Scaling**: Monitor API rate limits and performance

---

**Ready to go live?** Your voice integration is fully operational! 🎊
