/**
 * Configuration Validator Tests
 */

import fs from "fs";
import {
  validateGoogleCalendarConfig,
  validateHubSpotConfig,
  validateBusinessHoursConfig,
  validateAllConfig,
} from "../configValidator";
import { config } from "../../config";

// Mock fs module
jest.mock("fs");
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock config module
jest.mock("../../config", () => ({
  config: {
    googleCalendar: {
      enabled: false,
      serviceAccountEmail: "",
      serviceAccountKeyPath: "",
      calendarId: "primary",
      timeZone: "Europe/London",
      retryAttempts: 3,
      retryDelay: 1000,
    },
    hubspot: {
      enabled: false,
      accessToken: "",
      retryAttempts: 3,
      retryDelay: 1000,
    },
    bookingRules: {
      maxBookingsPerEmail: 2,
      frequencyWindowDays: 30,
      businessHours: {
        daysOfWeek: [1, 2, 3, 4, 5],
        startHour: 9,
        endHour: 17,
        timeZone: "Europe/London",
      },
      bufferMinutes: 15,
      minAdvanceHours: 24,
    },
  },
  isProduction: jest.fn(() => false),
  isDevelopment: jest.fn(() => true),
}));

describe("Configuration Validator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateGoogleCalendarConfig", () => {
    it("should pass when Google Calendar is disabled in development", () => {
      const result = validateGoogleCalendarConfig();
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        "Google Calendar integration is disabled (development mode)"
      );
    });

    it("should fail when enabled but service account email is missing", () => {
      config.googleCalendar.enabled = true;
      config.googleCalendar.serviceAccountEmail = "";

      const result = validateGoogleCalendarConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "GOOGLE_SERVICE_ACCOUNT_EMAIL is required when Google Calendar is enabled"
      );

      config.googleCalendar.enabled = false;
    });

    it("should fail when service account email is invalid", () => {
      config.googleCalendar.enabled = true;
      config.googleCalendar.serviceAccountEmail = "invalid-email";

      const result = validateGoogleCalendarConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "GOOGLE_SERVICE_ACCOUNT_EMAIL must be a valid email address"
      );

      config.googleCalendar.enabled = false;
    });

    it("should fail when service account key path is missing", () => {
      config.googleCalendar.enabled = true;
      config.googleCalendar.serviceAccountEmail = "test@example.com";
      config.googleCalendar.serviceAccountKeyPath = "";

      const result = validateGoogleCalendarConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "GOOGLE_SERVICE_ACCOUNT_KEY_PATH is required when Google Calendar is enabled"
      );

      config.googleCalendar.enabled = false;
    });

    it("should fail when service account key file does not exist", () => {
      config.googleCalendar.enabled = true;
      config.googleCalendar.serviceAccountEmail = "test@example.com";
      config.googleCalendar.serviceAccountKeyPath = "/path/to/key.json";

      mockFs.existsSync.mockReturnValue(false);

      const result = validateGoogleCalendarConfig();
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("not found"))).toBe(true);

      config.googleCalendar.enabled = false;
    });

    it("should fail when service account key file is invalid JSON", () => {
      config.googleCalendar.enabled = true;
      config.googleCalendar.serviceAccountEmail = "test@example.com";
      config.googleCalendar.serviceAccountKeyPath = "/path/to/key.json";

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue("invalid json");

      const result = validateGoogleCalendarConfig();
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("not valid JSON"))).toBe(
        true
      );

      config.googleCalendar.enabled = false;
    });

    it("should fail when service account key is missing required fields", () => {
      config.googleCalendar.enabled = true;
      config.googleCalendar.serviceAccountEmail = "test@example.com";
      config.googleCalendar.serviceAccountKeyPath = "/path/to/key.json";

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({
          type: "service_account",
          project_id: "test-project",
        })
      );

      const result = validateGoogleCalendarConfig();
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("missing required field"))
      ).toBe(true);

      config.googleCalendar.enabled = false;
    });

    it("should pass with valid Google Calendar configuration", () => {
      config.googleCalendar.enabled = true;
      config.googleCalendar.serviceAccountEmail = "test@example.com";
      config.googleCalendar.serviceAccountKeyPath = "/path/to/key.json";

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({
          type: "service_account",
          project_id: "test-project",
          private_key_id: "key-id",
          private_key:
            "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
          client_email: "test@example.com",
          client_id: "123456",
        })
      );

      const result = validateGoogleCalendarConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);

      config.googleCalendar.enabled = false;
    });
  });

  describe("validateHubSpotConfig", () => {
    it("should pass when HubSpot is disabled in development", () => {
      const result = validateHubSpotConfig();
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        "HubSpot CRM integration is disabled (development mode)"
      );
    });

    it("should fail when enabled but access token is missing", () => {
      config.hubspot.enabled = true;
      config.hubspot.accessToken = "";

      const result = validateHubSpotConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "HUBSPOT_ACCESS_TOKEN is required when HubSpot is enabled"
      );

      config.hubspot.enabled = false;
    });

    it("should fail when access token is too short", () => {
      config.hubspot.enabled = true;
      config.hubspot.accessToken = "short";

      const result = validateHubSpotConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "HUBSPOT_ACCESS_TOKEN appears to be too short (minimum 20 characters)"
      );

      config.hubspot.enabled = false;
    });

    it("should fail when access token is a placeholder", () => {
      config.hubspot.enabled = true;
      config.hubspot.accessToken = "your-hubspot-access-token";

      const result = validateHubSpotConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "HUBSPOT_ACCESS_TOKEN appears to be a placeholder value"
      );

      config.hubspot.enabled = false;
    });

    it("should pass with valid HubSpot configuration", () => {
      config.hubspot.enabled = true;
      config.hubspot.accessToken =
        "your_hubspot_access_token_here";

      const result = validateHubSpotConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);

      config.hubspot.enabled = false;
    });
  });

  describe("validateBusinessHoursConfig", () => {
    it("should pass with valid business hours configuration", () => {
      const result = validateBusinessHoursConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when business days is empty", () => {
      const originalDays = config.bookingRules.businessHours.daysOfWeek;
      config.bookingRules.businessHours.daysOfWeek = [];

      const result = validateBusinessHoursConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "BUSINESS_DAYS must contain at least one day"
      );

      config.bookingRules.businessHours.daysOfWeek = originalDays;
    });

    it("should fail when business days contains invalid values", () => {
      const originalDays = config.bookingRules.businessHours.daysOfWeek;
      config.bookingRules.businessHours.daysOfWeek = [1, 2, 7];

      const result = validateBusinessHoursConfig();
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("invalid day"))).toBe(true);

      config.bookingRules.businessHours.daysOfWeek = originalDays;
    });

    it("should fail when start hour is invalid", () => {
      const originalStart = config.bookingRules.businessHours.startHour;
      config.bookingRules.businessHours.startHour = 25;

      const result = validateBusinessHoursConfig();
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("BUSINESS_START_HOUR"))).toBe(
        true
      );

      config.bookingRules.businessHours.startHour = originalStart;
    });

    it("should fail when end hour is invalid", () => {
      const originalEnd = config.bookingRules.businessHours.endHour;
      config.bookingRules.businessHours.endHour = -1;

      const result = validateBusinessHoursConfig();
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("BUSINESS_END_HOUR"))).toBe(
        true
      );

      config.bookingRules.businessHours.endHour = originalEnd;
    });

    it("should fail when start hour >= end hour", () => {
      const originalStart = config.bookingRules.businessHours.startHour;
      const originalEnd = config.bookingRules.businessHours.endHour;
      config.bookingRules.businessHours.startHour = 17;
      config.bookingRules.businessHours.endHour = 9;

      const result = validateBusinessHoursConfig();
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("must be less than"))).toBe(
        true
      );

      config.bookingRules.businessHours.startHour = originalStart;
      config.bookingRules.businessHours.endHour = originalEnd;
    });
  });

  describe("validateAllConfig", () => {
    it("should validate all configuration sections", () => {
      const result = validateAllConfig();
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("warnings");
    });
  });
});
