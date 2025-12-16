# Appointment Management - Quick Start Guide

## 🚀 What's New

Your chatbot can now:

- ✅ **Reschedule** appointments via voice or chat
- ✅ **Cancel** appointments via voice or chat
- ✅ **Prevent double-booking** - no overlapping slots
- ✅ **Free up slots** when appointments are cancelled

## 📝 How to Use

### Reschedule an Appointment

**Via Chat:**

```
You: "I need to reschedule my appointment"
Bot: "What's the email address you used when booking?"
You: "john@example.com"
Bot: "I found your appointment on Dec 1st at 2:00 PM. What new date would you like?"
You: "December 5th at 3 PM"
Bot: "Perfect! Rescheduled to Dec 5th at 3:00 PM. Confirmation email sent."
```

**Via Voice:**
Just say: "Reschedule my appointment" and follow the prompts.

### Cancel an Appointment

**Via Chat:**

```
You: "Cancel my appointment"
Bot: "What's the email address you used when booking?"
You: "jane@example.com"
Bot: "Are you sure you want to cancel your appointment on Dec 3rd at 10:00 AM?"
You: "Yes"
Bot: "Cancelled successfully. Confirmation email sent."
```

**Via Voice:**
Just say: "Cancel my appointment" and follow the prompts.

### Book Without Conflicts

The system automatically prevents double-booking:

```
Scenario: Someone books 2:00 PM - 3:00 PM

✅ Available: 1:00 PM - 2:00 PM (ends before)
✅ Available: 3:00 PM - 4:00 PM (starts after)
❌ Unavailable: 2:30 PM - 3:30 PM (overlaps)
❌ Unavailable: 1:30 PM - 2:30 PM (overlaps)
```

## 🎯 Key Features

### Smart Conflict Detection

- Checks database for existing bookings
- Checks Google Calendar (if enabled)
- Prevents any time slot overlap
- Suggests alternative times if unavailable

### Automatic Slot Management

- Booked slots are blocked for others
- Rescheduled slots free up the original time
- Cancelled slots become immediately available
- No manual intervention needed

### Multiple Appointments

If a user has multiple appointments:

```
Bot: "I found 2 upcoming appointments:
1. December 1st at 2:00 PM
2. December 5th at 10:00 AM

Which one would you like to reschedule?"
```

## 🔧 No Setup Required

All features work automatically with your existing:

- ✅ Database
- ✅ Google Calendar integration
- ✅ Email notifications
- ✅ Voice and chat interfaces

## 📱 Voice Commands

### Reschedule

- "I need to reschedule my appointment"
- "Can I change my appointment time?"
- "Move my meeting to a different day"

### Cancel

- "I want to cancel my appointment"
- "Cancel my booking"
- "Delete my appointment"

## ⚠️ Important Notes

### Email Required

Users must provide the email they used for booking to:

- Find their appointment
- Prevent unauthorized changes
- Send confirmations

### Confirmation Required

Cancellations require explicit "yes" to:

- Prevent accidental cancellations
- Ensure user intent
- Provide clear confirmation

### Availability Checked

Before confirming reschedules, the system:

- Validates the new time slot
- Checks for conflicts
- Suggests alternatives if unavailable

## 🧪 Testing

### Test Reschedule

1. Book an appointment
2. Say "Reschedule my appointment"
3. Provide email and new date/time
4. Verify confirmation

### Test Cancel

1. Book an appointment
2. Say "Cancel my appointment"
3. Provide email and confirm
4. Verify the slot is available again

### Test Overlap Prevention

1. Book: Tomorrow at 2 PM, 60 minutes
2. Try to book: Tomorrow at 2:30 PM, 30 minutes
3. Should get "slot already booked" message
4. Try to book: Tomorrow at 3 PM, 30 minutes
5. Should succeed (no overlap)

## 📚 More Information

- **Full Documentation**: `docs/APPOINTMENT_MANAGEMENT.md`
- **Voice Commands**: `docs/VOICE_COMMANDS_REFERENCE.md`
- **Implementation Details**: `APPOINTMENT_MANAGEMENT_SUMMARY.md`

## 💡 Tips

### For Best Results

- Speak clearly when using voice
- Provide complete date/time information
- Confirm details when asked
- Use the email from your original booking

### Common Patterns

```
✅ "Reschedule to December 5th at 3 PM"
✅ "Cancel my appointment for tomorrow"
✅ "Change my meeting to next Monday"
✅ "Move it to 2:30 PM instead"
```

## 🎉 That's It!

Your appointment management system is ready to use. Users can now:

- Book appointments
- Reschedule when needed
- Cancel if necessary
- Never worry about double-booking

All through natural voice or text conversations! 🚀
