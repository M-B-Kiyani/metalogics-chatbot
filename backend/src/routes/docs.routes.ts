import { Router, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger.config";
import { logger } from "../utils/logger";

/**
 * Create documentation routes
 * Serves OpenAPI specification and Swagger UI
 * @returns Express Router with documentation endpoints
 */
export const createDocsRoutes = (): Router => {
  const router = Router();

  /**
   * GET /api/docs
   * Returns OpenAPI 3.0 specification in JSON format
   */
  router.get("/", (req: Request, res: Response) => {
    logger.info("OpenAPI specification requested", {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  /**
   * GET /api/docs/ui
   * Serves Swagger UI for interactive API documentation
   */
  router.use(
    "/ui",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Metalogics Booking API Documentation",
      customfavIcon: "/favicon.ico",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    })
  );

  logger.info("Documentation routes configured", {
    specEndpoint: "/api/docs",
    uiEndpoint: "/api/docs/ui",
  });

  return router;
};
