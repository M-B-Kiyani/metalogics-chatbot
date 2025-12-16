import { config } from "../src/config";

console.log("\n=== Google Calendar Configuration ===");
console.log("Enabled:", config.googleCalendar.enabled);
console.log(
  "Service Account Email:",
  config.googleCalendar.serviceAccountEmail
);
console.log("Calendar ID:", config.googleCalendar.calendarId);
console.log("Timezone:", config.googleCalendar.timeZone);
console.log("Key Path:", config.googleCalendar.serviceAccountKeyPath);
console.log("=====================================\n");
