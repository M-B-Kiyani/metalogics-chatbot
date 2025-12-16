import { BookingService } from "./booking.service";
import { geminiService } from "./gemini.service";
import { logger } from "../utils/logger";

export interface ConversationContext {
  sessionId: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  currentIntent?:
    | "booking"
    | "inquiry"
    | "availability"
    | "general"
    | "reschedule"
    | "cancel";
  bookingData?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    date?: string;
    time?: string;
    duration?: number;
  };
  rescheduleData?: {
    bookingId?: string;
    email?: string;
    newDate?: string;
    newTime?: string;
  };
  cancelData?: {
    bookingId?: string;
    email?: string;
  };
}

export class ConversationService {
  private sessions: Map<string, ConversationContext> = new Map();
  private useGemini: boolean;

  constructor(private bookingService: BookingService) {
    this.useGemini = geminiService.isAvailable();

    if (this.useGemini) {
      logger.info("ConversationService initialized with Gemini AI");
    } else {
      logger.warn(
        "ConversationService initialized with fallback responses (Gemini not available)"
      );
    }
  }

  /**
   * Process a message from either text or voice input
   */
  async processMessage(
    sessionId: string,
    message: string
  ): Promise<{ response: string; context: ConversationContext }> {
    // Get or create session context
    let context = this.sessions.get(sessionId);
    if (!context) {
      context = {
        sessionId,
        conversationHistory: [],
      };
      this.sessions.set(sessionId, context);
    }

    // Add user message to history
    context.conversationHistory.push({ role: "user", content: message });

    // Generate response using Gemini or fallback
    let response: string;

    if (this.useGemini) {
      try {
        response = await geminiService.sendMessage(sessionId, message);
      } catch (error) {
        logger.error("Gemini error, falling back to rule-based response", {
          error,
        });
        response = await this.generateResponse(context, message);
      }
    } else {
      response = await this.generateResponse(context, message);
    }

    // Add assistant response to history
    context.conversationHistory.push({
      role: "assistant",
      content: response,
    });

    logger.info("Conversation processed", {
      sessionId,
      intent: context.currentIntent,
      messageLength: message.length,
      usedGemini: this.useGemini,
    });

    return { response, context };
  }

  /**
   * Generate intelligent response based on context and message
   */
  private async generateResponse(
    context: ConversationContext,
    message: string
  ): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Detect intent - check for reschedule/cancel first as they're more specific
    if (
      lowerMessage.includes("reschedule") ||
      lowerMessage.includes("change") ||
      (lowerMessage.includes("move") && lowerMessage.includes("appointment"))
    ) {
      context.currentIntent = "reschedule";
      return this.handleRescheduleIntent(context, message);
    }

    if (
      lowerMessage.includes("cancel") ||
      (lowerMessage.includes("delete") && lowerMessage.includes("appointment"))
    ) {
      context.currentIntent = "cancel";
      return this.handleCancelIntent(context, message);
    }

    if (
      lowerMessage.includes("book") ||
      lowerMessage.includes("appointment") ||
      lowerMessage.includes("schedule") ||
      lowerMessage.includes("meeting")
    ) {
      context.currentIntent = "booking";
      return this.handleBookingIntent(context, message);
    }

    if (
      lowerMessage.includes("available") ||
      lowerMessage.includes("slots") ||
      lowerMessage.includes("time") ||
      lowerMessage.includes("when")
    ) {
      context.currentIntent = "availability";
      return this.handleAvailabilityIntent(context, message);
    }

    if (
      lowerMessage.includes("service") ||
      lowerMessage.includes("what do you do") ||
      lowerMessage.includes("about")
    ) {
      return this.handleInquiryIntent(message);
    }

    // Continue existing conversation flow
    if (context.currentIntent === "booking") {
      return this.handleBookingIntent(context, message);
    }

    if (context.currentIntent === "reschedule") {
      return this.handleRescheduleIntent(context, message);
    }

    if (context.currentIntent === "cancel") {
      return this.handleCancelIntent(context, message);
    }

