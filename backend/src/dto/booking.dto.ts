import { z } from "zod";
import { BookingStatus } from "@prisma/client";

// Custom validators
const emailValidator = z.string().email("Invalid email format");

const phoneValidator = z
  .string()
  .min(1)
  .regex(
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
    "Invalid phone format"
  )
  .optional();

const durationValidator = z
  .number()
  .refine((val) => [15, 30, 45, 60].includes(val), {
    message: "Duration must be 15, 30, 45, or 60 minutes",
  });

// TimeSlot schema
const timeSlotSchema = z.object({
  startTime: z.coerce.date(),
  duration: durationValidator,
});

// CreateBookingDTO schema
export const createBookingSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  company: z
    .string()
    .min(1, "Company is required")
    .max(255, "Company is too long"),
  email: emailValidator,
  phone: phoneValidator,
  inquiry: z.string().min(1, "Inquiry is required"),
  timeSlot: timeSlotSchema,
});

export type CreateBookingDTO = z.infer<typeof createBookingSchema>;

// UpdateBookingDTO schema
export const updateBookingSchema = z.object({
  inquiry: z.string().min(1, "Inquiry cannot be empty").optional(),
  timeSlot: timeSlotSchema.optional(),
});

export type UpdateBookingDTO = z.infer<typeof updateBookingSchema>;

// BookingFilters schema
export const bookingFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  email: emailValidator.optional(),
});

export type BookingFilters = z.infer<typeof bookingFiltersSchema>;

// UpdateBookingStatusDTO schema
export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
});

export type UpdateBookingStatusDTO = z.infer<typeof updateBookingStatusSchema>;

// AvailableSlotsQuery schema
export const availableSlotsQuerySchema = z
  .object({
    startDate: z.string().refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "startDate must be a valid ISO 8601 date string" }
    ),
    endDate: z.string().refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "endDate must be a valid ISO 8601 date string" }
    ),
    duration: z.coerce
      .number()
      .refine((val) => [15, 30, 45, 60].includes(val), {
        message: "duration must be 15, 30, 45, or 60 minutes",
      }),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    },
    { message: "startDate must be before endDate" }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const daysDifference =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return daysDifference <= 30;
    },
    { message: "Date range must not exceed 30 days" }
  );

export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;

// Paginated response type
export interface PaginatedBookings<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
