# Deployment and Validation Scripts

This directory contains scripts for deployment validation, testing, and database operations.

## Overview

These scripts help ensure the booking system is properly configured and ready for deployment. They validate integrations, test authentication, and verify database setup.

## Available Scripts

### Deployment Validation

#### `validate-deployment.ts`

**Purpose:** Comprehensive pre-deployment validation

**Usage:**

```bash
npm run validate:deployment
```

**What it checks:**

- ✓ All required environment variables
- ✓ Database connectivity and schema
- ✓ Google Calendar authentication and API access
- ✓ HubSpot authentication and API access
- ✓ Configuration values (business hours, booking rules)

**Exit codes:**

- `0` - All checks passed
- `1` - One or more checks failed

**When to use:**

- Before every deployment
- After configuration changes
- When troubleshooting issues

**Example output:**

```
🚀 Booking System Deployment Validation
============================================================
Environment: production
Timestamp: 2024-01-15T10:30:00Z

📋 Validating Environment Variables...
  ✓ NODE_ENV: Set
  ✓ PORT: Set
  ✓ DATABASE_URL: Set
  ...

🗄️  Validating Database Connection...
  ✓ Connection: Successfully connected to database
  ✓ Schema: Schema is accessible

📅 Validating Google Calendar Integration...
  ✓ Service Account Key: File exists
  ✓ Key Format: Valid service account key
  ✓ Authentication: Successfully authenticated
  ✓ API Access: Successfully accessed calendar

🔗 Validating HubSpot Integration...
  ✓ Access Token: Token format valid
  ✓ Authentication: Successfully authenticated
  ✓ API Access: Successfully accessed HubSpot API

⚙️  Validating Configuration...
  ✓ Business Start Hour: 9:00
  ✓ Business End Hour: 17:00
  ✓ Business Days: 5 days configured
  ✓ Frequency Limit: 2 bookings per 30 days
  ✓ Buffer Time: 15 minutes
  ✓ Min Advance Time: 24 hours

============================================================
DEPLOYMENT VALIDATION SUMMARY
============================================================

✓ Passed:   25
✗ Failed:   0
⚠ Warnings: 0
○ Skipped:  0

Total:      25

✅ DEPLOYMENT VALIDATION PASSED

All checks passed. System is ready for deployment.
```

---

### Integration Testing

#### `test-google-calendar.ts`

**Purpose:** Test Google Calendar integration in isolation

**Usage:**

```bash
npm run test:google-calendar
```

**What it tests:**

- ✓ Google Calendar is enabled
- ✓ Service account key file exists and is valid
- ✓ Authentication with Google Calendar API
- ✓ Calendar access and event retrieval
- ✓ Event creation and deletion

**When to use:**

- During initial Google Calendar setup
- When troubleshooting calendar issues
- After changing service account credentials
- Before deployment

**Example output:**

```
🔍 Testing Google Calendar Integration
============================================================
✓ Google Calendar is enabled

📄 Checking service account key file: ./config/google-service-account.json
✓ Service account key file exists

🔍 Validating key file format...
✓ Key file format is valid
  Service Account Email: booking-system@project.iam.gserviceaccount.com
  Project ID: my-project-123

🔐 Testing authentication...
✓ Successfully authenticated with Google Calendar API

📅 Testing calendar access...
  Calendar ID: primary
✓ Successfully accessed calendar
  Found 3 event(s) in the next 24 hours

  Recent events:
    1. Team Meeting
       Start: 2024-01-15T14:00:00-05:00
    2. Client Call
       Start: 2024-01-15T16:00:00-05:00

🧪 Testing event creation...
Creating a test event...
✓ Successfully created test event
  Event ID: abc123xyz
  Summary: [TEST] Booking System Validation
  Start: 2024-01-22T10:00:00-05:00

🧹 Cleaning up test event...
✓ Test event deleted

============================================================
✅ GOOGLE CALENDAR INTEGRATION TEST PASSED
============================================================

Your Google Calendar integration is properly configured.

Configuration summary:
  Service Account: booking-system@project.iam.gserviceaccount.com
  Calendar ID: primary
  Timezone: America/New_York
  Retry Attempts: 3

The booking system is ready to use Google Calendar.
```

---

#### `test-hubspot.ts`

**Purpose:** Test HubSpot CRM integration in isolation

**Usage:**

```bash
npm run test:hubspot
```

**What it tests:**

- ✓ HubSpot is enabled
- ✓ Access token is present and valid format
- ✓ Authentication with HubSpot API
- ✓ Contact search functionality
- ✓ Contact creation
- ✓ Contact update
- ✓ Upsert functionality (create or update)

**When to use:**

- During initial HubSpot setup
- When troubleshooting CRM issues
- After changing access token
- Before deployment

**Example output:**

