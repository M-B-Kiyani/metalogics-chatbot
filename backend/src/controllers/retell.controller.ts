import { Request, Response } from "express";
import { ConversationService } from "../services/conversation.service";
import { RetellService } from "../services/retell.service";
import { BookingService } from "../services/booking.service";
import { logger } from "../utils/logger";

export class RetellController {
  private retellService: RetellService;

  constructor(
    private conversationService: ConversationService,
    private bookingService: BookingService
  ) {
    this.retellService = new RetellService();
  }

  /**
   * Register a new call with Retell and get access token
   */
  registerCall = async (req: Request, res: Response): Promise<void> => {
    try {
      const { agentId, sessionId } = req.body;

      if (!agentId) {
        res.status(400).json({
          success: false,
          error: "Agent ID is required",
        });
        return;
      }

      logger.info("Registering Retell call", { agentId, sessionId });

      // Register call with Retell SDK
      const response = await this.retellService.createWebCall(agentId, {
        sessionId: sessionId || `retell-${Date.now()}`,
      });

      res.json({
        success: true,
        accessToken: response.access_token,
        callId: response.call_id,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error("Retell call registration error", {
        error: errorMessage,
        stack: errorStack,
        agentId: req.body.agentId,
      });

      res.status(500).json({
        success: false,
        error: "Failed to register call",
        details: errorMessage, // Include details for debugging
      });
    }
  };

  /**
   * Handle Retell webhooks
   */
  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const event = req.body;

      logger.info("Retell webhook received", {
        event: event.event,
        callId: event.call?.call_id,
      });

      // Handle different webhook events
      switch (event.event) {
        case "call_started":
          logger.info("Call started", { callId: event.call.call_id });
          break;

        case "call_ended":
          logger.info("Call ended", {
            callId: event.call.call_id,
            duration: event.call.duration,
          });
          break;

        case "call_analyzed":
          logger.info("Call analyzed", {
            callId: event.call.call_id,
            transcript: event.call.transcript,
          });
          break;

        default:
          logger.info("Unknown webhook event", { event: event.event });
      }

      res.json({ received: true });
    } catch (error) {
      logger.error("Retell webhook error", {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        error: "Failed to process webhook",
      });
    }
  };

