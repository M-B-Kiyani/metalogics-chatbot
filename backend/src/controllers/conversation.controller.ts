import { Request, Response } from "express";
import { ConversationService } from "../services/conversation.service";
import { logger } from "../utils/logger";

export class ConversationController {
  constructor(private conversationService: ConversationService) {}

  /**
   * Handle chat messages from text input
   */
  handleChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, sessionId } = req.body;

      if (!message || !sessionId) {
        res.status(400).json({
          success: false,
          error: "Message and sessionId are required",
        });
        return;
      }

      logger.info("Chat message received", {
        sessionId,
        messageLength: message.length,
      });

      const result = await this.conversationService.processMessage(
        sessionId,
        message
      );

      res.json({
        success: true,
        response: result.response,
        sessionId: result.context.sessionId,
      });
    } catch (error) {
      logger.error("Chat message error", {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        error: "Failed to process message",
        message: "Sorry, I encountered an error. Please try again.",
      });
    }
  };

  /**
   * Clear conversation session
   */
  clearSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: "SessionId is required",
        });
        return;
      }

      this.conversationService.clearSession(sessionId);

      res.json({
        success: true,
        message: "Session cleared",
      });
    } catch (error) {
      logger.error("Clear session error", {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        error: "Failed to clear session",
      });
    }
  };
}