    // Default general response
    return this.handleGeneralIntent(message);
  }

  /**
   * Handle booking-related conversations
   */
  private async handleBookingIntent(
    context: ConversationContext,
    message: string
  ): Promise<string> {
    if (!context.bookingData) {
      context.bookingData = {};
    }

    // Extract information from message
    this.extractBookingInfo(context.bookingData, message);

    // Check what information is still needed
    const missing = this.getMissingBookingInfo(context.bookingData);

    if (missing.length > 0) {
      return this.askForMissingInfo(missing);
    }

    // All information collected, create booking
    try {
      const { name, email, phone, company, date, time, duration } =
        context.bookingData;

      const dateTime = new Date(`${date}T${time}:00`);
      if (isNaN(dateTime.getTime())) {
        return "The date or time format seems incorrect. Could you please provide the date and time again?";
      }

      await this.bookingService.createBooking({
        name: name!,
        email: email!,
        phone: phone || "",
        company: company || "",
        inquiry: "Booked via assistant",
        timeSlot: {
          startTime: dateTime,
          duration: (duration || 30) as 15 | 30 | 45 | 60,
        },
      });

      // Clear booking data
      context.bookingData = {};
      context.currentIntent = undefined;

      return `Perfect! I've booked your appointment for ${date} at ${time}. You'll receive a confirmation email at ${email} shortly with calendar invite. Is there anything else I can help you with?`;
    } catch (error) {
      logger.error("Booking creation error", { error });

      // Check if it's a conflict error
      if (error instanceof Error && error.message.includes("already booked")) {
        return "I'm sorry, but that time slot is no longer available. It may have just been booked by someone else. Would you like to check other available times?";
      }

      return "I encountered an issue while booking your appointment. Could you please try again or contact us directly?";
    }
  }

  /**
   * Handle availability check conversations
   */
  private async handleAvailabilityIntent(
    _context: ConversationContext,
    message: string
  ): Promise<string> {
    // Extract date from message
    const date = this.extractDate(message);

    if (!date) {
      return "Which date would you like to check for available time slots? You can say something like 'tomorrow', 'next Monday', or a specific date.";
    }

    try {
      const targetDate = new Date(date);
      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);

      const slots = await this.bookingService.getAvailableTimeSlots(
        targetDate,
        endDate,
        30
      );

      if (slots.length === 0) {
        return `Unfortunately, there are no available slots on ${date}. Would you like to check another date?`;
      }

      const slotTimes = slots.slice(0, 5).map((slot) => {
        const time = new Date(slot.startTime);
        return time.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      });

      const slotsText = slotTimes.join(", ");
      const moreSlots =
        slots.length > 5 ? ` and ${slots.length - 5} more slots` : "";

      return `On ${date}, we have available slots at: ${slotsText}${moreSlots}. Would you like to book one of these times?`;
    } catch (error) {
      logger.error("Availability check error", { error });
      return "I had trouble checking available slots. Could you please try again?";
    }
  }

  /**
   * Handle general inquiry about services
   */
  private handleInquiryIntent(_message: string): string {
    return `Metalogics.io specializes in AI-powered solutions and digital transformation. We offer:

• AI Integration & Consulting
• Custom Software Development
• Cloud Solutions & Architecture
• Data Analytics & Business Intelligence
• Digital Transformation Strategy

Would you like to book a consultation to discuss your specific needs, or do you have any questions about our services?`;
  }

  /**
   * Handle general conversation
   */
  private handleGeneralIntent(_message: string): string {
    return `I'm here to help you with information about Metalogics.io, check available appointment times, or book a consultation. What would you like to know?`;
  }

  /**
   * Handle reschedule-related conversations
   */
  private async handleRescheduleIntent(
    context: ConversationContext,
    message: string
  ): Promise<string> {
    if (!context.rescheduleData) {
      context.rescheduleData = {};
    }

    // Extract email if provided
    const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      context.rescheduleData.email = emailMatch[0];
    }

    // Extract new date
    const newDate = this.extractDate(message);
    if (newDate) {
      context.rescheduleData.newDate = newDate;
    }

    // Extract new time
    const timeMatch = message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] || "00";
      const meridiem = timeMatch[3]?.toLowerCase();

      if (meridiem === "pm" && hour < 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;

      context.rescheduleData.newTime = `${hour
        .toString()
        .padStart(2, "0")}:${minute}`;
    }

    // If we don't have email yet, ask for it
    if (!context.rescheduleData.email) {
      return "I can help you reschedule your appointment. What's the email address you used when booking?";
    }

    // Find existing bookings for this email
    try {
      const bookings = await this.bookingService.getBookings({
        email: context.rescheduleData.email,
        status: "CONFIRMED",
        dateFrom: new Date(),
        limit: 10,
      });

      if (bookings.data.length === 0) {
        context.rescheduleData = {};
        context.currentIntent = undefined;
        return `I couldn't find any upcoming appointments for ${context.rescheduleData.email}. Would you like to book a new appointment instead?`;
      }

      // If we have multiple bookings, list them
      if (bookings.data.length > 1 && !context.rescheduleData.bookingId) {
        const bookingList = bookings.data
          .map((b, idx) => {
            const date = new Date(b.startTime);
            return `${
              idx + 1
            }. ${date.toLocaleDateString()} at ${date.toLocaleTimeString(
              "en-US",
              { hour: "numeric", minute: "2-digit", hour12: true }
            )}`;
          })
          .join("\n");

        return `I found ${bookings.data.length} upcoming appointments:\n${bookingList}\n\nWhich one would you like to reschedule? You can say the number or the date.`;
      }

      // Use the first (or only) booking
      const booking = bookings.data[0];
      context.rescheduleData.bookingId = booking.id;

      // Check if we have new date and time
      if (!context.rescheduleData.newDate) {
        const currentDate = new Date(booking.startTime);
        return `I found your appointment on ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString(
          "en-US",
          { hour: "numeric", minute: "2-digit", hour12: true }
        )}. What new date would you like to reschedule it to?`;
      }

      if (!context.rescheduleData.newTime) {
        return `What time would you like for ${context.rescheduleData.newDate}?`;
      }

      // We have all information, perform the reschedule
      const newDateTime = new Date(
        `${context.rescheduleData.newDate}T${context.rescheduleData.newTime}:00`
      );

      if (isNaN(newDateTime.getTime())) {
        return "The date or time format seems incorrect. Could you please provide the date and time again?";
      }

      await this.bookingService.updateBooking(booking.id, {
        timeSlot: {
          startTime: newDateTime,
          duration: booking.duration as 15 | 30 | 45 | 60,
        },
      });

      // Clear reschedule data
      const email = context.rescheduleData.email;
      const newDate = context.rescheduleData.newDate;
      const newTime = context.rescheduleData.newTime;
      context.rescheduleData = {};
      context.currentIntent = undefined;

      return `Perfect! I've rescheduled your appointment to ${newDate} at ${newTime}. You'll receive an updated confirmation email at ${email}. Is there anything else I can help you with?`;
    } catch (error) {
      logger.error("Reschedule error", { error });

      // Check if it's a conflict error
      if (error instanceof Error && error.message.includes("already booked")) {
        return "I'm sorry, but that time slot is no longer available. Would you like to choose a different time?";
      }

      return "I encountered an issue while rescheduling your appointment. Could you please try again or contact us directly?";
    }
  }

  /**
   * Handle cancel-related conversations
   */
  private async handleCancelIntent(
    context: ConversationContext,
    message: string
  ): Promise<string> {
    if (!context.cancelData) {
      context.cancelData = {};
    }

    // Extract email if provided
    const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      context.cancelData.email = emailMatch[0];
    }

    // If we don't have email yet, ask for it
    if (!context.cancelData.email) {
      return "I can help you cancel your appointment. What's the email address you used when booking?";
    }

    // Find existing bookings for this email
    try {
      const bookings = await this.bookingService.getBookings({
        email: context.cancelData.email,
        status: "CONFIRMED",
        dateFrom: new Date(),
        limit: 10,
      });

      if (bookings.data.length === 0) {
        context.cancelData = {};
        context.currentIntent = undefined;
        return `I couldn't find any upcoming appointments for ${context.cancelData.email}. Is there anything else I can help you with?`;
      }

      // If we have multiple bookings, list them
      if (bookings.data.length > 1 && !context.cancelData.bookingId) {
        const bookingList = bookings.data
          .map((b, idx) => {
            const date = new Date(b.startTime);
            return `${
              idx + 1
            }. ${date.toLocaleDateString()} at ${date.toLocaleTimeString(
              "en-US",
              { hour: "numeric", minute: "2-digit", hour12: true }
            )}`;
          })
          .join("\n");

        return `I found ${bookings.data.length} upcoming appointments:\n${bookingList}\n\nWhich one would you like to cancel? You can say the number or the date.`;
      }

      // Use the first (or only) booking
      const booking = bookings.data[0];
      context.cancelData.bookingId = booking.id;

      // Confirm cancellation
      const lowerMessage = message.toLowerCase();
      if (
        !lowerMessage.includes("yes") &&
        !lowerMessage.includes("confirm") &&
        !lowerMessage.includes("sure")
      ) {
        const bookingDate = new Date(booking.startTime);
        return `Are you sure you want to cancel your appointment on ${bookingDate.toLocaleDateString()} at ${bookingDate.toLocaleTimeString(
          "en-US",
          { hour: "numeric", minute: "2-digit", hour12: true }
        )}? Please say 'yes' to confirm.`;
      }

      // Perform the cancellation
      await this.bookingService.cancelBooking(booking.id);

      // Clear cancel data
      const email = context.cancelData.email;
      context.cancelData = {};
      context.currentIntent = undefined;

      return `Your appointment has been cancelled successfully. You'll receive a cancellation confirmation email at ${email}. If you'd like to book a new appointment in the future, just let me know!`;
    } catch (error) {
      logger.error("Cancel error", { error });
      return "I encountered an issue while cancelling your appointment. Could you please try again or contact us directly?";
    }
  }

  /**
   * Extract booking information from natural language
   */
  private extractBookingInfo(
    bookingData: NonNullable<ConversationContext["bookingData"]>,
    message: string
  ): void {
    // Extract email
    const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      bookingData.email = emailMatch[0];
    }

    // Extract phone
    const phoneMatch = message.match(
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
    );
    if (phoneMatch) {
      bookingData.phone = phoneMatch[0];
    }

    // Extract name (simple heuristic)
    if (
      message.toLowerCase().includes("my name is") ||
      message.toLowerCase().includes("i'm") ||
      message.toLowerCase().includes("i am")
    ) {
      const nameMatch = message.match(
        /(?:my name is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
      );
      if (nameMatch) {
        bookingData.name = nameMatch[1];
      }
    }

    // Extract date
    const date = this.extractDate(message);
    if (date) {
      bookingData.date = date;
    }

    // Extract time
    const timeMatch = message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] || "00";
      const meridiem = timeMatch[3]?.toLowerCase();

      if (meridiem === "pm" && hour < 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;

      bookingData.time = `${hour.toString().padStart(2, "0")}:${minute}`;
    }
  }

  /**
   * Extract date from natural language
   */
  private extractDate(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    const today = new Date();

    if (lowerMessage.includes("today")) {
      return today.toISOString().split("T")[0];
    }

    if (lowerMessage.includes("tomorrow")) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    }

    // Check for specific date format (YYYY-MM-DD or MM/DD/YYYY)
    const dateMatch = message.match(
      /(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{4})/
    );
    if (dateMatch) {
      return dateMatch[0];
    }

    // Check for day of week
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    for (let i = 0; i < days.length; i++) {
      if (lowerMessage.includes(days[i])) {
        const targetDay = i;
        const currentDay = today.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;

        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysToAdd);
        return targetDate.toISOString().split("T")[0];
      }
    }

    return null;
  }

  /**
   * Get list of missing booking information
   */
  private getMissingBookingInfo(
    bookingData: NonNullable<ConversationContext["bookingData"]>
  ): string[] {
    const missing: string[] = [];

    if (!bookingData.name) missing.push("name");
    if (!bookingData.email) missing.push("email");
    if (!bookingData.date) missing.push("date");
    if (!bookingData.time) missing.push("time");

    return missing;
  }

  /**
   * Generate question for missing information
   */
  private askForMissingInfo(missing: string[]): string {
    if (missing.includes("name")) {
      return "Great! To book your appointment, I'll need your full name. What's your name?";
    }

    if (missing.includes("email")) {
      return "Perfect! What's your email address so I can send you the confirmation?";
    }

    if (missing.includes("date")) {
      return "Which date would you prefer for your appointment?";
    }

    if (missing.includes("time")) {
      return "What time works best for you?";
    }

    return "I need a bit more information to complete your booking.";
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);

    // Also clear Gemini session if using it
    if (this.useGemini) {
      geminiService.clearSession(sessionId);
    }
  }
}
