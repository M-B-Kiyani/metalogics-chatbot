# Implementation Plan

- [x] 1. Set up backend project structure and dependencies

  - Create a new `backend` directory in the project root
  - Initialize Node.js project with TypeScript configuration
  - Install core dependencies: express, @types/express, typescript, ts-node, prisma, @prisma/client, zod, winston, nodemailer, dotenv
  - Install dev dependencies: jest, @types/jest, ts-jest, supertest, @types/supertest
  - Create directory structure: src/routes, src/controllers, src/services, src/repositories, src/middleware, src/dto, src/errors, src/config, src/utils
  - Configure TypeScript with strict mode and path aliases
  - _Requirements: 1.1, 5.1, 8.1_

- [x] 2. Configure database and Prisma ORM

  - Initialize Prisma in the backend directory
  - Define Booking model in Prisma schema with all fields (id, name, company, email, phone, inquiry, startTime, duration, status, createdAt, updatedAt, confirmationSent, reminderSent)
  - Define BookingStatus enum (PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)
  - Add database indexes for startTime, status, and email fields
  - Create initial migration for the Booking table
  - Generate Prisma client
  - _Requirements: 1.2, 2.5, 7.5_

- [x] 3. Implement error handling infrastructure

  - Create base AppError class with statusCode, message, errorCode, and isOperational properties
  - Create specific error classes: ValidationError, NotFoundError, ConflictError, DatabaseError, AuthenticationError
  - Implement centralized error handler middleware that formats errors consistently
  - Create error response interface with statusCode, message, errorCode, and timestamp
  - _Requirements: 5.3, 5.2_

- [x] 4. Implement retry mechanism utility

  - Create RetryService with configurable retry options (maxAttempts, initialDelay, maxDelay, backoffMultiplier)
  - Implement withRetry function that executes operations with exponential backoff
  - Add logic to identify retryable errors (ECONNREFUSED, ETIMEDOUT, DATABASE_ERROR)
  - Add logging for retry attempts with attempt number and delay
  - _Requirements: 1.4, 3.4_

- [x] 5. Create database client and connection management

  - Create DatabaseClient class that manages Prisma client instance
  - Implement connection pooling configuration with max 20 connections
  - Create connect() and disconnect() methods for lifecycle management
  - Implement getHealth() method that checks database connectivity and returns connection pool stats
  - Add error handling for connection failures
  - _Requirements: 6.3, 6.4_

- [x] 6. Implement booking repository layer

  - Create BookingRepository class with Prisma client dependency
  - Implement create() method that inserts booking record with retry logic
  - Implement findById() method that retrieves booking by ID
  - Implement findMany() method with support for pagination and filtering (status, dateFrom, dateTo, email)
  - Implement update() method that updates booking fields
  - Implement delete() method that soft-deletes or removes booking
  - Implement checkTimeSlotConflict() method that queries overlapping time slots
  - _Requirements: 1.2, 2.1, 2.2, 4.4_

- [x] 7. Implement email notification service

  - Create EmailClient class using Nodemailer with SMTP configuration from environment variables
  - Implement sendEmail() method with retry logic (3 attempts, 2s/4s/8s backoff)
  - Create email templates for booking confirmation (user and admin versions)
  - Create email templates for booking updates and cancellations
  - Implement NotificationService that uses EmailClient to send booking-related emails
  - Implement sendBookingConfirmation() that sends to both user and admin
  - Implement sendBookingUpdate() and sendCancellationNotification() methods
  - Add error handling that logs failures but doesn't block booking creation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8. Implement booking service layer with business logic

  - Create BookingService class with dependencies on BookingRepository and NotificationService
  - Implement createBooking() that validates data, checks conflicts, persists booking, and triggers notifications
  - Implement getBookings() that retrieves paginated and filtered bookings
  - Implement getBookingById() that retrieves single booking or throws NotFoundError
  - Implement updateBooking() that validates time slot availability and updates booking
  - Implement updateBookingStatus() that updates status and triggers status-change notifications
  - Implement cancelBooking() that sets status to CANCELLED and sends cancellation email
  - Add transaction support for operations that require atomicity
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 4.1, 4.2, 4.3_

- [x] 9. Create validation schemas and DTOs

  - Create Zod schemas for CreateBookingDTO with required fields (name, email, company, timeSlot) and optional phone
  - Create Zod schema for UpdateBookingDTO with optional inquiry and timeSlot
  - Create Zod schema for BookingFilters with optional page, limit, status, dateFrom, dateTo, email
  - Create Zod schema for UpdateBookingStatusDTO
  - Implement validation middleware that validates request body/query against schemas
  - Add custom validators for email format, phone format, and time slot duration
  - _Requirements: 1.1, 7.1_

- [x] 10. Implement authentication and security middleware

  - Create authentication middleware that validates API key from Authorization header
  - Implement rate limiting middleware using in-memory store (100 requests per minute per IP)
  - Create CORS middleware with configuration from environment variables
  - Implement request timeout middleware (30 seconds)
  - Create input sanitization middleware to prevent XSS attacks
  - _Requirements: 6.1, 6.2, 7.2, 7.3, 7.4, 5.4_

