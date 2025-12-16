# Prisma Database Setup

This directory contains the Prisma schema and migrations for the Metalogics booking system.

## Schema Overview

The database schema includes:

- **Booking Model**: Stores consultation booking information
  - User details (name, company, email, phone)
  - Time slot information (startTime, duration)
  - Booking status (PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)
  - Notification tracking (confirmationSent, reminderSent)
  - External integration IDs (calendarEventId, crmContactId)
  - Sync status flags (calendarSynced, crmSynced)
  - Manual processing flags (requiresManualCalendarSync, requiresManualCrmSync)

## Database Indexes

The following indexes are created for optimal query performance:

- `startTime` - For efficient time-based queries
- `status` - For filtering bookings by status
- `email` - For user lookup and filtering
- `calendarEventId` - For Google Calendar event lookups
- `crmContactId` - For HubSpot contact lookups
- `(email, createdAt)` - Composite index for frequency limit queries

## Running Migrations

To apply migrations to your database:

```bash
# Apply all pending migrations
npm run prisma:migrate

# Create a new migration (after schema changes)
npx prisma migrate dev --name <migration_name>

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Generating Prisma Client

After any schema changes, regenerate the Prisma client:

```bash
npm run prisma:generate
```

## Database Requirements

- PostgreSQL 14 or higher
- Connection string format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
- Set the `DATABASE_URL` environment variable in `.env`

## Prisma Studio

To explore and manage your database visually:

```bash
npm run prisma:studio
```

This will open Prisma Studio in your browser at http://localhost:5555

## Migration Documentation

For detailed information about database migrations:

- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Comprehensive migration guide with development and production instructions
- **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** - Quick reference for production deployments

### Recent Migrations

- `20241117000000_init` - Initial schema creation
- `20241118000000_add_integration_fields` - Added Google Calendar and HubSpot CRM integration fields
