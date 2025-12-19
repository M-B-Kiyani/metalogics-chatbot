import React, { useState } from "react";
import { BookingDetails, TimeSlot } from "../types";
import TimeSlotPicker from "./TimeSlotPicker";
import { createBooking, ApiError } from "../services/bookingApiService";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: BookingDetails) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [details, setDetails] = useState<Omit<BookingDetails, "timeSlot">>({
    name: "",
    company: "",
    email: "",
    phone: "",
    inquiry: "",
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTimeSlot) {
      setError("Please select a time slot.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bookingData: BookingDetails = {
        ...details,
        timeSlot: selectedTimeSlot,
      };

      // Call the backend API to create the booking
      const createdBooking = await createBooking(bookingData);

      console.log("Booking created successfully:", createdBooking);

      // Call the parent onSubmit handler to update the chat
      onSubmit(bookingData);

      // Reset form
      setDetails({ name: "", company: "", email: "", phone: "", inquiry: "" });
      setSelectedTimeSlot(null);
      setError(null);
    } catch (err) {
      console.error("Error creating booking:", err);

      if (err instanceof ApiError) {
        // Handle specific API errors
        if (err.errorCode === "VALIDATION_ERROR") {
          setError(`Validation error: ${err.message}`);
        } else if (err.errorCode === "CONFLICT") {
          setError(
            "This time slot is no longer available. Please select another time."
          );
        } else if (err.errorCode === "NETWORK_ERROR") {
          setError(
            "Unable to connect to the booking service. Please check your internet connection."
          );
        } else {
          setError(`Booking failed: ${err.message}`);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 text-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold">Book a Consultation</h2>
          <p className="text-slate-400">
            Please fill out your details and select a time.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={details.name}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={details.company}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-2"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={details.email}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={details.phone}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-2"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="inquiry"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Inquiry Details
              </label>
              <textarea
                id="inquiry"
                name="inquiry"
                value={details.inquiry}
                onChange={handleChange}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2"
              ></textarea>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                Select a Time Slot
              </h3>
              <TimeSlotPicker
                onSelectSlot={setSelectedTimeSlot}
                selectedSlot={selectedTimeSlot}
              />
            </div>
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md">
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </form>
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/80 backdrop-blur-sm sticky bottom-0">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            type="submit"
            className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={
              !selectedTimeSlot ||
              !details.name ||
              !details.email ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              "Confirm Booking"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
