# Appointment Management - Reschedule & Cancel

## Overview

The chatbot now supports comprehensive appointment management including:

- **Booking** new appointments
- **Rescheduling** existing appointments
- **Cancelling** appointments
- **Preventing double-booking** and slot overlaps

## Features

### 1. Appointment Rescheduling

Users can reschedule their appointments via voice or chat by providing:

- Email address used for booking
- New preferred date and time

**Example Conversations:**

**Voice/Chat:**

```
User: "I need to reschedule my appointment"
Bot: "I can help you reschedule your appointment. What's the email address you used when booking?"
User: "john@example.com"
Bot: "I found your appointment on December 1st at 2:00 PM. What new date would you like to reschedule it to?"
User: "December 5th at 3 PM"
Bot: "Perfect! I've rescheduled your appointment to December 5th at 3:00 PM. You'll receive an updated confirmation email at john@example.com."
```

### 2. Appointment Cancellation

Users can cancel their appointments by:

- Providing their email address
- Confirming the cancellation

**Example Conversations:**

**Voice/Chat:**

```
User: "I want to cancel my appointment"
Bot: "I can help you cancel your appointment. What's the email address you used when booking?"
User: "jane@example.com"
Bot: "Are you sure you want to cancel your appointment on December 3rd at 10:00 AM? Please say 'yes' to confirm."
User: "Yes"
Bot: "Your appointment has been cancelled successfully. You'll receive a cancellation confirmation email at jane@example.com."
```

### 3. Slot Availability Protection

The system ensures no double-booking or overlapping appointments:

#### How It Works:

1. **Database-Level Conflict Checking**: Before creating or rescheduling, the system checks for overlapping bookings
2. **Calendar Integration**: If Google Calendar is enabled, it also checks calendar availability
3. **Real-Time Validation**: Slots are validated at the moment of booking to prevent race conditions
4. **Cancelled Slots**: Cancelled appointments free up their time slots immediately

#### Overlap Detection:

A conflict occurs when:

- A new booking starts before an existing booking ends, AND
- The new booking ends after an existing booking starts

**Example:**

```
Existing Booking: 2:00 PM - 3:00 PM (60 min)
New Request: 2:30 PM - 3:00 PM (30 min)
Result: CONFLICT - Slot unavailable
```

```
Existing Booking: 2:00 PM - 3:00 PM (60 min)
New Request: 3:00 PM - 3:30 PM (30 min)
Result: SUCCESS - No overlap
```

### 4. Multiple Appointments Handling

If a user has multiple upcoming appointments:

```
User: "I want to reschedule my appointment"
Bot: "I found 2 upcoming appointments:
1. December 1st at 2:00 PM
2. December 5th at 10:00 AM

Which one would you like to reschedule? You can say the number or the date."
```

## Technical Implementation

### Conversation Service Updates

**New Intent Types:**

- `reschedule` - For rescheduling appointments
- `cancel` - For cancelling appointments

**New Context Data:**

```typescript
rescheduleData?: {
  bookingId?: string;
  email?: string;
  newDate?: string;
  newTime?: string;
}

cancelData?: {
  bookingId?: string;
  email?: string;
}
```

### Intent Detection

The system detects intents from keywords:

**Reschedule:**

- "reschedule"
- "change"
- "move" + "appointment"

**Cancel:**

- "cancel"
- "delete" + "appointment"

### Booking Service Integration

**Reschedule Flow:**

1. Find existing booking by email
2. Validate new time slot availability
3. Update booking with new time
4. Update calendar event (if enabled)
5. Send confirmation email

**Cancel Flow:**

1. Find existing booking by email
2. Confirm cancellation intent
3. Update booking status to CANCELLED
4. Cancel calendar event (if enabled)
5. Send cancellation email

### Conflict Prevention

**checkTimeSlotConflict()** in BookingRepository:

```typescript
// Checks for overlapping bookings
// Excludes cancelled bookings
// Optionally excludes a specific booking (for updates)
async checkTimeSlotConflict(timeSlot: TimeSlot): Promise<boolean>
```

**Overlap Logic:**

```typescript
// Booking overlaps if:
// 1. It starts before the requested slot ends AND
// 2. It ends after the requested slot starts
const hasConflict = conflictingBookings.some((booking) => {
  const bookingEndTime = new Date(
    booking.startTime.getTime() + booking.duration * 60 * 1000
  );
  return bookingEndTime > startTime;
});
```

## Error Handling

### Slot Already Booked

```
User: "Book me for tomorrow at 2 PM"
Bot: "I'm sorry, but that time slot is no longer available. It may have just been booked by someone else. Would you like to check other available times?"
```

### No Appointments Found

```
User: "Cancel my appointment"
Bot: "I couldn't find any upcoming appointments for your email. Is there anything else I can help you with?"
```

### Invalid Date/Time

```
User: "Reschedule to xyz"
Bot: "The date or time format seems incorrect. Could you please provide the date and time again?"
```

## Voice Integration

The Retell LLM service automatically routes reschedule and cancel requests to the ConversationService:

**Detected Keywords:**

- book, appointment, schedule, meeting
- available, slots, time
- **reschedule, change, move**
- **cancel, delete**

## Testing

### Test Reschedule Flow:

```bash
# Via chat or voice
1. Book an appointment
2. Say "I want to reschedule my appointment"
3. Provide email
4. Provide new date and time
5. Verify confirmation
```

### Test Cancel Flow:

```bash
# Via chat or voice
1. Book an appointment
2. Say "Cancel my appointment"
3. Provide email
4. Confirm cancellation
5. Verify the slot is now available
```

### Test Overlap Prevention:

```bash
1. Book appointment: Dec 1, 2:00 PM, 60 min
2. Try to book: Dec 1, 2:30 PM, 30 min
3. Should receive conflict error
4. Try to book: Dec 1, 3:00 PM, 30 min
5. Should succeed (no overlap)
```

## Database Schema

The Booking model includes:

```prisma
model Booking {
  id                         String        @id @default(uuid())
  name                       String
  email                      String
  startTime                  DateTime
  duration                   Int
  status                     BookingStatus @default(PENDING)
  // ... other fields
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED    // Frees up the time slot
  COMPLETED
  NO_SHOW
}
```

## API Endpoints

### Update Booking (Reschedule)

```
PATCH /api/bookings/:id
Body: {
  timeSlot: {
    startTime: "2024-12-05T15:00:00Z",
    duration: 30
  }
}
```

### Cancel Booking

```
PATCH /api/bookings/:id/cancel
```

## Configuration

No additional configuration needed. The features work with existing:

- Google Calendar integration (if enabled)
- Email notifications
- CRM sync (if enabled)

## Best Practices

1. **Always verify email** before modifying appointments
2. **Confirm cancellations** explicitly to prevent accidental cancellations
3. **Check availability** before confirming reschedules
4. **Provide alternatives** when requested slots are unavailable
5. **Send confirmations** for all changes

## Future Enhancements

Potential improvements:

- Bulk cancellation for multiple appointments
- Recurring appointment management
- Waitlist for fully booked slots
- SMS notifications for changes
- Self-service portal for appointment management
