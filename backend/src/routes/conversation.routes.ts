import { Router } from "express";
import { ConversationController } from "../controllers/conversation.controller";

export const createConversationRoutes = (
  controller: ConversationController
): Router => {
  const router = Router();

  // POST /api/chat - Handle chat messages
  router.post("/", controller.handleChatMessage);

  // DELETE /api/chat/:sessionId - Clear session
  router.delete("/:sessionId", controller.clearSession);

  return router;
};