- [x] 11. Implement logging infrastructure

  - Configure Winston logger with multiple transports (console for dev, file for production)
  - Create structured log format with timestamp, level, requestId, message, and context
  - Implement request logging middleware that logs all incoming requests with method, path, and requestId
  - Add correlation ID generation for request tracking
  - Configure log levels based on environment (debug for dev, info for production)
  - Implement log rotation for file-based logs
  - _Requirements: 5.1, 5.2_

- [x] 12. Create booking controller with request handlers

  - Create BookingController class with BookingService dependency
  - Implement createBooking() handler that processes POST /api/bookings requests
  - Implement getBookings() handler that processes GET /api/bookings with query parameters
  - Implement getBookingById() handler that processes GET /api/bookings/:id
  - Implement updateBooking() handler that processes PUT /api/bookings/:id
  - Implement updateBookingStatus() handler that processes PATCH /api/bookings/:id
  - Implement cancelBooking() handler that processes DELETE /api/bookings/:id
  - Add proper error handling and response formatting for all handlers
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.5_

- [x] 13. Create health check controller and endpoints

  - Create HealthController class with DatabaseClient dependency
  - Implement checkHealth() handler that returns service status, uptime, and version
  - Implement checkDatabaseHealth() handler that returns database connectivity and connection pool stats
  - Ensure health check responds within 500ms
  - _Requirements: 6.4, 6.5_

- [x] 14. Define API routes and wire up controllers

  - Create booking routes file that defines all booking endpoints (POST, GET, PUT, PATCH, DELETE)
  - Create health routes file that defines health check endpoints
  - Apply authentication middleware to write operations (POST, PUT, PATCH, DELETE)
  - Apply validation middleware to all routes with appropriate schemas
  - Apply rate limiting middleware to all routes
  - Mount routes on Express app with /api prefix
  - _Requirements: 1.1, 2.1, 4.1, 6.1, 7.3_

- [x] 15. Set up Express application and middleware stack

  - Create Express app instance
  - Configure middleware stack in correct order: CORS, request logging, body parser, rate limiting
  - Mount API routes
  - Add 404 handler for undefined routes
  - Add error handler middleware as last middleware
  - Configure request timeout
  - _Requirements: 5.4, 6.2, 7.2_

- [x] 16. Implement server startup and graceful shutdown

  - Create server.ts entry point that initializes database connection
  - Start Express server on configured port
  - Implement graceful shutdown handler that closes database connections and stops server
  - Add process signal handlers for SIGTERM and SIGINT
  - Log server startup information (port, environment, version)
  - _Requirements: 6.4_

- [x] 17. Create configuration management system

  - Create config module that loads and validates environment variables
  - Define configuration interfaces for server, database, email, auth, and logging
  - Implement validation for required environment variables on startup
  - Create .env.example file with all required variables documented
  - Add configuration for different environments (development, staging, production)
  - _Requirements: 7.2, 7.3_

- [x] 18. Implement OpenAPI documentation

  - Install swagger-jsdoc and swagger-ui-express packages
  - Create OpenAPI 3.0 specification with API metadata
  - Document all endpoints with request/response schemas, parameters, and examples
  - Document authentication requirements
  - Document all error codes and their meanings
  - Create docs routes that serve OpenAPI JSON at /api/docs and Swagger UI at /api/docs/ui
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 19. Integrate backend API with React frontend

  - Create API client service in frontend that calls backend endpoints
  - Update BookingModal onSubmit to call POST /api/bookings endpoint
  - Add error handling in frontend for API failures
  - Update environment variables in frontend to include backend API URL
  - Add loading states and error messages in UI
  - _Requirements: 1.3, 5.3_

- [x] 20. Create Docker configuration for deployment

  - Create Dockerfile for backend application with multi-stage build
  - Create docker-compose.yml with backend service and PostgreSQL service
  - Configure environment variables for Docker deployment
  - Add health check configuration in docker-compose
  - Create .dockerignore file
  - _Requirements: 6.4_

- [ ]\* 21. Write unit tests for core services

  - Write unit tests for BookingService methods with mocked dependencies
  - Write unit tests for RetryService with simulated failures
  - Write unit tests for NotificationService with mocked email client
  - Write unit tests for validation schemas
  - Write unit tests for error classes
  - Configure Jest with TypeScript support
  - _Requirements: 1.4, 3.4, 5.2_

- [ ]\* 22. Write integration tests for API endpoints
  - Set up test database configuration
  - Write integration tests for POST /api/bookings endpoint (success and validation errors)
  - Write integration tests for GET /api/bookings with various filters
  - Write integration tests for GET /api/bookings/:id (found and not found cases)
  - Write integration tests for PUT and PATCH endpoints
  - Write integration tests for authentication and rate limiting
  - Write integration tests for health check endpoints
  - Use Supertest for HTTP assertions
  - _Requirements: 1.1, 2.1, 4.1, 6.1, 6.5_
