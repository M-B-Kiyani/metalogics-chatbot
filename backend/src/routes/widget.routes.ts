import { Router } from "express";
import { ConversationController } from "../controllers/conversation.controller";
import { RetellController } from "../controllers/retell.controller";
import { widgetAuthMiddleware } from "../middleware";
import { rateLimiter } from "../middleware";

/**
 * Create widget routes with widget authentication
 * These routes are specifically for the embeddable widget
 */
export const createWidgetRoutes = (
  conversationController: ConversationController,
  retellController: RetellController
): Router => {
  const router = Router();

  // Apply widget authentication to all routes
  router.use(widgetAuthMiddleware);

  // Apply rate limiting (more lenient for widgets)
  const widgetRateLimit = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per IP
    message: {
      success: false,
      error: {
        statusCode: 429,
        message: "Too many requests from this IP, please try again later",
        errorCode: "RATE_LIMIT_EXCEEDED",
        timestamp: new Date().toISOString(),
      },
    },
  });

  router.use(widgetRateLimit);

  // Widget chat endpoint
  router.post("/chat", conversationController.handleConversation);

  // Widget voice endpoints
  router.post("/retell/register-call", retellController.registerCall);
  router.get("/retell/health", retellController.healthCheck);

  return router;
};
