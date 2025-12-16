import { BookingService } from "../booking.service";
import { BookingRepository } from "../../repositories/booking.repository";
import { NotificationService } from "../notification.service";
import { CalendarService } from "../calendar.service";
import { CRMService } from "../crm.service";
import { FrequencyLimitError } from "../../errors/FrequencyLimitError";
import { PrismaClient, BookingStatus } from "@prisma/client";

// Mock the config module with duration-specific rules
jest.mock("../../config", () => ({
  config: {
    bookingRules: {
      maxBookingsPerEmail: 10,
      frequencyWindowDays: 30,
      durationRules: [
        {
          duration: 15,
          maxBookings: 2,
          windowMinutes: 90, // 90-minute rolling window
        },
        {
          duration: 30,
          maxBookings: 2,
          windowMinutes: 180, // 3-hour rolling window
        },
        {
          duration: 45,
          maxBookings: 2,
          windowMinutes: 300, // 5-hour rolling window
        },
        {
          duration: 60,
          maxBookings: 2,
          windowMinutes: 720, // 12-hour rolling window
        },
      ],
    },
    googleCalendar: {
      enabled: false,
    },
    hubspot: {
      enabled: false,
    },
  },
}));

describe("BookingService - Duration-Specific Frequency Limits", () => {
  let bookingService: BookingService;
  let mockBookingRepository: jest.Mocked<BookingRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockCalendarService: jest.Mocked<CalendarService>;
  let mockCRMService: jest.Mocked<CRMService>;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    // Create mock instances
    mockBookingRepository = {
      findMany: jest.fn(),
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

  describe("15-minute consultations - 90-minute rolling window", () => {
    it("should allow booking when no existing bookings in window", async () => {
      const email = "test@example.com";
      const startTime = new Date("2024-01-15T10:00:00Z");
      const duration = 15;

      mockBookingRepository.findMany.mockResolvedValue([]);

      await expect(
        bookingService.checkDurationFrequencyLimit(email, startTime, duration)
      ).resolves.not.toThrow();
    });

    it("should allow booking when 1 existing booking in window", async () => {
      const email = "test@example.com";
      const startTime = new Date("2024-01-15T10:00:00Z");
      const duration = 15;

      mockBookingRepository.findMany.mockResolvedValue([
        {
          id: "1",
          email,
          startTime: new Date("2024-01-15T09:30:00Z"),
          duration: 15,
          status: BookingStatus.CONFIRMED,
        } as any,
      ]);

      await expect(
        bookingService.checkDurationFrequencyLimit(email, startTime, duration)
      ).resolves.not.toThrow();
    });

    it("should throw error when 2 existing bookings in 90-minute window", async () => {
      const email = "test@example.com";
      const startTime = new Date("2024-01-15T10:00:00Z");
      const duration = 15;

      mockBookingRepository.findMany.mockResolvedValue([
        {
          id: "1",
          email,
          startTime: new Date("2024-01-15T09:00:00Z"),
          duration: 15,
          status: BookingStatus.CONFIRMED,
        } as any,
        {
          id: "2",
          email,
          startTime: new Date("2024-01-15T09:30:00Z"),
          duration: 15,
          status: BookingStatus.CONFIRMED,
        } as any,
      ]);

      await expect(
        bookingService.checkDurationFrequencyLimit(email, startTime, duration)
      ).rejects.toThrow(FrequencyLimitError);
    });

    it("should ignore cancelled bookings", async () => {
      const email = "test@example.com";
      const startTime = new Date("2024-01-15T10:00:00Z");
      const duration = 15;

      mockBookingRepository.findMany.mockResolvedValue([
        {
          id: "1",
          email,
          startTime: new Date("2024-01-15T09:00:00Z"),
          duration: 15,
          status: BookingStatus.CANCELLED,
        } as any,
        {
          id: "2",
          email,
          startTime: new Date("2024-01-15T09:30:00Z"),
          duration: 15,
          status: BookingStatus.CONFIRMED,
        } as any,
      ]);

      await expect(
        bookingService.checkDurationFrequencyLimit(email, startTime, duration)
      ).resolves.not.toThrow();
    });
  });

  describe("30-minute meetings - 3-hour rolling window", () => {
    it("should allow booking when 1 existing booking in window", async () => {
      const email = "test@example.com";
      const startTime = new Date("2024-01-15T10:00:00Z");
      const duration = 30;

      mockBookingRepository.findMany.mockResolvedValue([
        {
          id: "1",
          email,
          startTime: new Date("2024-01-15T08:00:00Z"),
          duration: 30,
          status: BookingStatus.CONFIRMED,
        } as any,
      ]);

      await expect(
        bookingService.checkDurationFrequencyLimit(email, startTime, duration)
      ).resolves.not.toThrow();
    });

    it("should throw error when 2 existing bookings in 3-hour window", async () => {
      const email = "test@example.com";
      const startTime = new Date("2024-01-15T10:00:00Z");
      const duration = 30;

      mockBookingRepository.findMany.mockResolvedValue([
        {
          id: "1",
          email,
          startTime: new Date("2024-01-15T08:00:00Z"),
          duration: 30,
          status: BookingStatus.CONFIRMED,
        } as any,
        {
          id: "2",
          email,
          startTime: new Date("2024-01-15T09:00:00Z"),
          duration: 30,
          status: BookingStatus.CONFIRMED,
        } as any,
      ]);

      await expect(
        bookingService.checkDurationFrequencyLimit(email, startTime, duration)
      ).rejects.toThrow(FrequencyLimitError);
    });
  });

  describe("45-minute meetings - 5-hour rolling window", () => {
    it("should allow booking when 1 existing booking in window", async () => {
      const email = "test@example.com";
      const startTime = new Date("2024-01-15T10:00:00Z");
      const duration = 45;

      mockBookingRepository.findMany.mockResolvedValue([
        {
          id: "1",
          email,
          startTime: new Date("2024-01-15T06:00:00Z"),
          duration: 45,
          status: BookingStatus.CONFIRMED,
        } as any,
      ]);

      await expect(
        bookingService.checkDurationFrequencyLimit(email, startTime, duration)
      ).resolves.not.toThrow();
    });

    it("should throw error when 2 existing bookings in 5-hour window", async () => {
      const email = "test@example.com";
      const startTime = new Date("2024-01-15T10:00:00Z");
      const duration = 45;

      mockBookingRepository.findMany.mockResolvedValue([
        {
          id: "1",
          email,
          startTime: new Date("2024-01-15T06:00:00Z"),
          duration: 45,
          status: BookingStatus.CONFIRMED,
        } as any,
        {
          id: "2",
          email,
          startTime: new Date("2024-01-15T08:00:00Z"),
          duration: 45,
          status: BookingStatus.CONFIRMED,
        } as any,
      ]);

      await expect(
        bookingService.checkDurationFrequencyLimit(email, startTime, duration)
      ).rejects.toThrow(FrequencyLimitError);
    });
  });

  describe("60-minute meetings - 12-hour rolling window", () => {
    it("should allow booking when 1 existing booking in window", async () => {
      const email = "test@example.com";
      const startTime = new Date("2024-01-15T10:00:00Z");
      const duration = 60;

      mockBookingRepository.findMany.mockResolvedValue([
        {
          id: "1",
          email,
          startTime: new Date("2024-01-15T00:00:00Z"),
          duration: 60,
          status: BookingStatus.CONFIRMED,
        } as any,
      ]);

      await expect(
        bookingService.checkDurationFrequencyLimit(email, startTime, duration)
      ).resolves.not.toThrow();
    });

    it("should throw error when 2 existing bookings in 12-hour window", async () => {
      const email = "test@example.com";
      const startTime = new Date("2024-01-15T10:00:00Z");
      const duration = 60;

      mockBookingRepository.findMany.mockResolvedValue([
        {
          id: "1",
          email,
          startTime: new Date("2024-01-15T00:00:00Z"),
          duration: 60,
          status: BookingStatus.CONFIRMED,
        } as any,
        {
          id: "2",
          email,
          startTime: new Date("2024-01-15T06:00:00Z"),
          duration: 60,
          status: BookingStatus.CONFIRMED,
        } as any,
      ]);

      await expect(
        bookingService.checkDurationFrequencyLimit(email, startTime, duration)
      ).rejects.toThrow(FrequencyLimitError);
    });
  });

  describe("Different durations don't interfere", () => {
    it("should not count 30-minute bookings when checking 15-minute limit", async () => {
      const email = "test@example.com";
      const startTime = new Date("2024-01-15T10:00:00Z");
      const duration = 15;

      mockBookingRepository.findMany.mockResolvedValue([
        {
          id: "1",
          email,
          startTime: new Date("2024-01-15T09:00:00Z"),
          duration: 30, // Different duration
          status: BookingStatus.CONFIRMED,
        } as any,
        {
          id: "2",
          email,
          startTime: new Date("2024-01-15T09:30:00Z"),
          duration: 30, // Different duration
          status: BookingStatus.CONFIRMED,
        } as any,
      ]);

      await expect(
        bookingService.checkDurationFrequencyLimit(email, startTime, duration)
      ).resolves.not.toThrow();
    });
  });
});
