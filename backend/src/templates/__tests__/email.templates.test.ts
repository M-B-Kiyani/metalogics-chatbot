import { Booking, BookingStatus } from "@prisma/client";
import {
  userConfirmationTemplate,
  adminNotificationTemplate,
  bookingUpdateTemplate,
  cancellationTemplate,
} from "../email.templates";

describe("Email Templates", () => {
  const mockBooking: Booking = {
    id: "test-booking-id",
    name: "John Doe",
    company: "Acme Corp",
    email: "john@acme.com",
    phone: "+1234567890",
    inquiry: "Interested in AI consulting services",
    startTime: new Date("2025-12-01T10:00:00Z"),
    duration: 60,
    status: BookingStatus.PENDING,
    createdAt: new Date("2025-11-19T10:00:00Z"),
    updatedAt: new Date("2025-11-19T10:00:00Z"),
    confirmationSent: false,
    reminderSent: false,
    calendarEventId: null,
    crmContactId: null,
    calendarSynced: false,
    crmSynced: false,
    requiresManualCalendarSync: false,
    requiresManualCrmSync: false,
  };

  describe("userConfirmationTemplate", () => {
    it("should generate email with calendar sync success message", () => {
      const bookingWithCalendar: Booking = {
        ...mockBooking,
        calendarEventId: "calendar-event-123",
        calendarSynced: true,
      };

      const result = userConfirmationTemplate(bookingWithCalendar);

      expect(result.subject).toContain("Booking Confirmation");
      expect(result.html).toContain("Calendar Event Created");
      expect(result.html).toContain("automatically added to your calendar");
      expect(result.html).toContain(bookingWithCalendar.email);
      expect(result.html).toContain("Event date and time");
      expect(result.html).toContain("Duration");
      expect(result.html).toContain("Meeting attendees");
    });

    it("should generate email with manual calendar action required", () => {
      const bookingWithManualSync: Booking = {
        ...mockBooking,
        requiresManualCalendarSync: true,
      };

      const result = userConfirmationTemplate(bookingWithManualSync);

      expect(result.subject).toContain("Booking Confirmation");
      expect(result.html).toContain("Manual Calendar Action Required");
      expect(result.html).toContain("Add to Google Calendar");
      expect(result.html).toContain("Event Details:");
      expect(result.html).toContain(bookingWithManualSync.company);
      expect(result.html).toContain(
        "other calendar applications (Outlook, Apple Calendar"
      );
    });

    it("should generate email without calendar section when no sync info", () => {
      const result = userConfirmationTemplate(mockBooking);

      expect(result.subject).toContain("Booking Confirmation");
      expect(result.html).not.toContain("Calendar Event Created");
      expect(result.html).not.toContain("Manual Calendar Action Required");
    });
  });

  describe("bookingUpdateTemplate", () => {
    it("should generate update email with calendar sync success message", () => {
      const bookingWithCalendar: Booking = {
        ...mockBooking,
        calendarEventId: "calendar-event-123",
        calendarSynced: true,
        status: BookingStatus.CONFIRMED,
      };

      const result = bookingUpdateTemplate(bookingWithCalendar);

      expect(result.subject).toContain("Booking Updated");
      expect(result.html).toContain("Calendar Event Created");
      expect(result.html).toContain("automatically added to your calendar");
      expect(result.html).toContain(bookingWithCalendar.email);
    });

    it("should generate update email with manual calendar action required", () => {
      const bookingWithManualSync: Booking = {
        ...mockBooking,
        requiresManualCalendarSync: true,
        status: BookingStatus.CONFIRMED,
      };

      const result = bookingUpdateTemplate(bookingWithManualSync);

      expect(result.subject).toContain("Booking Updated");
      expect(result.html).toContain("Manual Calendar Action Required");
      expect(result.html).toContain("Add to Google Calendar");
      expect(result.html).toContain("Event Details:");
    });
  });

  describe("cancellationTemplate", () => {
    it("should generate cancellation email with calendar event cancelled message", () => {
      const cancelledBooking: Booking = {
        ...mockBooking,
        calendarEventId: "calendar-event-123",
        calendarSynced: true,
        status: BookingStatus.CANCELLED,
      };

      const result = cancellationTemplate(cancelledBooking);

      expect(result.subject).toContain("Booking Cancelled");
      expect(result.html).toContain("Calendar Event Cancelled");
      expect(result.html).toContain(
        "automatically cancelled and removed from your calendar"
      );
      expect(result.html).toContain("cancellation notification");
      expect(result.html).toContain(cancelledBooking.email);
      expect(result.html).toContain("Cancelled Event Details:");
      expect(result.html).toContain("Original Date & Time");
    });

    it("should generate cancellation email with manual removal instructions", () => {
      const cancelledBooking: Booking = {
        ...mockBooking,
        requiresManualCalendarSync: true,
        status: BookingStatus.CANCELLED,
      };

      const result = cancellationTemplate(cancelledBooking);

      expect(result.subject).toContain("Booking Cancelled");
      expect(result.html).toContain("Manual Calendar Action Required");
      expect(result.html).toContain("manually remove this event");
      expect(result.html).toContain("Event to Remove:");
      expect(result.html).toContain(cancelledBooking.company);
    });

    it("should generate cancellation email without calendar section when no sync info", () => {
      const cancelledBooking: Booking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };

      const result = cancellationTemplate(cancelledBooking);

      expect(result.subject).toContain("Booking Cancelled");
      expect(result.html).not.toContain("Calendar Event Cancelled");
      expect(result.html).not.toContain("Manual Calendar Action Required");
    });
  });

  describe("adminNotificationTemplate", () => {
    it("should generate admin notification email", () => {
      const result = adminNotificationTemplate(mockBooking);

      expect(result.subject).toContain("New Booking:");
      expect(result.subject).toContain(mockBooking.name);
      expect(result.subject).toContain(mockBooking.company);
      expect(result.html).toContain("New Booking Received");
      expect(result.html).toContain(mockBooking.email);
      expect(result.html).toContain(mockBooking.inquiry);
    });
  });
});
