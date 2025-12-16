import { BookingService } from "./booking.service";
import { CalendarService } from "./calendar.service";
import { CRMService } from "./crm.service";
import { logger } from "../utils/logger";
import { format, parseISO, addDays, startOfDay, endOfDay } from "date-fns";

/**
 * VoiceFunctionsService provides callable functions for voice assistant
 * Enables calendar access, booking management, and CRM updates through voice
 */
export class VoiceFunctionsService {
  constructor(
    private bookingService: BookingService,
    private calendarService: CalendarService,
    private crmService: CRMService
  ) {
    logger.info("VoiceFunctionsService initialized");
  }

  /**
   * Check calendar availability for a specific date
   * Returns available time slots
   */
  async checkAvailability(params: {
    date: string;
    duration?: number;
  }): Promise<{
    success: boolean;
    date: string;
    availableSlots: Array<{ time: string; startTime: Date }>;
    message: string;
  }> {
    try {
      const { date, duration = 30 } = params;

      logger.info("Checking calendar availability", { date, duration });

      // Parse the date
      const targetDate = parseISO(date);
      const startDate = startOfDay(targetDate);
      const endDate = endOfDay(targetDate);

      // Get available slots from calendar
      const slots = await this.calendarService.getAvailableSlots(
        startDate,
        endDate,
        duration
      );

      // Format slots for voice response
      const availableSlots = slots.map((slot) => ({
        time: format(slot.startTime, "h:mm a"),
        startTime: slot.startTime,
      }));

      const message =
        availableSlots.length > 0
          ? `Found ${availableSlots.length} available slots on ${format(
              targetDate,
              "MMMM do"
            )}`
          : `No available slots on ${format(targetDate, "MMMM do")}`;

      logger.info("Availability check completed", {
        date,
        slotsFound: availableSlots.length,
      });

      return {
        success: true,
        date: format(targetDate, "yyyy-MM-dd"),
        availableSlots,
        message,
      };
    } catch (error) {
      logger.error("Failed to check availability", { error, params });
      return {
        success: false,
        date: params.date,
        availableSlots: [],
        message: "Failed to check calendar availability",
      };
    }
  }

