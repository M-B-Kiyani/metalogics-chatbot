# API Documentation

This directory contains comprehensive documentation for the Metalogics Booking API.

## Overview

The API documentation is implemented using OpenAPI 3.0 specification and served through Swagger UI for interactive exploration.

## Accessing the Documentation

### OpenAPI Specification (JSON)

- **Endpoint**: `GET /api/docs`
- **Format**: JSON
- **Use Case**: For programmatic access, code generation tools, or importing into API clients

```bash
curl http://localhost:3000/api/docs
```

### Swagger UI (Interactive)

- **Endpoint**: `GET /api/docs/ui`
- **Format**: Interactive web interface
- **Use Case**: For exploring the API, testing endpoints, and viewing examples

Open in browser: http://localhost:3000/api/docs/ui

## Documentation Structure

### 1. API Metadata

- **Title**: Metalogics Booking API
- **Version**: 1.0.0
- **Description**: REST API for managing consultation bookings
- **Contact**: Support email and information
- **License**: ISC

### 2. Endpoints Documentation

All endpoints are fully documented with:

- **Summary**: Brief description of the endpoint
- **Description**: Detailed explanation of functionality
- **Parameters**: Path, query, and header parameters with types and examples
- **Request Body**: Schema definitions with required fields and examples
- **Responses**: All possible response codes with schemas and examples
- **Security**: Authentication requirements

#### Booking Endpoints

- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - List bookings with pagination and filtering
- `GET /api/bookings/{id}` - Get a specific booking
- `PUT /api/bookings/{id}` - Update booking details
- `PATCH /api/bookings/{id}` - Update booking status
- `DELETE /api/bookings/{id}` - Cancel a booking

#### Health Check Endpoints

- `GET /api/health` - Check service health
- `GET /api/health/db` - Check database connectivity

### 3. Schemas

Reusable data models defined in `components/schemas`:

- **Booking**: Complete booking object
- **CreateBookingRequest**: Request body for creating bookings
- **UpdateBookingRequest**: Request body for updating bookings
- **UpdateBookingStatusRequest**: Request body for status updates
- **PaginatedBookingsResponse**: Paginated list response
- **SuccessResponse**: Standard success response format
- **ErrorResponse**: Standard error response format
- **HealthResponse**: Health check response
- **DatabaseHealthResponse**: Database health response

### 4. Security Schemes

Authentication methods:

- **ApiKeyAuth**: API key authentication via Authorization header
  - Type: API Key
  - Location: Header
  - Name: Authorization
  - Format: `Bearer {api_key}`

### 5. Error Codes

Comprehensive error code documentation with:

- HTTP status codes
- Machine-readable error codes
- Human-readable messages
- Common causes
- Resolution guidance
- Examples

See [error-codes.md](./error-codes.md) for complete reference.

## Using the Documentation

### Testing Endpoints in Swagger UI

1. Open http://localhost:3000/api/docs/ui in your browser
2. Click on an endpoint to expand it
3. Click "Try it out" button
4. Fill in the required parameters
5. For authenticated endpoints, click "Authorize" and enter your API key
6. Click "Execute" to send the request
7. View the response below

### Authentication in Swagger UI

1. Click the "Authorize" button at the top of the page
2. Enter your API key in the format: `Bearer YOUR_API_KEY`
3. Click "Authorize"
4. Click "Close"
5. All subsequent requests will include the authentication header

### Importing into API Clients

#### Postman

1. Open Postman
2. Click "Import"
3. Enter URL: `http://localhost:3000/api/docs`
4. Click "Import"

#### Insomnia

1. Open Insomnia
2. Click "Create" → "Import From" → "URL"
3. Enter: `http://localhost:3000/api/docs`
4. Click "Fetch and Import"

#### VS Code REST Client

1. Install REST Client extension
2. Create a `.http` file
3. Add: `@baseUrl = http://localhost:3000`
4. Reference the OpenAPI spec for endpoint details

## Verification

To verify the documentation is properly configured:

```bash
npm run verify:docs
```

This script checks:

- OpenAPI specification structure
- All required endpoints are documented
- Error codes are defined
- Schemas are complete

## Maintenance

### Adding New Endpoints

1. Add JSDoc comments with `@openapi` tag to route definitions
2. Follow the OpenAPI 3.0 specification format
3. Include all parameters, request bodies, and responses
4. Reference existing schemas where possible
5. Run `npm run verify:docs` to validate

Example:

```typescript
/**
 * @openapi
 * /api/example:
 *   get:
 *     tags:
 *       - Example
 *     summary: Example endpoint
 *     description: Detailed description
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExampleResponse'
 */
router.get("/example", controller.example);
```

### Adding New Schemas

1. Add schema definition to `swagger.config.ts` in `components/schemas`
2. Use JSON Schema format
3. Include descriptions and examples
4. Reference from endpoint documentation using `$ref`

### Adding New Error Codes

1. Add error response to `components/responses` in `swagger.config.ts`
2. Document in `error-codes.md`
3. Include HTTP status code, error code, message, and resolution

## Configuration

Documentation configuration is in `src/config/swagger.config.ts`:

- **API Metadata**: Title, version, description, contact
- **Servers**: API server URLs
- **Tags**: Endpoint groupings
- **Components**: Schemas, security schemes, responses
- **API Paths**: Automatically discovered from JSDoc comments

## Files

- `swagger.config.ts` - OpenAPI specification configuration
- `docs.routes.ts` - Documentation endpoint routes
- `error-codes.md` - Comprehensive error code reference
- `README.md` - This file

## Best Practices

1. **Keep documentation in sync with code**: Update docs when changing endpoints
2. **Use examples**: Provide realistic examples for all schemas
3. **Document all responses**: Include success and all error cases
4. **Use references**: Reuse schemas with `$ref` to avoid duplication
5. **Test in Swagger UI**: Verify endpoints work as documented
6. **Run verification**: Use `npm run verify:docs` before committing

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [API Design Best Practices](https://swagger.io/resources/articles/best-practices-in-api-design/)
