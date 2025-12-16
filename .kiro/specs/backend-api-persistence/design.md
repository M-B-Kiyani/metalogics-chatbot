# Backend API & Persistence - Design Document

## Overview

The Backend API & Persistence system provides a Node.js/Express-based REST API that handles booking management, data persistence, and notification delivery for the Metalogics AI Assistant. The system uses PostgreSQL for reliable data storage, implements retry mechanisms for resilience, and integrates with email services for booking confirmations.

### Key Design Goals

- **Reliability**: Ensure bookings are never lost through retry mechanisms and transaction management
- **Performance**: Handle concurrent requests efficiently with connection pooling and caching
- **Security**: Protect sensitive user data with encryption, authentication, and input validation
- **Maintainability**: Use clean architecture patterns with clear separation of concerns
- **Observability**: Comprehensive logging and monitoring for operational visibility

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  React Client   │
│   (Frontend)    │
└────────┬────────┘
         │ HTTPS/REST
         ▼
┌─────────────────────────────────────┐
│         Express API Server          │
│  ┌──────────────────────────────┐  │
│  │   Routes & Middleware        │  │
│  │  - CORS, Auth, Validation    │  │
│  └──────────┬───────────────────┘  │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │   Controllers                │  │
│  │  - Request/Response Handling │  │
│  └──────────┬───────────────────┘  │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │   Services Layer             │  │
│  │  - Business Logic            │  │
│  │  - Retry Mechanisms          │  │
│  └──────┬───────────────┬───────┘  │
│         │               │           │
└─────────┼───────────────┼───────────┘
          ▼               ▼
┌──────────────────┐  ┌──────────────┐
│   PostgreSQL     │  │   Email      │
│   Database       │  │   Service    │
│                  │  │  (Nodemailer)│
└──────────────────┘  └──────────────┘
```

### Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 14+ with pg driver
- **ORM**: Prisma (for type-safe database access)
- **Email**: Nodemailer with SMTP transport
- **Validation**: Zod for schema validation
- **Logging**: Winston for structured logging
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest for unit tests, Supertest for API tests

### Deployment Architecture

- **Development**: Local Node.js server with local PostgreSQL
- **Production**: Containerized deployment (Docker) with managed PostgreSQL (e.g., AWS RDS, Supabase)
- **Environment Variables**: Managed via .env files (development) and secure secret management (production)

## Components and Interfaces

### 1. API Routes Layer

**Responsibility**: Define HTTP endpoints and route requests to appropriate controllers

```typescript
// routes/bookings.routes.ts
interface BookingRoutes {
  POST   /api/bookings          - Create new booking
  GET    /api/bookings          - List bookings (paginated, filtered)
  GET    /api/bookings/:id      - Get booking by ID
  PUT    /api/bookings/:id      - Update booking details
  PATCH  /api/bookings/:id      - Update booking status
  DELETE /api/bookings/:id      - Cancel booking
}

// routes/health.routes.ts
interface HealthRoutes {
  GET /api/health               - Health check endpoint
  GET /api/health/db            - Database connectivity check
}

// routes/docs.routes.ts
interface DocsRoutes {
  GET /api/docs                 - OpenAPI JSON specification
  GET /api/docs/ui              - Swagger UI interface
}
```

### 2. Middleware Layer

**Responsibility**: Handle cross-cutting concerns before requests reach controllers

```typescript
// middleware/auth.middleware.ts
interface AuthMiddleware {
  validateApiKey(req, res, next): void;
  // Validates API key from Authorization header
}

// middleware/validation.middleware.ts
interface ValidationMiddleware {
  validateRequest(schema: ZodSchema): RequestHandler;
  // Validates request body/query against Zod schema
}

// middleware/rateLimit.middleware.ts
interface RateLimitMiddleware {
  rateLimiter: RateLimiterMiddleware;
  // 100 requests per minute per IP
}

// middleware/errorHandler.middleware.ts
interface ErrorHandlerMiddleware {
  errorHandler(err, req, res, next): void;
  // Centralized error handling and formatting
}

