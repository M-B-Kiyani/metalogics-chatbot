import React, { useState, useEffect } from "react";
import { WidgetConfig } from "../config";
import Loader from "./Loader";

interface BookingModalProps {
  config: WidgetConfig;
  isOpen: boolean;
  onClose: () => void;
  brandColor: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
}

interface BookingFormData {
  name: string;
  email: string;
  company: string;
  inquiry: string;
  phone?: string;
}

const BookingModal: React.FC<BookingModalProps> = ({
  config,
  isOpen,
  onClose,
  brandColor,
}) => {
  const [step, setStep] = useState<"slots" | "details" | "success">("slots");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [duration, setDuration] = useState<number>(30);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    company: "",
    inquiry: "General Inquiry",
    phone: "",
  });

  // Fetch slots
  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculate start and end date (1 day range for simplicity, or maybe 3 days)
      const startDateObj = new Date(selectedDate);
      const endDateObj = new Date(selectedDate);
      endDateObj.setDate(endDateObj.getDate() + 1); // +1 day to cover the selected date

      const startDateStr = startDateObj.toISOString();
      const endDateStr = endDateObj.toISOString();

      const response = await fetch(
        `${config.apiUrl}/api/bookings/available-slots?startDate=${startDateStr}&endDate=${endDateStr}&duration=${duration}`,
        {
          headers: {
            "x-api-key": config.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch slots");
      }

      const data = await response.json();
      if (data.success && data.data.slots) {
        setSlots(data.data.slots);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
      setError("Could not load available slots. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && step === "slots") {
      fetchSlots();
    }
  }, [selectedDate, duration, isOpen]);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep("details");
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiUrl}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
        },
        body: JSON.stringify({
          ...formData,
          timeSlot: {
            startTime: selectedSlot.startTime,
            duration: selectedSlot.duration,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Booking failed");
      }

      setStep("success");
    } catch (err: any) {
      console.error("Booking error:", err);
      setError(err.message || "Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 font-sans">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className="p-4 text-white flex justify-between items-center"
          style={{ backgroundColor: brandColor }}
        >
          <h3 className="font-bold text-lg">Book an Appointment</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {step === "slots" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <div className="flex space-x-2">
                  {[15, 30, 45, 60].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setDuration(dur)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        duration === dur
                          ? "text-white border-transparent"
                          : "text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                      style={
                        duration === dur ? { backgroundColor: brandColor } : {}
                      }
                    >
                      {dur} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Available Slots
                </h4>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader color={brandColor} />
                  </div>
                ) : error ? (
                  <p className="text-red-500 text-sm">{error}</p>
                ) : slots.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    No slots available for this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot, idx) => {
                      const timeString = new Date(
                        slot.startTime
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSlotSelect(slot)}
                          className="p-2 border border-gray-200 rounded hover:bg-gray-50 text-sm text-center transition-colors"
                        >
                          {timeString}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "details" && selectedSlot && (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-semibold text-gray-700">Selected Slot:</p>
                <p>
                  {new Date(selectedSlot.startTime).toLocaleDateString()} at{" "}
                  {new Date(selectedSlot.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>{selectedSlot.duration} minutes</p>
                <button
                  type="button"
                  onClick={() => setStep("slots")}
                  className="text-xs underline mt-1 text-blue-600 hover:text-blue-800"
                >
                  Change Slot
                </button>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inquiry *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.inquiry}
                  onChange={(e) =>
                    setFormData({ ...formData, inquiry: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 text-white font-medium rounded-md shadow-sm hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: brandColor }}
                >
                  {loading ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          )}

          {step === "success" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Booking Confirmed!
              </h3>
              <p className="text-gray-600">
                We have sent a confirmation email to {formData.email}.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