  /**
   * Book an appointment and create calendar event
   * Also syncs contact to HubSpot CRM
   */
  async bookAppointment(params: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    date: string;
    time: string;
    duration?: number;
    inquiry?: string;
  }): Promise<{
    success: boolean;
    bookingId?: string;
    message: string;
    calendarEventId?: string;
    crmContactId?: string;
  }> {
    try {
      const {
        name,
        email,
        phone,
        company,
        date,
        time,
        duration = 30,
        inquiry = "Voice booking",
      } = params;

      logger.info("Booking appointment via voice", {
        email,
        date,
        time,
        duration,
      });

      // Parse date and time
      const startTime = parseISO(`${date}T${time}`);

      // Create booking (this also creates calendar event)
      const booking = await this.bookingService.createBooking({
        name,
        email,
        phone: phone || "",
        company: company || "Not specified",
        inquiry,
        timeSlot: {
          startTime,
          duration: duration as 15 | 30 | 45 | 60,
        },
      });

      // Sync to HubSpot CRM
      let crmContactId: string | undefined;
      try {
        crmContactId = await this.crmService.syncBookingToContact(booking);
        logger.info("Contact synced to HubSpot", { crmContactId, email });
      } catch (crmError) {
        logger.warn("CRM sync failed but booking succeeded", {
          error: crmError,
          bookingId: booking.id,
        });
        // Don't fail the booking if CRM sync fails
      }

      const message = `Successfully booked appointment for ${format(
        startTime,
        "MMMM do 'at' h:mm a"
      )}. Confirmation email sent to ${email}.`;

      logger.info("Appointment booked successfully", {
        bookingId: booking.id,
        calendarEventId: booking.calendarEventId,
        crmContactId,
      });

      return {
        success: true,
        bookingId: booking.id,
        message,
        calendarEventId: booking.calendarEventId || undefined,
        crmContactId,
      };
    } catch (error) {
      logger.error("Failed to book appointment", { error, params });

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        message: `Failed to book appointment: ${errorMessage}`,
      };
    }
  }

  /**
   * Reschedule an existing appointment
   * Updates calendar event and CRM record
   */
  async rescheduleAppointment(params: {
    email: string;
    bookingId?: string;
    newDate: string;
    newTime: string;
  }): Promise<{
    success: boolean;
    bookingId?: string;
    message: string;
  }> {
    try {
      const { email, bookingId, newDate, newTime } = params;

      logger.info("Rescheduling appointment via voice", {
        email,
        bookingId,
        newDate,
        newTime,
      });

      // If no bookingId provided, find the most recent confirmed booking
      let targetBookingId = bookingId;
      if (!targetBookingId) {
        const bookings = await this.bookingService.getBookings({
          email,
          status: "CONFIRMED",
          dateFrom: new Date(),
          limit: 1,
        });

        if (bookings.data.length === 0) {
          return {
            success: false,
            message: `No upcoming appointments found for ${email}`,
          };
        }

        targetBookingId = bookings.data[0].id;
      }

      // Parse new date and time
      const newStartTime = parseISO(`${newDate}T${newTime}`);

      // Get the existing booking to preserve duration
      const existingBooking = await this.bookingService.getBookingById(
        targetBookingId
      );

      // Update booking (this also updates calendar event)
      await this.bookingService.updateBooking(targetBookingId, {
        timeSlot: {
          startTime: newStartTime,
          duration: existingBooking.duration as 15 | 30 | 45 | 60,
        },
      });

      // Update CRM status
      try {
        await this.crmService.updateContactBookingStatus(
          email,
          targetBookingId,
          "CONFIRMED"
        );
      } catch (crmError) {
        logger.warn("CRM update failed but reschedule succeeded", {
          error: crmError,
          bookingId: targetBookingId,
        });
      }

      const message = `Successfully rescheduled appointment to ${format(
        newStartTime,
        "MMMM do 'at' h:mm a"
      )}. Updated confirmation sent to ${email}.`;

      logger.info("Appointment rescheduled successfully", {
        bookingId: targetBookingId,
      });

      return {
        success: true,
        bookingId: targetBookingId,
        message,
      };
    } catch (error) {
      logger.error("Failed to reschedule appointment", { error, params });

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        message: `Failed to reschedule appointment: ${errorMessage}`,
      };
    }
  }

  /**
   * Cancel an appointment
   * Deletes calendar event and updates CRM
   */
  async cancelAppointment(params: {
    email: string;
    bookingId?: string;
  }): Promise<{
    success: boolean;
    bookingId?: string;
    message: string;
  }> {
    try {
      const { email, bookingId } = params;

      logger.info("Cancelling appointment via voice", { email, bookingId });

      // If no bookingId provided, find the most recent confirmed booking
      let targetBookingId = bookingId;
      if (!targetBookingId) {
        const bookings = await this.bookingService.getBookings({
          email,
          status: "CONFIRMED",
          dateFrom: new Date(),
          limit: 1,
        });

        if (bookings.data.length === 0) {
          return {
            success: false,
            message: `No upcoming appointments found for ${email}`,
          };
        }

        targetBookingId = bookings.data[0].id;
      }

      // Cancel booking (this also deletes calendar event)
      await this.bookingService.cancelBooking(targetBookingId);

      // Update CRM status
      try {
        await this.crmService.updateContactBookingStatus(
          email,
          targetBookingId,
          "CANCELLED"
        );
      } catch (crmError) {
        logger.warn("CRM update failed but cancellation succeeded", {
          error: crmError,
          bookingId: targetBookingId,
        });
      }

      const message = `Successfully cancelled appointment. Cancellation confirmation sent to ${email}.`;

      logger.info("Appointment cancelled successfully", {
        bookingId: targetBookingId,
      });

      return {
        success: true,
        bookingId: targetBookingId,
        message,
      };
    } catch (error) {
      logger.error("Failed to cancel appointment", { error, params });

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        message: `Failed to cancel appointment: ${errorMessage}`,
      };
    }
  }

  /**
   * Get upcoming appointments for a contact
   */
  async getUpcomingAppointments(params: { email: string }): Promise<{
    success: boolean;
    appointments: Array<{
      id: string;
      date: string;
      time: string;
      duration: number;
      status: string;
    }>;
    message: string;
  }> {
    try {
      const { email } = params;

      logger.info("Getting upcoming appointments", { email });

      const bookings = await this.bookingService.getBookings({
        email,
        status: "CONFIRMED",
        dateFrom: new Date(),
        limit: 10,
      });

      const appointments = bookings.data.map((booking) => ({
        id: booking.id,
        date: format(booking.startTime, "yyyy-MM-dd"),
        time: format(booking.startTime, "HH:mm"),
        duration: booking.duration,
        status: booking.status,
      }));

      const message =
        appointments.length > 0
          ? `Found ${appointments.length} upcoming appointment${
              appointments.length > 1 ? "s" : ""
            }`
          : "No upcoming appointments found";

      return {
        success: true,
        appointments,
        message,
      };
    } catch (error) {
      logger.error("Failed to get appointments", { error, params });

      return {
        success: false,
        appointments: [],
        message: "Failed to retrieve appointments",
      };
    }
  }

  /**
   * Create or update a contact in HubSpot CRM
   */
  async updateCRMContact(params: {
    email: string;
    name?: string;
    phone?: string;
    company?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    contactId?: string;
    message: string;
  }> {
    try {
      const { email, name, phone, company, notes } = params;

      logger.info("Updating CRM contact", { email });

      // Parse name if provided
      let firstname: string | undefined;
      let lastname: string | undefined;
      if (name) {
        const nameParts = name.trim().split(/\s+/);
        firstname = nameParts[0];
        lastname = nameParts.slice(1).join(" ") || undefined;
      }

      // Prepare custom properties
      const customProperties: Record<string, string> = {};
      if (notes) {
        customProperties.notes = notes;
      }

      // Upsert contact in HubSpot
      const contact = await this.crmService["hubspotClient"].upsertContact({
        email,
        firstname,
        lastname,
        company,
        phone,
        customProperties,
      });

      const message = `Successfully updated contact in CRM`;

      logger.info("CRM contact updated", { contactId: contact.id, email });

      return {
        success: true,
        contactId: contact.id,
        message,
      };
    } catch (error) {
      logger.error("Failed to update CRM contact", { error, params });

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        message: `Failed to update CRM contact: ${errorMessage}`,
      };
    }
  }

  /**
   * Get available slots for the next N days
   */
  async getAvailableSlotsNextDays(params: {
    days?: number;
    duration?: number;
  }): Promise<{
    success: boolean;
    slots: Array<{ date: string; time: string; startTime: Date }>;
    message: string;
  }> {
    try {
      const { days = 7, duration = 30 } = params;

      logger.info("Getting available slots for next days", { days, duration });

      const startDate = startOfDay(new Date());
      const endDate = endOfDay(addDays(startDate, days));

      const slots = await this.calendarService.getAvailableSlots(
        startDate,
        endDate,
        duration
      );

      const formattedSlots = slots.slice(0, 20).map((slot) => ({
        date: format(slot.startTime, "yyyy-MM-dd"),
        time: format(slot.startTime, "h:mm a"),
        startTime: slot.startTime,
      }));

      const message = `Found ${slots.length} available slots in the next ${days} days`;

      return {
        success: true,
        slots: formattedSlots,
        message,
      };
    } catch (error) {
      logger.error("Failed to get available slots", { error, params });

      return {
        success: false,
        slots: [],
        message: "Failed to retrieve available slots",
      };
    }
  }
}