  /**
   * Handle custom LLM requests from Retell (HTTP POST fallback)
   * Note: WebSocket is preferred for real-time streaming responses
   */
  handleLLM = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transcript, call_id, response_id } = req.body;

      if (!transcript || transcript.length === 0) {
        res.status(400).json({
          error: "Transcript is required",
        });
        return;
      }

      // Get the last user message
      const lastMessage = transcript[transcript.length - 1];

      if (lastMessage.role !== "user") {
        res.status(400).json({
          error: "Last message must be from user",
        });
        return;
      }

      logger.info("Retell LLM HTTP request", {
        callId: call_id,
        message: lastMessage.content,
      });

      // Use conversation service to process the message
      // This will automatically use Gemini if available
      const sessionId = call_id || `retell-http-${Date.now()}`;
      const result = await this.conversationService.processMessage(
        sessionId,
        lastMessage.content
      );

      // Return response in Retell format
      res.json({
        response: result.response,
        response_id: response_id || Date.now(),
        content: result.response,
        content_complete: true,
        end_call: false,
      });
    } catch (error) {
      logger.error("Retell LLM HTTP error", {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        error: "Failed to process LLM request",
        response: "Sorry, I encountered an error. Please try again.",
        content: "Sorry, I encountered an error. Please try again.",
        content_complete: true,
        end_call: false,
      });
    }
  };

  /**
   * Execute a function called by Retell Agent
   * Enhanced with calendar and CRM integration
   */
  executeFunction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, args } = req.body;

      logger.info("Executing Retell function", { name, args });

      let result: any = { message: "Function executed successfully" };

      switch (name) {
        case "check_availability":
          // Check calendar availability for a specific date
          if (!args.date) throw new Error("Date is required");
          const targetDate = new Date(args.date);
          const endDate = new Date(targetDate);
          endDate.setHours(23, 59, 59, 999);
          const slots = await this.bookingService.getAvailableTimeSlots(
            targetDate,
            endDate,
            args.duration || 30
          );
          result = {
            success: true,
            date: args.date,
            available_slots: slots.map((s) => ({
              time: s.startTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
              startTime: s.startTime.toISOString(),
            })),
            count: slots.length,
            message: `Found ${slots.length} available slots`,
          };
          break;

        case "book_appointment":
          // Book appointment with calendar and CRM sync
          if (!args.name || !args.email || !args.date || !args.time) {
            throw new Error("Name, email, date, and time are required");
          }
          const booking = await this.bookingService.createBooking({
            name: args.name,
            email: args.email,
            phone: args.phone || "",
            company: args.company || "Not specified",
            inquiry: args.inquiry || "Voice Booking",
            timeSlot: {
              startTime: new Date(`${args.date}T${args.time}:00`),
              duration: (args.duration || 30) as 15 | 30 | 45 | 60,
            },
          });
          result = {
            success: true,
            bookingId: booking.id,
            calendarEventId: booking.calendarEventId,
            message: `Appointment booked successfully for ${args.date} at ${args.time}`,
          };
          break;

        case "reschedule_appointment":
          // Reschedule with calendar update
          if (!args.email || !args.newDate || !args.newTime) {
            throw new Error("Email, new date, and new time are required");
          }
          // Find most recent confirmed booking for this email
          const bookingsToReschedule = await this.bookingService.getBookings({
            email: args.email,
            status: "CONFIRMED",
            dateFrom: new Date(),
            limit: 1,
          });
          if (bookingsToReschedule.data.length === 0) {
            result = {
              success: false,
              message: `No upcoming appointments found for ${args.email}`,
            };
          } else {
            const bookingToUpdate = bookingsToReschedule.data[0];
            await this.bookingService.updateBooking(bookingToUpdate.id, {
              timeSlot: {
                startTime: new Date(`${args.newDate}T${args.newTime}:00`),
                duration: bookingToUpdate.duration as 15 | 30 | 45 | 60,
              },
            });
            result = {
              success: true,
              bookingId: bookingToUpdate.id,
              message: `Appointment rescheduled to ${args.newDate} at ${args.newTime}`,
            };
          }
          break;

        case "cancel_appointment":
          // Cancel with calendar deletion
          if (!args.email) {
            throw new Error("Email is required");
          }
          // Find most recent confirmed booking for this email
          const bookingsToCancel = await this.bookingService.getBookings({
            email: args.email,
            status: "CONFIRMED",
            dateFrom: new Date(),
            limit: 1,
          });
          if (bookingsToCancel.data.length === 0) {
            result = {
              success: false,
              message: `No upcoming appointments found for ${args.email}`,
            };
          } else {
            const bookingToCancel = bookingsToCancel.data[0];
            await this.bookingService.cancelBooking(bookingToCancel.id);
            result = {
              success: true,
              bookingId: bookingToCancel.id,
              message: "Appointment cancelled successfully",
            };
          }
          break;

        case "get_upcoming_appointments":
          // Get list of upcoming appointments
          if (!args.email) {
            throw new Error("Email is required");
          }
          const upcomingBookings = await this.bookingService.getBookings({
            email: args.email,
            status: "CONFIRMED",
            dateFrom: new Date(),
            limit: 10,
          });
          result = {
            success: true,
            appointments: upcomingBookings.data.map((b) => ({
              id: b.id,
              date: b.startTime.toISOString().split("T")[0],
              time: b.startTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
              duration: b.duration,
            })),
            count: upcomingBookings.data.length,
            message: `Found ${upcomingBookings.data.length} upcoming appointments`,
          };
          break;

        case "get_company_info":
          result = {
            success: true,
            info: "Metalogics.io specializes in AI-powered solutions, custom software development, and digital transformation strategy.",
            services: [
              "AI Integration & Consulting",
              "Custom Software Development",
              "Cloud Solutions & Architecture",
              "Data Analytics & Business Intelligence",
              "Digital Transformation Strategy",
            ],
          };
          break;

        default:
          throw new Error(`Unknown function: ${name}`);
      }

      res.json(result);
    } catch (error) {
      logger.error("Retell function execution error", {
        error: error instanceof Error ? error.message : String(error),
        function: req.body.name,
      });

      res.status(500).json({
        success: false,
        error: "Failed to execute function",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  /**
   * Health check for Retell integration
   */
  healthCheck = async (_req: Request, res: Response): Promise<void> => {
    res.json({
      status: "ok",
      service: "retell-integration",
      timestamp: new Date().toISOString(),
    });
  };
}
