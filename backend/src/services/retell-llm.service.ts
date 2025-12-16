import { WebSocket } from "ws";
import { geminiService } from "./gemini.service";
import { logger } from "../utils/logger";
import { ConversationService } from "./conversation.service";
import { VoiceFunctionsService } from "./voice-functions.service";

/**
 * Retell Custom LLM WebSocket Service
 * Handles real-time LLM responses for Retell voice calls using Gemini
 * Supports appointment booking, calendar access, and CRM updates through voice
 */
export class RetellLLMService {
  private conversationService: ConversationService | null = null;
  // VoiceFunctionsService available for direct function calls if needed
  // Currently using ConversationService which internally uses booking/calendar/CRM
  // @ts-ignore - Reserved for future direct function calling
  private voiceFunctionsService: VoiceFunctionsService | null = null;
  private activeBookingSessions: Set<string> = new Set();

  /**
   * Set the conversation service for handling bookings
   */
  setConversationService(conversationService: ConversationService): void {
    this.conversationService = conversationService;
    logger.info(
      "ConversationService linked to RetellLLMService for voice booking support"
    );
  }

  /**
   * Set the voice functions service for calendar and CRM access
   */
  setVoiceFunctionsService(voiceFunctionsService: VoiceFunctionsService): void {
    this.voiceFunctionsService = voiceFunctionsService;
    logger.info(
      "VoiceFunctionsService linked to RetellLLMService for calendar and CRM access"
    );
  }

