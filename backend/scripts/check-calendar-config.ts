
import { config } from "../src/config";

console.log("Checking Google Calendar Configuration...");
console.log("GOOGLE_CALENDAR_ENABLED:", config.googleCalendar.enabled);
console.log("GOOGLE_SERVICE_ACCOUNT_KEY_PATH is set:", !!config.googleCalendar.serviceAccountKeyPath);
console.log("GOOGLE_SERVICE_ACCOUNT_KEY_PATH value:", config.googleCalendar.serviceAccountKeyPath ? `'${config.googleCalendar.serviceAccountKeyPath}'` : "<empty>");
console.log("GOOGLE_SERVICE_ACCOUNT_KEY (content) is set:", !!config.googleCalendar.serviceAccountKey);
console.log("GOOGLE_SERVICE_ACCOUNT_KEY (content) length:", config.googleCalendar.serviceAccountKey ? config.googleCalendar.serviceAccountKey.length : 0);
