import { BookingService } from "../booking.service";
import { BookingRepository } from "../../repositories/booking.repository";
import { NotificationService } from "../notification.service";
import { CalendarService } from "../calendar.service";
import { CRMService } from "../crm.service";
import { FrequencyLimitError } from "../../errors/FrequencyLimitError";
import { PrismaClient } from "@prisma/client";
import { fail } from "assert";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { it } from "zod/v4/locales";
import { describe } from "node:test";
import { it } from "zod/v4/locales";
import { describe } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";

// Mock the config module
jest.mock("../../config", () => ({
  config: {
    bookingRules: {
      maxBookingsPerEmail: 2,
      frequencyWindowDays: 30,
    },
    googleCalendar: {
      enabled: false,
    },
    hubspot: {
      enabled: false,
    },
  },
}));

describe("BookingService - Frequency Limit Checking", () => {
  let bookingService: BookingService;
  let mockBookingRepository: jest.Mocked<BookingRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockCalendarService: jest.Mocked<CalendarService>;
  let mockCRMService: jest.Mocked<CRMService>;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    // Create mock instances
    mockBookingRepository = {
      countByEmailInWindow: jest.fn(),
    } as any;

    mockNotificationService = {} as any;
    mockCalendarService = {} as any;
    mockCRMService = {} as any;
    mockPrisma = {} as any;

    // Create service instance
    bookingService = new BookingService(
      mockBookingRepository,
      mockNotificationService,
      mockCalendarService,
      mockCRMService,
      mockPrisma
    );
  });

  describe("getBookingCountForEmail", () => {
    it("should return the count of bookings for an email", async () => {
      const email = "test@example.com";
      const days = 30;
      const expectedCount = 1;

      mockBookingRepository.countByEmailInWindow.mockResolvedValue(
        expectedCount
      );

      const result = await bookingService.getBookingCountForEmail(email, days);

      expect(result).toBe(expectedCount);
      expect(mockBookingRepository.countByEmailInWindow).toHaveBeenCalledWith(
        email,
        days
      );
    });
  });

  describe("checkFrequencyLimit", () => {
    it("should not throw error when booking count is below limit", async () => {
      const email = "test@example.com";
      mockBookingRepository.countByEmailInWindow.mockResolvedValue(1);

      await expect(
        bookingService.checkFrequencyLimit(email)
      ).resolves.not.toThrow();
    });

    it("should throw FrequencyLimitError when booking count equals limit", async () => {
      const email = "test@example.com";
      mockBookingRepository.countByEmailInWindow.mockResolvedValue(2);

      await expect(bookingService.checkFrequencyLimit(email)).rejects.toThrow(
        FrequencyLimitError
      );
    });

    it("should throw FrequencyLimitError when booking count exceeds limit", async () => {
      const email = "test@example.com";
      mockBookingRepository.countByEmailInWindow.mockResolvedValue(3);

      await expect(bookingService.checkFrequencyLimit(email)).rejects.toThrow(
        FrequencyLimitError
      );
    });

    it("should throw FrequencyLimitError with correct message", async () => {
      const email = "test@example.com";
      mockBookingRepository.countByEmailInWindow.mockResolvedValue(2);

      try {
        await bookingService.checkFrequencyLimit(email);
        fail("Should have thrown FrequencyLimitError");
      } catch (error) {
        expect(error).toBeInstanceOf(FrequencyLimitError);
        expect((error as FrequencyLimitError).message).toBe(
          "Maximum 2 bookings per 30 days exceeded"
        );
        expect((error as FrequencyLimitError).statusCode).toBe(429);
      }
    });
  });
});