```
🔍 Testing HubSpot CRM Integration
============================================================
✓ HubSpot is enabled

🔑 Checking access token...
✓ Access token is present
  Token length: 45 characters
  Token prefix: pat-na1-ab...

🔐 Testing authentication...
✓ Successfully authenticated with HubSpot API

🔍 Testing contact search...
Searching for a test contact...
✓ Search completed (no contact found with test email)

🧪 Testing contact creation...
Creating a test contact...
✓ Successfully created test contact
  Contact ID: 12345678
  Email: test-1705329000@deployment-validation.example.com
  Name: Deployment Test

🔄 Testing contact update...
✓ Successfully updated test contact
  Company: Updated Validation Script
  Phone: +1234567890

🔄 Testing upsert functionality...
✓ First upsert created contact
  Contact ID: 12345679
✓ Second upsert updated existing contact
  Same Contact ID: Yes
  Updated Company: Updated Company

📝 Note: Test contact was created but not deleted.
   You can manually delete it from HubSpot if desired.
   Contact ID: 12345678

============================================================
✅ HUBSPOT CRM INTEGRATION TEST PASSED
============================================================

Your HubSpot integration is properly configured.

Configuration summary:
  Access Token: pat-na1-ab...xyz
  Retry Attempts: 3
  Retry Delay: 1000ms

The booking system is ready to use HubSpot CRM.

Note: Test contacts were created during validation.
You may want to clean them up in your HubSpot account.
```

---

### Database Scripts

#### `validate-schema.js`

**Purpose:** Validate Prisma database schema

**Usage:**

```bash
npm run validate:schema
```

**What it checks:**

- ✓ Prisma schema file is valid
- ✓ Database connection works
- ✓ Schema matches database
- ✓ All migrations are applied

**When to use:**

- After running migrations
- When troubleshooting database issues
- Before deployment

---

#### `test-migration.sh` / `test-migration.ps1`

**Purpose:** Test database migrations in a safe environment

**Usage:**

```bash
# Linux/Mac
./scripts/test-migration.sh

# Windows
./scripts/test-migration.ps1
```

**What it does:**

- Creates a test database
- Runs migrations
- Validates schema
- Cleans up test database

**When to use:**

- Before running migrations in production
- When developing new migrations
- To verify migration scripts

---

### Monitoring Script

#### `monitor.sh`

**Purpose:** Continuous monitoring of application health

**Usage:**

```bash
# Run manually
./scripts/monitor.sh

# Or add to crontab for automatic monitoring
*/5 * * * * /var/www/booking-system/backend/scripts/monitor.sh
```

**What it monitors:**

- Application health endpoint
- Calendar integration health
- HubSpot integration health

**Actions:**

- Logs status to file
- Sends email alerts on failures

**When to use:**

- In production environments
- For continuous monitoring
- As part of alerting system

---

## Script Dependencies

All scripts require:

- Node.js 16+
- TypeScript (`ts-node`)
- Environment variables configured
- Database accessible (for database scripts)

## Running Scripts

### From npm

Most scripts have npm script aliases:

```bash
npm run validate:deployment    # Run full deployment validation
npm run test:google-calendar   # Test Google Calendar
npm run test:hubspot          # Test HubSpot
npm run validate:schema       # Validate database schema
```

### Directly with ts-node

```bash
ts-node scripts/validate-deployment.ts
ts-node scripts/test-google-calendar.ts
ts-node scripts/test-hubspot.ts
```

### With environment variables

```bash
# Load specific environment
export $(cat .env.production | xargs)
npm run validate:deployment
```

## Exit Codes

All scripts follow standard exit code conventions:

- `0` - Success
- `1` - Failure or validation error

This allows scripts to be used in CI/CD pipelines:

```bash
npm run validate:deployment && npm run build && pm2 restart booking-api
```

## Troubleshooting

### Script won't run

**Check permissions:**

```bash
chmod +x scripts/*.sh
```

**Check Node.js version:**

```bash
node --version  # Should be 16+
```

**Check dependencies:**

```bash
npm install
```

### Validation fails

**Check environment variables:**

```bash
npm run validate:config
```

**Check logs:**

```bash
cat logs/error-*.log
```

**Run individual tests:**

```bash
npm run test:google-calendar
npm run test:hubspot
```

### Database scripts fail

**Check database connection:**

```bash
psql $DATABASE_URL
```

**Check Prisma setup:**

```bash
npx prisma generate
npx prisma migrate status
```

## Best Practices

1. **Always run validation before deployment:**

   ```bash
   npm run validate:deployment
   ```

2. **Test integrations individually when troubleshooting:**

   ```bash
   npm run test:google-calendar
   npm run test:hubspot
   ```

3. **Use scripts in CI/CD pipelines:**

   ```yaml
   # Example GitHub Actions
   - name: Validate deployment
     run: npm run validate:deployment
   ```

4. **Monitor continuously in production:**

   ```bash
   # Add to crontab
   */5 * * * * /path/to/scripts/monitor.sh
   ```

5. **Keep scripts updated:**
   - Update when adding new integrations
   - Add new validation checks as needed
   - Document changes in this README

## Adding New Scripts

When adding new validation or test scripts:

1. **Create the script** in this directory
2. **Add npm script** in `package.json`
3. **Document it** in this README
4. **Add to deployment checklist** if applicable
5. **Test thoroughly** before committing

## Related Documentation

- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md)
- [Rollback Plan](../ROLLBACK_PLAN.md)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)
- [Integration Setup](../INTEGRATION_SETUP.md)

---

**Last Updated:** [Date]  
**Maintained By:** [Team/Person]