  /**
   * Handle WebSocket connection for custom LLM
   */
  handleConnection(ws: WebSocket, callId: string): void {
    logger.info("Retell LLM WebSocket connected", { callId });

    let sessionId = callId;
    let conversationHistory: Array<{ role: string; content: string }> = [];

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        logger.debug("Retell LLM message received", {
          callId,
          messageType: message.interaction_type,
        });

        // Handle different message types
        switch (message.interaction_type) {
          case "call_details":
            // Initial call setup
            sessionId = message.call?.call_id || callId;
            logger.info("Call details received", {
              callId: sessionId,
              agentId: message.call?.agent_id,
            });

            // Send initial response configuration
            this.sendResponse(ws, {
              response_type: "config",
              config: {
                auto_reconnect: true,
                call_details: true,
              },
            });
            break;

          case "ping_pong":
            // Heartbeat - respond with pong
            this.sendResponse(ws, {
              response_type: "ping_pong",
              timestamp: message.timestamp,
            });
            break;

          case "update_only":
            // Transcript update without response needed
            if (message.transcript && Array.isArray(message.transcript)) {
              conversationHistory = message.transcript;
              logger.debug("Transcript updated", {
                callId: sessionId,
                messageCount: conversationHistory.length,
              });
            }
            break;

          case "response_required":
            // User spoke, need to generate response
            await this.handleResponseRequired(
              ws,
              message,
              sessionId,
              conversationHistory
            );
            break;

          case "reminder_required":
            // Silence detected, send a gentle prompt
            this.sendResponse(ws, {
              response_type: "response",
              response_id: message.response_id || Date.now(),
              content: "I'm here to help. What would you like to know?",
              content_complete: true,
              end_call: false,
            });
            break;

          default:
            logger.warn("Unknown interaction type", {
              type: message.interaction_type,
              callId: sessionId,
            });
        }
      } catch (error) {
        logger.error("Error processing Retell LLM message", {
          error: error instanceof Error ? error.message : String(error),
          callId: sessionId,
        });

        // Send error response
        this.sendErrorResponse(ws, "Failed to process message");
      }
    });

    ws.on("close", (code: number, reason: Buffer) => {
      logger.info("Retell LLM WebSocket closed", {
        callId: sessionId,
        code,
        reason: reason.toString(),
      });

      // Clean up active booking session
      this.activeBookingSessions.delete(sessionId);

      // Clean up Gemini session
      if (geminiService.isAvailable()) {
        geminiService.clearSession(sessionId);
      }

      // Clean up ConversationService session
      if (this.conversationService) {
        this.conversationService.clearSession(sessionId);
      }
    });

    ws.on("error", (error: Error) => {
      logger.error("Retell LLM WebSocket error", {
        error: error.message,
        callId: sessionId,
      });
    });
  }

  /**
   * Handle response required from user input
   */
  private async handleResponseRequired(
    ws: WebSocket,
    message: any,
    sessionId: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<void> {
    try {
      // Get the last user message
      const lastMessage =
        conversationHistory.length > 0
          ? conversationHistory[conversationHistory.length - 1]
          : null;

      if (!lastMessage || lastMessage.role !== "user") {
        logger.warn("No user message found in transcript", { sessionId });
        this.sendErrorResponse(ws, "No user message found");
        return;
      }

      const userMessage = lastMessage.content;
      logger.info("Generating response for user message", {
        sessionId,
        message: userMessage,
      });

      // Check if Gemini is available
      if (!geminiService.isAvailable()) {
        logger.error("Gemini service not available", { sessionId });
        this.sendResponse(ws, {
          response_type: "response",
          response_id: message.response_id || Date.now(),
          content:
            "I apologize, but I'm having trouble connecting to my AI service. Please try again later.",
          content_complete: true,
          end_call: false,
        });
        return;
      }

      // Determine if we should use ConversationService
      let useConversationService = false;

      if (this.conversationService) {
        const lowerMessage = userMessage.toLowerCase();

        // Check if this session is already in a booking flow
        const isActiveBookingSession =
          this.activeBookingSessions.has(sessionId);

        // Check if message is booking-related (including reschedule and cancel)
        const isBookingKeyword =
          lowerMessage.includes("book") ||
          lowerMessage.includes("appointment") ||
          lowerMessage.includes("schedule") ||
          lowerMessage.includes("meeting") ||
          lowerMessage.includes("available") ||
          lowerMessage.includes("slots") ||
          lowerMessage.includes("reschedule") ||
          lowerMessage.includes("change") ||
          lowerMessage.includes("move") ||
          lowerMessage.includes("cancel") ||
          lowerMessage.includes("delete");

        // Use ConversationService if:
        // 1. Session is already in booking flow, OR
        // 2. Message contains booking keywords
        if (isActiveBookingSession || isBookingKeyword) {
          useConversationService = true;
          this.activeBookingSessions.add(sessionId); // Mark session as active

          logger.info("Using ConversationService", {
            sessionId,
            reason: isActiveBookingSession
              ? "active_booking_session"
              : "booking_keyword_detected",
          });
        }
      }

      if (useConversationService && this.conversationService) {
        try {
          // Use conversation service which handles booking logic
          const result = await this.conversationService.processMessage(
            sessionId,
            userMessage
          );

          // Check if booking flow is complete (no current intent means conversation ended)
          if (!result.context.currentIntent) {
            this.activeBookingSessions.delete(sessionId);
            logger.info("Booking flow completed, session cleared", {
              sessionId,
            });
          }

          // Send the response (non-streaming for booking flow)
          this.sendResponse(ws, {
            response_type: "response",
            response_id: message.response_id || Date.now(),
            content: result.response,
            content_complete: true,
            end_call: false,
          });

          logger.info("Booking-aware response sent", {
            sessionId,
            responseLength: result.response.length,
            intent: result.context.currentIntent,
            bookingData: result.context.bookingData,
          });
          return;
        } catch (error) {
          logger.error("ConversationService error, falling back to Gemini", {
            error: error instanceof Error ? error.message : String(error),
            sessionId,
          });
          // Clear the active session on error
          this.activeBookingSessions.delete(sessionId);
          // Fall through to Gemini streaming
        }
      }

      // Generate response using Gemini with streaming
      const stream = await geminiService.sendMessageStream(
        sessionId,
        userMessage
      );

      let fullResponse = "";
      let chunkCount = 0;

      for await (const chunk of stream) {
        fullResponse += chunk;
        chunkCount++;

        // Send streaming chunk
        this.sendResponse(ws, {
          response_type: "response",
          response_id: message.response_id || Date.now(),
          content: chunk,
          content_complete: false,
          end_call: false,
        });
      }

      // Send final complete message
      this.sendResponse(ws, {
        response_type: "response",
        response_id: message.response_id || Date.now(),
        content: "",
        content_complete: true,
        end_call: false,
      });

      logger.info("Response generated successfully", {
        sessionId,
        responseLength: fullResponse.length,
        chunks: chunkCount,
      });
    } catch (error) {
      logger.error("Error generating response", {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
      });

      this.sendErrorResponse(
        ws,
        "I apologize, but I encountered an error. Could you please repeat that?"
      );
    }
  }

  /**
   * Send response to Retell
   */
  private sendResponse(ws: WebSocket, response: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(response));
    }
  }

  /**
   * Send error response
   */
  private sendErrorResponse(ws: WebSocket, errorMessage: string): void {
    this.sendResponse(ws, {
      response_type: "response",
      response_id: Date.now(),
      content: errorMessage,
      content_complete: true,
      end_call: false,
    });
  }
}

export const retellLLMService = new RetellLLMService();
