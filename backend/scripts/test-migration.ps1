# Test Migration Script (PowerShell)
# This script tests the database migration in a development environment

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Database Migration Test Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL in your .env file or as an environment variable"
    exit 1
}

Write-Host "✓ DATABASE_URL is set" -ForegroundColor Green
Write-Host ""

# Check database connection
Write-Host "Testing database connection..."
try {
    $null = npx prisma db pull --force 2>&1
    Write-Host "✓ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Cannot connect to database" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is running and credentials are correct"
    exit 1
}
Write-Host ""

# Check migration status
Write-Host "Checking migration status..."
$migrationStatus = npx prisma migrate status 2>&1 | Out-String

if ($migrationStatus -match "Database schema is up to date") {
    Write-Host "✓ All migrations are applied" -ForegroundColor Green
} elseif ($migrationStatus -match "following migrations have not yet been applied") {
    Write-Host "⚠ Pending migrations detected" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Applying migrations..."
    npx prisma migrate deploy
    Write-Host "✓ Migrations applied successfully" -ForegroundColor Green
} else {
    Write-Host "Migration status:"
    Write-Host $migrationStatus
}

Write-Host ""

# Verify schema
Write-Host "Verifying schema changes..."
try {
    $null = npx prisma validate 2>&1
    Write-Host "✓ Schema is valid" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Schema validation failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Generate Prisma client
Write-Host "Generating Prisma client..."
$null = npx prisma generate 2>&1
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Verify new fields exist
Write-Host "Verifying new fields in Booking table..."
$schemaCheck = npx prisma db pull --print 2>&1 | Out-String

$requiredFields = @(
    "calendarEventId",
    "crmContactId",
    "calendarSynced",
    "crmSynced",
    "requiresManualCalendarSync",
    "requiresManualCrmSync"
)

$allFieldsPresent = $true
foreach ($field in $requiredFields) {
    if ($schemaCheck -match $field) {
        Write-Host "  ✓ $field" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $field - NOT FOUND" -ForegroundColor Red
        $allFieldsPresent = $false
    }
}

Write-Host ""

if ($allFieldsPresent) {
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "✅ Migration test PASSED" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "All required fields are present in the database."
    Write-Host "The migration has been successfully applied."
    exit 0
} else {
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "❌ Migration test FAILED" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Some required fields are missing."
    Write-Host "Please check the migration and try again."
    exit 1
}
