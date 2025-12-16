/**
 * Example usage of BookingService
 * This file demonstrates how to initialize and use the BookingService
 */

import { DatabaseClient } from "../config/database.client";
import { BookingRepository } from "../repositories/booking.repository";
import { NotificationService } from "./notification.service";
import { CalendarService } from "./calendar.service";
import { CRMService } from "./crm.service";
import { BookingService, CreateBookingDTO } from "./booking.service";
import { RetryService } from "./retry.service";
import { CalendarClient } from "../integrations/calendar.client";
import { HubSpotClient } from "../integrations/hubspot.client";
import { EmailClient } from "../integrations/email.client";

// Example: Initialize the service
async function initializeBookingService(): Promise<BookingService> {
  // Get database client singleton instance
  const databaseClient = DatabaseClient.getInstance();
  await databaseClient.connect();

  // Initialize retry service
  const retryService = new RetryService();

  // Initialize repository
  const bookingRepository = new BookingRepository(databaseClient, retryService);

  // Initialize email client and notification service
  const emailClient = new EmailClient();
  const notificationService = new NotificationService(emailClient);

  // Initialize calendar client and service
  const calendarClient = new CalendarClient();
  await calendarClient.initializeFromConfig();
  const calendarService = new CalendarService(calendarClient);

  // Initialize HubSpot client and CRM service
  const hubspotClient = new HubSpotClient();
  await hubspotClient.initializeFromConfig();
  const crmService = new CRMService(hubspotClient);

  // Get Prisma client for transaction support
  const prisma = databaseClient.getClient();

  // Initialize booking service
  const bookingService = new BookingService(
    bookingRepository,
    notificationService,
    calendarService,
    crmService,
    prisma
  );

  return bookingService;
}

// Example: Create a booking
async function createBookingExample() {
  const bookingService = await initializeBookingService();

  const bookingData: CreateBookingDTO = {
    name: "John Doe",
    company: "Acme Corp",
    email: "john.doe@acme.com",
    phone: "+1-555-0123",
    inquiry: "I would like to discuss AI integration for our platform",
    timeSlot: {
      startTime: new Date("2024-12-01T14:00:00Z"),
      duration: 30,
    },
  };

  try {
    const booking = await bookingService.createBooking(bookingData);
    console.log("Booking created:", booking.id);
  } catch (error) {
    console.error("Failed to create booking:", error);
  }
}

// Example: Get bookings with filters
async function getBookingsExample() {
  const bookingService = await initializeBookingService();

  try {
    const result = await bookingService.getBookings({
      page: 1,
      limit: 10,
      status: "PENDING",
      dateFrom: new Date("2024-12-01"),
      dateTo: new Date("2024-12-31"),
    });

    console.log(`Found ${result.pagination.total} bookings`);
    console.log(
      `Page ${result.pagination.page} of ${result.pagination.totalPages}`
    );
    result.data.forEach((booking) => {
      console.log(
        `- ${booking.name} (${booking.email}) - ${booking.startTime}`
      );
    });
  } catch (error) {
    console.error("Failed to get bookings:", error);
  }
}

// Example: Get a single booking
async function getBookingByIdExample() {
  const bookingService = await initializeBookingService();

  try {
    const booking = await bookingService.getBookingById("booking-id-here");
    console.log("Booking found:", booking);
  } catch (error) {
    console.error("Booking not found:", error);
  }
}

// Example: Update a booking
async function updateBookingExample() {
  const bookingService = await initializeBookingService();

  try {
    const updatedBooking = await bookingService.updateBooking(
      "booking-id-here",
      {
        inquiry: "Updated inquiry text",
        timeSlot: {
          startTime: new Date("2024-12-01T15:00:00Z"),
          duration: 45,
        },
      }
    );
    console.log("Booking updated:", updatedBooking.id);
  } catch (error) {
    console.error("Failed to update booking:", error);
  }
}

// Example: Update booking status
async function updateBookingStatusExample() {
  const bookingService = await initializeBookingService();

  try {
    const updatedBooking = await bookingService.updateBookingStatus(
      "booking-id-here",
      "CONFIRMED"
    );
    console.log("Booking status updated:", updatedBooking.status);
  } catch (error) {
    console.error("Failed to update booking status:", error);
  }
}

// Example: Cancel a booking
async function cancelBookingExample() {
  const bookingService = await initializeBookingService();

  try {
    const cancelledBooking = await bookingService.cancelBooking(
      "booking-id-here"
    );
    console.log("Booking cancelled:", cancelledBooking.id);
  } catch (error) {
    console.error("Failed to cancel booking:", error);
  }
}

// Export examples
export {
  initializeBookingService,
  createBookingExample,
  getBookingsExample,
  getBookingByIdExample,
  updateBookingExample,
  updateBookingStatusExample,
  cancelBookingExample,
};