// middleware/logger.middleware.ts
interface LoggerMiddleware {
  requestLogger(req, res, next): void;
  // Logs all incoming requests with request ID
}
```

### 3. Controllers Layer

**Responsibility**: Handle HTTP request/response, delegate to services

```typescript
// controllers/booking.controller.ts
interface BookingController {
  createBooking(req: Request, res: Response): Promise<Response>;
  getBookings(req: Request, res: Response): Promise<Response>;
  getBookingById(req: Request, res: Response): Promise<Response>;
  updateBooking(req: Request, res: Response): Promise<Response>;
  updateBookingStatus(req: Request, res: Response): Promise<Response>;
  cancelBooking(req: Request, res: Response): Promise<Response>;
}

// controllers/health.controller.ts
interface HealthController {
  checkHealth(req: Request, res: Response): Promise<Response>;
  checkDatabaseHealth(req: Request, res: Response): Promise<Response>;
}
```

### 4. Services Layer

**Responsibility**: Implement business logic, coordinate between repositories and external services

```typescript
// services/booking.service.ts
interface BookingService {
  createBooking(data: CreateBookingDTO): Promise<Booking>;
  // Validates, persists booking, triggers notifications

  getBookings(filters: BookingFilters): Promise<PaginatedBookings>;
  // Retrieves bookings with pagination and filtering

  getBookingById(id: string): Promise<Booking | null>;
  // Retrieves single booking

  updateBooking(id: string, data: UpdateBookingDTO): Promise<Booking>;
  // Updates booking with conflict checking

  updateBookingStatus(id: string, status: BookingStatus): Promise<Booking>;
  // Updates status and triggers status-change notifications

  cancelBooking(id: string): Promise<Booking>;
  // Cancels booking and sends cancellation email
}

// services/notification.service.ts
interface NotificationService {
  sendBookingConfirmation(booking: Booking): Promise<void>;
  // Sends confirmation email to user and admin

  sendBookingUpdate(booking: Booking): Promise<void>;
  // Sends update notification

  sendCancellationNotification(booking: Booking): Promise<void>;
  // Sends cancellation notification
}

// services/retry.service.ts
interface RetryService {
  withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T>;
  // Executes operation with exponential backoff retry
}
```

### 5. Repository Layer

**Responsibility**: Data access and persistence operations

```typescript
// repositories/booking.repository.ts
interface BookingRepository {
  create(data: CreateBookingData): Promise<Booking>;
  findById(id: string): Promise<Booking | null>;
  findMany(filters: BookingFilters): Promise<Booking[]>;
  update(id: string, data: UpdateBookingData): Promise<Booking>;
  delete(id: string): Promise<void>;
  checkTimeSlotConflict(timeSlot: TimeSlot): Promise<boolean>;
}
```

### 6. External Service Integrations

```typescript
// integrations/email.client.ts
interface EmailClient {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  // Sends email via SMTP using Nodemailer
}

// integrations/database.client.ts
interface DatabaseClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getHealth(): Promise<DatabaseHealth>;
  // Manages PostgreSQL connection pool
}
```

## Data Models

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma

model Booking {
  id          String        @id @default(uuid())

  // User Information (encrypted)
  name        String
  company     String
  email       String
  phone       String?
  inquiry     String        @db.Text

  // Time Slot Information
  startTime   DateTime
  duration    Int           // Duration in minutes: 15, 30, 45, 60

  // Booking Metadata
  status      BookingStatus @default(PENDING)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Notification Tracking
  confirmationSent Boolean   @default(false)
  reminderSent     Boolean   @default(false)

  @@index([startTime])
  @@index([status])
  @@index([email])
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}
```

### DTOs (Data Transfer Objects)

```typescript
// dto/booking.dto.ts

interface CreateBookingDTO {
  name: string;
  company: string;
  email: string;
  phone?: string;
  inquiry: string;
  timeSlot: {
    startTime: Date;
    duration: 15 | 30 | 45 | 60;
  };
}

interface UpdateBookingDTO {
  inquiry?: string;
  timeSlot?: {
    startTime: Date;
    duration: 15 | 30 | 45 | 60;
  };
}

interface BookingFilters {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  dateFrom?: Date;
  dateTo?: Date;
  email?: string;
}

interface PaginatedBookings {
  data: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### API Response Formats

```typescript
// Success Response
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Error Response
interface ErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string;
    errorCode: string;
    details?: any;
    timestamp: string;
  };
}
```

## Error Handling

### Error Classification

```typescript
// errors/AppError.ts
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errorCode: string,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

// Specific Error Types
class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, "VALIDATION_ERROR");
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, "NOT_FOUND");
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, "CONFLICT");
  }
}

