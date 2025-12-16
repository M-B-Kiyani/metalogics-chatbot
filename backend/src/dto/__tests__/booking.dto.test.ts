import {
  createBookingSchema,
  updateBookingSchema,
  bookingFiltersSchema,
  updateBookingStatusSchema,
} from "../booking.dto";
import { BookingStatus } from "@prisma/client";

describe("Booking DTO Validation Schemas", () => {
  describe("createBookingSchema", () => {
    it("should validate a valid booking", () => {
      const validBooking = {
        name: "John Doe",
        company: "Acme Corp",
        email: "john@acme.com",
        phone: "+1-555-123-4567",
        inquiry: "I need help with AI integration",
        timeSlot: {
          startTime: new Date("2024-12-01T10:00:00Z"),
          duration: 30,
        },
      };

      const result = createBookingSchema.safeParse(validBooking);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidBooking = {
        name: "John Doe",
        company: "Acme Corp",
        email: "invalid-email",
        inquiry: "Test inquiry",
        timeSlot: {
          startTime: new Date(),
          duration: 30,
        },
      };

      const result = createBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
    });

    it("should reject invalid duration", () => {
      const invalidBooking = {
        name: "John Doe",
        company: "Acme Corp",
        email: "john@acme.com",
        inquiry: "Test inquiry",
        timeSlot: {
          startTime: new Date(),
          duration: 25, // Invalid duration
        },
      };

      const result = createBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
    });

    it("should accept valid phone formats", () => {
      const phoneFormats = [
        "+1-555-123-4567",
        "555-123-4567",
        "(555) 123-4567",
        "+44 20 1234 5678",
      ];

      phoneFormats.forEach((phone) => {
        const booking = {
          name: "John Doe",
          company: "Acme Corp",
          email: "john@acme.com",
          phone,
          inquiry: "Test inquiry",
          timeSlot: {
            startTime: new Date(),
            duration: 30,
          },
        };

        const result = createBookingSchema.safeParse(booking);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("updateBookingSchema", () => {
    it("should validate partial updates", () => {
      const update = {
        inquiry: "Updated inquiry",
      };

      const result = updateBookingSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should validate timeSlot updates", () => {
      const update = {
        timeSlot: {
          startTime: new Date("2024-12-01T14:00:00Z"),
          duration: 45,
        },
      };

      const result = updateBookingSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  describe("bookingFiltersSchema", () => {
    it("should validate pagination parameters", () => {
      const filters = {
        page: "1",
        limit: "20",
      };

      const result = bookingFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should validate status filter", () => {
      const filters = {
        status: BookingStatus.CONFIRMED,
      };

      const result = bookingFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it("should validate date range filters", () => {
      const filters = {
        dateFrom: "2024-12-01",
        dateTo: "2024-12-31",
      };

      const result = bookingFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });
  });

  describe("updateBookingStatusSchema", () => {
    it("should validate valid status", () => {
      const update = {
        status: BookingStatus.CONFIRMED,
      };

      const result = updateBookingStatusSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const update = {
        status: "INVALID_STATUS",
      };

      const result = updateBookingStatusSchema.safeParse(update);
      expect(result.success).toBe(false);
    });
  });
});
