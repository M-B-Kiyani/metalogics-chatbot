import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./index";

/**
 * OpenAPI 3.0 Specification Configuration
 * Defines API metadata, servers, security schemes, and component schemas
 */
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Metalogics Booking API",
    version: "1.0.0",
    description:
      "REST API for managing consultation bookings, notifications, and data persistence for the Metalogics AI Assistant",
    contact: {
      name: "Metalogics Support",
      email: config.email.adminEmail,
    },
    license: {
      name: "ISC",
      url: "https://opensource.org/licenses/ISC",
    },
  },
  servers: [
    {
      url: config.server.apiBaseUrl || `http://localhost:${config.server.port}`,
      description: "API Server",
    },
  ],
  tags: [
    {
      name: "Bookings",
      description: "Booking management endpoints",
    },
    {
      name: "Health",
      description: "Health check and monitoring endpoints",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "API key for authentication. Format: Bearer {api_key}",
      },
    },
    schemas: {
      Booking: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Unique booking identifier",
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
          name: {
            type: "string",
            description: "Client name",
            example: "John Doe",
          },
          company: {
            type: "string",
            description: "Company name",
            example: "Acme Corp",
          },
          email: {
            type: "string",
            format: "email",
            description: "Client email address",
            example: "john.doe@acme.com",
          },
          phone: {
            type: "string",
            nullable: true,
            description: "Client phone number (optional)",
            example: "+1-555-123-4567",
          },
          inquiry: {
            type: "string",
            description: "Consultation inquiry details",
            example: "I need help with AI integration for my business",
          },
          startTime: {
            type: "string",
            format: "date-time",
            description: "Booking start time",
            example: "2024-01-15T14:00:00.000Z",
          },
          duration: {
            type: "integer",
            enum: [15, 30, 45, 60],
            description: "Booking duration in minutes",
            example: 30,
          },
          status: {
            type: "string",
            enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
            description: "Booking status",
            example: "CONFIRMED",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Booking creation timestamp",
            example: "2024-01-15T10:00:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Last update timestamp",
            example: "2024-01-15T10:30:00.000Z",
          },
          confirmationSent: {
            type: "boolean",
            description: "Whether confirmation email was sent",
            example: true,
          },
          reminderSent: {
            type: "boolean",
            description: "Whether reminder email was sent",
            example: false,
          },
        },
        required: [
          "id",
          "name",
          "company",
          "email",
          "inquiry",
          "startTime",
          "duration",
          "status",
          "createdAt",
          "updatedAt",
        ],
      },
      CreateBookingRequest: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 1,
            description: "Client name",
            example: "John Doe",
          },
          company: {
            type: "string",
            minLength: 1,
            description: "Company name",
            example: "Acme Corp",
          },
          email: {
            type: "string",
            format: "email",
            description: "Client email address",
            example: "john.doe@acme.com",
          },
          phone: {
            type: "string",
            nullable: true,
            description: "Client phone number (optional)",
            example: "+1-555-123-4567",
          },
          inquiry: {
            type: "string",
            minLength: 1,
            description: "Consultation inquiry details",
            example: "I need help with AI integration for my business",
          },
          timeSlot: {
            type: "object",
            properties: {
              startTime: {
                type: "string",
                format: "date-time",
                description: "Booking start time",
                example: "2024-01-15T14:00:00.000Z",
              },
              duration: {
                type: "integer",
                enum: [15, 30, 45, 60],
                description: "Booking duration in minutes",
                example: 30,
              },
            },
            required: ["startTime", "duration"],
          },
        },
        required: ["name", "company", "email", "inquiry", "timeSlot"],
      },
      UpdateBookingRequest: {
        type: "object",
        properties: {
          inquiry: {
            type: "string",
            minLength: 1,
            description: "Updated consultation inquiry details",
            example: "Updated inquiry with more details",
          },
          timeSlot: {
            type: "object",
            properties: {
              startTime: {
                type: "string",
                format: "date-time",
                description: "Updated booking start time",
                example: "2024-01-15T15:00:00.000Z",
              },
              duration: {
                type: "integer",
                enum: [15, 30, 45, 60],
                description: "Updated booking duration in minutes",
                example: 45,
              },
            },
            required: ["startTime", "duration"],
          },
        },
      },
      UpdateBookingStatusRequest: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
            description: "New booking status",
            example: "CONFIRMED",
          },
        },
        required: ["status"],
      },
      PaginatedBookingsResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Booking",
            },
          },
          pagination: {
            type: "object",
            properties: {
              page: {
                type: "integer",
                description: "Current page number",
                example: 1,
              },
              limit: {
                type: "integer",
                description: "Items per page",
                example: 10,
              },
              total: {
                type: "integer",
                description: "Total number of items",
                example: 42,
              },
              totalPages: {
                type: "integer",
                description: "Total number of pages",
                example: 5,
              },
            },
          },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            $ref: "#/components/schemas/Booking",
          },
          message: {
            type: "string",
            example: "Booking created successfully",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "object",
            properties: {
              statusCode: {
                type: "integer",
                description: "HTTP status code",
                example: 400,
              },
              message: {
                type: "string",
                description: "Error message",
                example: "Validation failed",
              },
              errorCode: {
                type: "string",
                description: "Machine-readable error code",
                example: "VALIDATION_ERROR",
              },
              details: {
                type: "object",
                description: "Additional error details (optional)",
                nullable: true,
              },
              timestamp: {
                type: "string",
                format: "date-time",
                description: "Error timestamp",
                example: "2024-01-15T10:00:00.000Z",
              },
            },
          },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["healthy", "unhealthy"],
            description: "Service health status",
            example: "healthy",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "Health check timestamp",
            example: "2024-01-15T10:00:00.000Z",
          },
          uptime: {
            type: "number",
            description: "Service uptime in seconds",
            example: 3600,
          },
          version: {
            type: "string",
            description: "API version",
            example: "1.0.0",
          },
        },
      },
      DatabaseHealthResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["healthy", "unhealthy"],
            description: "Database health status",
            example: "healthy",
          },
          responseTime: {
            type: "number",
            description: "Database response time in milliseconds",
            example: 45,
          },
          connections: {
            type: "object",
            properties: {
              active: {
                type: "integer",
                description: "Number of active connections",
                example: 5,
              },
              idle: {
                type: "integer",
                description: "Number of idle connections",
                example: 15,
              },
              total: {
                type: "integer",
                description: "Total number of connections",
                example: 20,
              },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Bad request - validation failed",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              error: {
                statusCode: 400,
                message: "Validation failed",
                errorCode: "VALIDATION_ERROR",
                details: {
                  name: "Name is required",
                  email: "Invalid email format",
                },
                timestamp: "2024-01-15T10:00:00.000Z",
              },
            },
          },
        },
      },
      Unauthorized: {
        description: "Unauthorized - invalid or missing API key",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              error: {
                statusCode: 401,
                message: "Invalid or missing API key",
                errorCode: "AUTHENTICATION_ERROR",
                timestamp: "2024-01-15T10:00:00.000Z",
              },
            },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              error: {
                statusCode: 404,
                message: "Booking not found",
                errorCode: "NOT_FOUND",
                timestamp: "2024-01-15T10:00:00.000Z",
              },
            },
          },
        },
      },
      Conflict: {
        description: "Conflict - time slot already booked",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              error: {
                statusCode: 409,
                message: "Time slot is already booked",
                errorCode: "CONFLICT",
                timestamp: "2024-01-15T10:00:00.000Z",
              },
            },
          },
        },
      },
      TooManyRequests: {
        description: "Too many requests - rate limit exceeded",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              error: {
                statusCode: 429,
                message: "Too many requests, please try again later",
                errorCode: "RATE_LIMIT_EXCEEDED",
                timestamp: "2024-01-15T10:00:00.000Z",
              },
            },
          },
        },
      },
      ServiceUnavailable: {
        description: "Service unavailable - temporary system issue",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              error: {
                statusCode: 503,
                message: "Service temporarily unavailable",
                errorCode: "DATABASE_ERROR",
                timestamp: "2024-01-15T10:00:00.000Z",
              },
            },
          },
        },
      },
      GatewayTimeout: {
        description: "Gateway timeout - request took too long",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              error: {
                statusCode: 504,
                message: "Request timeout",
                errorCode: "TIMEOUT",
                timestamp: "2024-01-15T10:00:00.000Z",
              },
            },
          },
        },
      },
    },
  },
};

/**
 * Swagger JSDoc options
 * Specifies where to find API documentation in code
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], // Path to API docs
};

/**
 * Generate OpenAPI specification
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);