class DatabaseError extends AppError {
  constructor(message: string) {
    super(503, message, "DATABASE_ERROR");
  }
}
```

### Retry Strategy

```typescript
// config/retry.config.ts
interface RetryConfig {
  maxAttempts: 3;
  initialDelay: 1000; // 1 second
  maxDelay: 8000; // 8 seconds
  backoffMultiplier: 2; // Exponential backoff
  retryableErrors: ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "DATABASE_ERROR"];
}

// Retry Logic
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error) || attempt === config.maxAttempts) {
        throw error;
      }

      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      await sleep(delay);
    }
  }

  throw lastError;
}
```

### Error Response Flow

1. Error occurs in service/repository layer
2. Error is caught and wrapped in appropriate AppError subclass
3. Error propagates to controller
4. Controller passes error to error handler middleware
5. Error handler middleware formats error response
6. Error is logged with context
7. Formatted error response sent to client

## Testing Strategy

### Unit Tests

```typescript
// Test Services in Isolation
describe("BookingService", () => {
  it("should create booking and trigger notification", async () => {
    // Mock repository and notification service
    // Test business logic
  });

  it("should retry on database failure", async () => {
    // Mock database failure
    // Verify retry behavior
  });
});

// Test Repositories
describe("BookingRepository", () => {
  it("should detect time slot conflicts", async () => {
    // Test conflict detection logic
  });
});
```

### Integration Tests

```typescript
// Test API Endpoints
describe("POST /api/bookings", () => {
  it("should create booking and return 201", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send(validBookingData)
      .expect(201);

    expect(response.body.data).toHaveProperty("id");
  });

  it("should return 400 for invalid data", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send(invalidBookingData)
      .expect(400);
  });
});
```

### Test Database

- Use separate test database or in-memory SQLite for tests
- Reset database state between tests
- Use test fixtures for consistent test data

## Security Considerations

### Input Validation

- All inputs validated using Zod schemas
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via input sanitization

### Authentication & Authorization

- API key authentication for write operations
- API keys stored as hashed values in environment variables
- Rate limiting per IP address

### Data Encryption

- Sensitive fields (email, phone) encrypted at rest using AES-256
- Encryption keys managed via environment variables
- HTTPS enforced for all API communication

### CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // 24 hours
};
```

## Configuration Management

### Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/metalogics_bookings
DATABASE_POOL_SIZE=20

# Authentication
API_KEY=your-secure-api-key-here

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@metalogics.io

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://metalogics.io
```

## Logging Strategy

### Log Levels

- **error**: System errors, failed operations after retries
- **warn**: Retry attempts, degraded functionality
- **info**: Successful operations, API requests
- **debug**: Detailed execution flow (development only)

### Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "requestId": "req-123-456",
  "message": "Booking created successfully",
  "context": {
    "bookingId": "booking-789",
    "userId": "user-email@example.com",
    "duration": 125
  }
}
```

### Log Destinations

- **Development**: Console output with pretty formatting
- **Production**: File-based logs with rotation + external logging service (e.g., CloudWatch, Datadog)

## Performance Optimization

### Database Optimization

- Connection pooling (max 20 connections)
- Indexed columns: startTime, status, email
- Query optimization via Prisma query analysis

### Caching Strategy

- Cache health check results (30 second TTL)
- Consider caching frequently accessed bookings (future enhancement)

### Request Timeout

- 30-second timeout for all API requests
- Separate timeout for database operations (10 seconds)

## Monitoring & Observability

### Health Checks

```typescript
// GET /api/health
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}

// GET /api/health/db
{
  "status": "healthy",
  "responseTime": 45,
  "connections": {
    "active": 5,
    "idle": 15,
    "total": 20
  }
}
```

### Metrics to Track

- Request rate and response times
- Error rates by endpoint
- Database query performance
- Email delivery success rate
- Retry attempt frequency

## Deployment Considerations

### Docker Configuration

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

### Database Migrations

- Use Prisma migrations for schema changes
- Run migrations before deployment
- Backup database before migrations

### Environment-Specific Configuration

- Development: Local PostgreSQL, verbose logging
- Staging: Managed database, production-like config
- Production: Managed database, optimized logging, monitoring enabled

## Future Enhancements

- WebSocket support for real-time booking updates
- Redis caching layer for improved performance
- GraphQL API as alternative to REST
- Booking reminder system (scheduled jobs)
- Analytics and reporting endpoints
- Multi-tenant support for different organizations
