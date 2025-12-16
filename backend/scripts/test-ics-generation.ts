import {
  generateICS,
  generateCancellationICS,
} from "../src/utils/ics-generator";
import { Booking, BookingStatus } from "@prisma/client";
import { addDays } from "date-fns";

/**
 * Test script to verify ICS generation
 * Run with: npx ts-node scripts/test-ics-generation.ts
 */

console.log("🧪 Testing ICS Generation\n");

// Create a mock booking
const mockBooking: Booking = {
  id: "test-booking-123",
  name: "John Doe",
  company: "Acme Corp",
  email: "john@acme.com",
  phone: "+1-555-0123",
  inquiry:
    "Interested in AI consulting services for our enterprise application.",
  startTime: addDays(new Date(), 2), // 2 days from now
  duration: 30,
  status: BookingStatus.CONFIRMED,
  calendarEventId: null,
  calendarSynced: false,
  requiresManualCalendarSync: false,
  crmContactId: null,
  crmSynced: false,
  requiresManualCrmSync: false,
  confirmationSent: false,
  reminderSent: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

console.log("📋 Mock Booking Details:");
console.log(`   Name: ${mockBooking.name}`);
console.log(`   Company: ${mockBooking.company}`);
console.log(`   Email: ${mockBooking.email}`);
console.log(`   Start Time: ${mockBooking.startTime.toISOString()}`);
console.log(`   Duration: ${mockBooking.duration} minutes`);
console.log();

// Test ICS generation
console.log("✅ Generating ICS file for booking...");
const icsContent = generateICS(mockBooking);
console.log("   ICS file generated successfully!");
console.log(`   Size: ${icsContent.length} bytes`);
console.log();

// Display ICS content
console.log("📄 ICS File Content:");
console.log("─".repeat(80));
console.log(icsContent);
console.log("─".repeat(80));
console.log();

// Test cancellation ICS
console.log("✅ Generating cancellation ICS file...");
const cancellationICS = generateCancellationICS(mockBooking);
console.log("   Cancellation ICS file generated successfully!");
console.log(`   Size: ${cancellationICS.length} bytes`);
console.log();

// Display cancellation ICS content
console.log("📄 Cancellation ICS File Content:");
console.log("─".repeat(80));
console.log(cancellationICS);
console.log("─".repeat(80));
console.log();

// Verify key components
console.log("🔍 Verification:");
const checks = [
  { name: "Contains VCALENDAR", pass: icsContent.includes("BEGIN:VCALENDAR") },
  { name: "Contains VEVENT", pass: icsContent.includes("BEGIN:VEVENT") },
  { name: "Contains UID", pass: icsContent.includes("UID:") },
  { name: "Contains DTSTART", pass: icsContent.includes("DTSTART:") },
  { name: "Contains DTEND", pass: icsContent.includes("DTEND:") },
  { name: "Contains SUMMARY", pass: icsContent.includes("SUMMARY:") },
  { name: "Contains DESCRIPTION", pass: icsContent.includes("DESCRIPTION:") },
  { name: "Contains ORGANIZER", pass: icsContent.includes("ORGANIZER;") },
  { name: "Contains ATTENDEE", pass: icsContent.includes("ATTENDEE;") },
  {
    name: "Contains VALARM (reminder)",
    pass: icsContent.includes("BEGIN:VALARM"),
  },
  {
    name: "Cancellation has METHOD:CANCEL",
    pass: cancellationICS.includes("METHOD:CANCEL"),
  },
  {
    name: "Cancellation has STATUS:CANCELLED",
    pass: cancellationICS.includes("STATUS:CANCELLED"),
  },
];

checks.forEach((check) => {
  const icon = check.pass ? "✅" : "❌";
  console.log(`   ${icon} ${check.name}`);
});

const allPassed = checks.every((check) => check.pass);
console.log();

if (allPassed) {
  console.log("🎉 All checks passed! ICS generation is working correctly.");
  console.log();
  console.log("📧 Next steps:");
  console.log("   1. Restart your backend server");
  console.log("   2. Create a test booking");
  console.log("   3. Check your email for the ICS attachment");
  console.log("   4. Click the attachment to add to your calendar");
} else {
  console.log("⚠️  Some checks failed. Please review the ICS content above.");
}

console.log();
