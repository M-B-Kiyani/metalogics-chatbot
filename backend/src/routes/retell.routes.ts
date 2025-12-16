import { Router } from "express";
import { RetellController } from "../controllers/retell.controller";

/**
 * Create Retell routes with controller
 * Handles voice assistant function calls and webhooks
 */
export function createRetellRoutes(retellController: RetellController): Router {
  const router = Router();

  /**
   * @route POST /api/retell/register-call
   * @desc Register a new call and get access token
   */
  router.post("/register-call", retellController.registerCall);

  /**
   * @route POST /api/retell/webhook
   * @desc Handle Retell webhooks
   */
  router.post("/webhook", retellController.handleWebhook);

  /**
   * @route POST /api/retell/llm
   * @desc Handle custom LLM requests from Retell
   */
  router.post("/llm", retellController.handleLLM);

  /**
   * @route POST /api/retell/execute-function
   * @desc Execute a function called by Retell Agent
   */
  router.post("/execute-function", retellController.executeFunction);

  /**
   * @route GET /api/retell/health
   * @desc Health check
   */
  router.get("/health", retellController.healthCheck);

  return router;
}
