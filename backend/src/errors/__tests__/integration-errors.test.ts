import {
  CalendarError,
  CalendarAuthError,
  CRMError,
  CRMAuthError,
  FrequencyLimitError,
} from "../index";

describe("Integration Error Classes", () => {
  describe("CalendarError", () => {
    it("should create CalendarError with correct properties", () => {
      const message = "Failed to create calendar event";
      const error = new CalendarError(message);

      expect(error).toBeInstanceOf(CalendarError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(503);
      expect(error.errorCode).toBe("CALENDAR_ERROR");
      expect(error.isOperational).toBe(true);
    });

    it("should preserve original error stack", () => {
      const originalError = new Error("Original error");
      const error = new CalendarError("Wrapper error", originalError);

      expect(error.originalError).toBe(originalError);
      expect(error.stack).toContain("Caused by:");
    });
  });

  describe("CalendarAuthError", () => {
    it("should create CalendarAuthError with correct properties", () => {
      const message = "Authentication failed";
      const error = new CalendarAuthError(message);

      expect(error).toBeInstanceOf(CalendarAuthError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe("CALENDAR_AUTH_ERROR");
      expect(error.isOperational).toBe(true);
    });

    it("should use default message when none provided", () => {
      const error = new CalendarAuthError();

      expect(error.message).toBe("Google Calendar authentication failed");
    });
  });

  describe("CRMError", () => {
    it("should create CRMError with correct properties", () => {
      const message = "Failed to create contact";
      const error = new CRMError(message);

      expect(error).toBeInstanceOf(CRMError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(503);
      expect(error.errorCode).toBe("CRM_ERROR");
      expect(error.isOperational).toBe(true);
    });

    it("should preserve original error stack", () => {
      const originalError = new Error("Original error");
      const error = new CRMError("Wrapper error", originalError);

      expect(error.originalError).toBe(originalError);
      expect(error.stack).toContain("Caused by:");
    });
  });

  describe("CRMAuthError", () => {
    it("should create CRMAuthError with correct properties", () => {
      const message = "Invalid access token";
      const error = new CRMAuthError(message);

      expect(error).toBeInstanceOf(CRMAuthError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe("CRM_AUTH_ERROR");
      expect(error.isOperational).toBe(true);
    });

    it("should use default message when none provided", () => {
      const error = new CRMAuthError();

      expect(error.message).toBe("HubSpot CRM authentication failed");
    });
  });

  describe("FrequencyLimitError", () => {
    it("should create FrequencyLimitError with correct properties", () => {
      const maxBookings = 2;
      const windowDays = 30;
      const error = new FrequencyLimitError(maxBookings, windowDays);

      expect(error).toBeInstanceOf(FrequencyLimitError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Maximum 2 bookings per 30 days exceeded");
      expect(error.statusCode).toBe(429);
      expect(error.errorCode).toBe("FREQUENCY_LIMIT_EXCEEDED");
      expect(error.isOperational).toBe(true);
    });

    it("should format message correctly with different values", () => {
      const error = new FrequencyLimitError(5, 7);

      expect(error.message).toBe("Maximum 5 bookings per 7 days exceeded");
    });
  });
});
