#!/usr/bin/env node

/**
 * Check what tables should exist and provide SQL to create them manually if needed
 */

console.log("🔍 Database Tables Analysis\n");

console.log("📋 Expected Tables from Prisma Schema:");
console.log("   1. Booking - Main bookings table");
console.log("   2. _prisma_migrations - Migration tracking (✅ exists)");

console.log("\n📊 Booking Table Structure (from schema.prisma):");
console.log(`
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "inquiry" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmationSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "calendarEventId" TEXT,
    "crmContactId" TEXT,
    "calendarSynced" BOOLEAN NOT NULL DEFAULT false,
    "crmSynced" BOOLEAN NOT NULL DEFAULT false,
    "requiresManualCalendarSync" BOOLEAN NOT NULL DEFAULT false,
    "requiresManualCrmSync" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- Indexes
CREATE INDEX "Booking_startTime_idx" ON "Booking"("startTime");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_email_idx" ON "Booking"("email");
CREATE INDEX "Booking_calendarEventId_idx" ON "Booking"("calendarEventId");
CREATE INDEX "Booking_crmContactId_idx" ON "Booking"("crmContactId");
CREATE INDEX "Booking_email_createdAt_idx" ON "Booking"("email", "createdAt");
`);

console.log("\n🔧 Solutions:");
console.log("   Option 1: Force Prisma to recreate tables");
console.log("   Option 2: Manual SQL execution in Railway database");
console.log("   Option 3: Reset and re-run migrations");

console.log("\n📋 Next Steps:");
console.log('   1. Check Railway database for "Booking" table');
console.log("   2. If missing, run: npx prisma db push --force-reset");
console.log("   3. Or execute the SQL above manually in Railway database");

console.log("\n🚀 Quick Fix Command for Railway:");
console.log("   In Railway CLI: railway run npx prisma db push --force-reset");
