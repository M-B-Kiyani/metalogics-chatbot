/**
 * Booking API Service
 * Handles all HTTP requests to the backend booking API
 */

import { BookingDetails } from "../types";

// API Response types matching backend
export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string;
    errorCode: string;
    details?: any;
    timestamp: string;
  };
}

export interface Booking {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  inquiry: string;
  startTime: string;
  duration: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  confirmationSent: boolean;
  reminderSent: boolean;
}

// API Client Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const API_KEY = import.meta.env.VITE_API_KEY;

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Creates a booking via the backend API
 * @param bookingDetails - The booking information from the form
 * @returns Promise with the created booking data
 * @throws ApiError if the request fails
 */
export async function createBooking(
  bookingDetails: BookingDetails
): Promise<Booking> {
  try {
    // Validate that we have a time slot
    if (!bookingDetails.timeSlot) {
      throw new Error("Time slot is required");
    }

    const requestBody = {
      name: bookingDetails.name,
      company: bookingDetails.company,
      email: bookingDetails.email,
      phone: bookingDetails.phone || undefined,
      inquiry: bookingDetails.inquiry,
      timeSlot: {
        startTime: bookingDetails.timeSlot.startTime.toISOString(),
        duration: bookingDetails.timeSlot.duration,
      },
    };

    console.log("Sending booking request:", requestBody);

    const response = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle error response
      const errorData = data as ErrorResponse;
      console.error("Booking API error:", errorData);
      throw new ApiError(
        errorData.error.statusCode,
        errorData.error.errorCode,
        errorData.error.message,
        errorData.error.details
      );
    }

    // Handle success response
    const successData = data as SuccessResponse<Booking>;
    return successData.data;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors or other unexpected errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        503,
        "NETWORK_ERROR",
        "Unable to connect to the booking service. Please check your internet connection and try again."
      );
    }

    // Handle other unexpected errors
    throw new ApiError(
      500,
      "UNKNOWN_ERROR",
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
}

/**
 * Retrieves a booking by ID
 * @param bookingId - The unique booking identifier
 * @returns Promise with the booking data
 * @throws ApiError if the request fails
 */
export async function getBookingById(bookingId: string): Promise<Booking> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new ApiError(
        errorData.error.statusCode,
        errorData.error.errorCode,
        errorData.error.message,
        errorData.error.details
      );
    }

    const successData = data as SuccessResponse<Booking>;
    return successData.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        503,
        "NETWORK_ERROR",
        "Unable to connect to the booking service. Please check your internet connection and try again."
      );
    }

    throw new ApiError(
      500,
      "UNKNOWN_ERROR",
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
}

/**
 * Available time slot from the API
 */
export interface AvailableSlot {
  startTime: string;
  endTime: string;
  duration: number;
}

/**
 * Business hours configuration
 */
export interface BusinessHours {
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  timeZone: string;
}

/**
 * Available slots response data
 */
export interface AvailableSlotsData {
  slots: AvailableSlot[];
  businessHours: BusinessHours;
}

/**
 * Retrieves available time slots for booking
 * @param startDate - Start date for the range
 * @param endDate - End date for the range
 * @param duration - Duration in minutes (15, 30, 45, or 60)
 * @returns Promise with available slots and business hours
 * @throws ApiError if the request fails
 */
export async function getAvailableSlots(
  startDate: Date,
  endDate: Date,
  duration: 15 | 30 | 45 | 60
): Promise<AvailableSlotsData> {
  try {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration: duration.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/bookings/available-slots?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new ApiError(
        errorData.error.statusCode,
        errorData.error.errorCode,
        errorData.error.message,
        errorData.error.details
      );
    }

    const successData = data as SuccessResponse<AvailableSlotsData>;
    return successData.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        503,
        "NETWORK_ERROR",
        "Unable to connect to the booking service. Please check your internet connection and try again."
      );
    }

    throw new ApiError(
      500,
      "UNKNOWN_ERROR",
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
}
