# Booking Modal Implementation

This update adds a booking modal to the chatbot widget, facilitating user-driven appointment scheduling directly from the chat interface.

## Features

1.  **Booking Modal (`BookingModal.tsx`)**:
    *   **Date Selection**: Users can choose a date and booking duration (15, 30, 45, 60 mins).
    *   **Slot Availability**: Fetches real-time available slots from the backend (`/api/bookings/available-slots`), ensuring busy slots are not shown.
    *   **User Details**: Collects Name, Email, Company, and Inquiry for lead generation.
    *   **Submission**: Creates a booking via `/api/bookings`, which triggers:
        *   Calendar synchronization (Google Calendar).
        *   CRM contact creation/update (HubSpot).
        *   Email confirmation notifications.

2.  **Unified Chat Widget Update (`UnifiedChatWidget.tsx`)**:
    *   Added a "Book Appointment" button (calendar icon) in the chat header.
    *   Integrated the `BookingModal` component to overlay the chat when triggered.

## How it Works

1.  **Trigger**: The user clicks the calendar icon in the chat widget header.
2.  **Selection**: 
    *   The modal opens showing the current date.
    *   The user selects a desired date and duration.
    *   The widget queries the backend for available slots.
3.  **Booking**:
    *   The user selects a time slot.
    *   The user fills in their contact details.
    *   On confirmation, the booking is sent to the backend.
4.  **Completion**:
    *   A success message is displayed.
    *   The backend handles the rest (Calendar, CRM, Email).

## Backend Considerations

*   The backend's `BookingService` and `CRMService` are already configured to handle the logic for conflict detection, Google Calendar syncing, and HubSpot integration.
*   The `available-slots` endpoint ensures that only free slots are presented to the user.

## Files Modified/Created

*   `widget/src/components/BookingModal.tsx` (New)
*   `widget/src/components/UnifiedChatWidget.tsx` (Modified)
