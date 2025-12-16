/**
 * DTO and validation schema exports
 * Centralized export point for all DTOs and Zod schemas
 */

export {
  createBookingSchema,
  updateBookingSchema,
  bookingFiltersSchema,
  updateBookingStatusSchema,
  type CreateBookingDTO,
  type UpdateBookingDTO,
  type BookingFilters,
  type UpdateBookingStatusDTO,
  type PaginatedBookings,
} from "./booking.dto";
