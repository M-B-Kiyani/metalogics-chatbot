#!/bin/bash

# Test Migration Script
# This script tests the database migration in a development environment

set -e

echo "=========================================="
echo "Database Migration Test Script"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your .env file or export it"
    exit 1
fi

echo "✓ DATABASE_URL is set"
echo ""

# Check database connection
echo "Testing database connection..."
npx prisma db pull --force > /dev/null 2>&1 || {
    echo "❌ ERROR: Cannot connect to database"
    echo "Please ensure PostgreSQL is running and credentials are correct"
    exit 1
}
echo "✓ Database connection successful"
echo ""

# Check migration status
echo "Checking migration status..."
MIGRATION_STATUS=$(npx prisma migrate status 2>&1)

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    echo "✓ All migrations are applied"
elif echo "$MIGRATION_STATUS" | grep -q "following migrations have not yet been applied"; then
    echo "⚠ Pending migrations detected"
    echo ""
    echo "Applying migrations..."
    npx prisma migrate deploy
    echo "✓ Migrations applied successfully"
else
    echo "Migration status:"
    echo "$MIGRATION_STATUS"
fi

echo ""

# Verify schema
echo "Verifying schema changes..."
npx prisma validate > /dev/null 2>&1 || {
    echo "❌ ERROR: Schema validation failed"
    exit 1
}
echo "✓ Schema is valid"
echo ""

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate > /dev/null 2>&1
echo "✓ Prisma client generated"
echo ""

# Verify new fields exist
echo "Verifying new fields in Booking table..."
SCHEMA_CHECK=$(npx prisma db pull --print 2>&1)

REQUIRED_FIELDS=(
    "calendarEventId"
    "crmContactId"
    "calendarSynced"
    "crmSynced"
    "requiresManualCalendarSync"
    "requiresManualCrmSync"
)

ALL_FIELDS_PRESENT=true
for field in "${REQUIRED_FIELDS[@]}"; do
    if echo "$SCHEMA_CHECK" | grep -q "$field"; then
        echo "  ✓ $field"
    else
        echo "  ❌ $field - NOT FOUND"
        ALL_FIELDS_PRESENT=false
    fi
done

echo ""

if [ "$ALL_FIELDS_PRESENT" = true ]; then
    echo "=========================================="
    echo "✅ Migration test PASSED"
    echo "=========================================="
    echo ""
    echo "All required fields are present in the database."
    echo "The migration has been successfully applied."
    exit 0
else
    echo "=========================================="
    echo "❌ Migration test FAILED"
    echo "=========================================="
    echo ""
    echo "Some required fields are missing."
    echo "Please check the migration and try again."
    exit 1
fi
