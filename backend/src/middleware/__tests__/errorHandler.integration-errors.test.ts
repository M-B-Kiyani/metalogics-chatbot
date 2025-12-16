import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../errorHandler.middleware";
import {
  CalendarError,
  CalendarAuthError,
  CRMError,
  CRMAuthError,
  FrequencyLimitError,
} from "../../errors";

describe("Error Handler Middleware - Integration Errors", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
    };
    mockNext = jest.fn();
  });

  describe("CalendarError", () => {
    it("should handle CalendarError correctly", () => {
      const error = new CalendarError("Failed to create event");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          statusCode: 503,
          message: "Failed to create event",
          errorCode: "CALENDAR_ERROR",
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle CalendarError with original error", () => {
      const originalError = new Error("API timeout");
      const error = new CalendarError(
        "Calendar operation failed",
        originalError
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          statusCode: 503,
          message: "Calendar operation failed",
          errorCode: "CALENDAR_ERROR",
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe("CalendarAuthError", () => {
    it("should handle CalendarAuthError correctly", () => {
      const error = new CalendarAuthError("Invalid credentials");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          statusCode: 401,
          message: "Invalid credentials",
          errorCode: "CALENDAR_AUTH_ERROR",
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe("CRMError", () => {
    it("should handle CRMError correctly", () => {
      const error = new CRMError("Failed to create contact");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          statusCode: 503,
          message: "Failed to create contact",
          errorCode: "CRM_ERROR",
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle CRMError with original error", () => {
      const originalError = new Error("Network error");
      const error = new CRMError("CRM operation failed", originalError);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          statusCode: 503,
          message: "CRM operation failed",
          errorCode: "CRM_ERROR",
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe("CRMAuthError", () => {
    it("should handle CRMAuthError correctly", () => {
      const error = new CRMAuthError("Invalid access token");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          statusCode: 401,
          message: "Invalid access token",
          errorCode: "CRM_AUTH_ERROR",
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe("FrequencyLimitError", () => {
    it("should handle FrequencyLimitError correctly", () => {
      const error = new FrequencyLimitError(2, 30);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          statusCode: 429,
          message: "Maximum 2 bookings per 30 days exceeded",
          errorCode: "FREQUENCY_LIMIT_EXCEEDED",
          timestamp: expect.any(String),
        },
      });
    });
  });
});
