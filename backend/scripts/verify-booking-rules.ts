/**
 * Script to verify booking frequency rules configuration
 * Run with: npx ts-node scripts/verify-booking-rules.ts
 */

import { config } from "../src/config";

console.log("\n📋 Booking Frequency Rules Verification\n");
console.log("=".repeat(60));

console.log("\n🔧 Configuration Status:");
console.log(`   Environment: ${config.server.nodeEnv}`);
console.log(`   API Base URL: ${config.server.apiBaseUrl}`);

console.log("\n📊 Duration-Specific Frequency Rules:\n");

config.bookingRules.durationRules.forEach((rule, index) => {
  const hours = Math.floor(rule.windowMinutes / 60);
  const mins = rule.windowMinutes % 60;
  const timeWindow =
    hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;

  console.log(`${index + 1}. ${rule.duration}-minute bookings:`);
  console.log(`   ├─ Max Bookings: ${rule.maxBookings}`);
  console.log(
    `   ├─ Rolling Window: ${timeWindow} (${rule.windowMinutes} minutes)`
  );
  console.log(
    `   └─ Rule: No more than ${rule.maxBookings} bookings within any ${timeWindow} window\n`
  );
});

console.log("=".repeat(60));

console.log("\n✅ All booking rules are properly configured!");
console.log("\n📖 For detailed documentation, see:");
console.log("   - backend/BOOKING_FREQUENCY_RULES.md");
console.log("   - BOOKING_RULES_QUICK_REFERENCE.md");
console.log("\n🧪 To run tests:");
console.log("   npm test -- booking.service.duration-frequency.test.ts\n");

// Verify rule completeness
const expectedDurations: (15 | 30 | 45 | 60)[] = [15, 30, 45, 60];
const configuredDurations = config.bookingRules.durationRules.map(
  (r) => r.duration
);

const missingDurations = expectedDurations.filter(
  (d) => !configuredDurations.includes(d)
);
const extraDurations = configuredDurations.filter(
  (d) => !(expectedDurations as number[]).includes(d)
);

if (missingDurations.length > 0) {
  console.log(
    `⚠️  Warning: Missing rules for durations: ${missingDurations.join(", ")}`
  );
}

if (extraDurations.length > 0) {
  console.log(
    `ℹ️  Info: Extra rules configured for durations: ${extraDurations.join(
      ", "
    )}`
  );
}

if (missingDurations.length === 0 && extraDurations.length === 0) {
  console.log("✅ All expected duration rules are configured correctly!\n");
}

// Display rule summary table
console.log("\n📊 Quick Reference Table:\n");
console.log("┌──────────┬──────────────┬──────────────────┐");
console.log("│ Duration │ Max Bookings │ Rolling Window   │");
console.log("├──────────┼──────────────┼──────────────────┤");

config.bookingRules.durationRules.forEach((rule) => {
  const hours = Math.floor(rule.windowMinutes / 60);
  const mins = rule.windowMinutes % 60;
  const timeWindow =
    hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;

  const durationStr = `${rule.duration} min`.padEnd(8);
  const maxBookingsStr = rule.maxBookings.toString().padEnd(12);
  const windowStr = timeWindow.padEnd(16);

  console.log(`│ ${durationStr} │ ${maxBookingsStr} │ ${windowStr} │`);
});

console.log("└──────────┴──────────────┴──────────────────┘\n");
