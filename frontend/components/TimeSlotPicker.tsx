import React, { useState, useEffect } from "react";
import { TimeSlot } from "../types";
import {
  getAvailableSlots,
  ApiError,
  BusinessHours,
} from "../services/bookingApiService";

interface TimeSlotPickerProps {
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedSlot,
  onSelectSlot,
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<15 | 30 | 45 | 60>(
    30
  );

  const fetchAvailableSlots = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch slots for the next 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const data = await getAvailableSlots(
        startDate,
        endDate,
        selectedDuration
      );

      // Convert API slots to TimeSlot format
      const slots: TimeSlot[] = data.slots.map((slot) => ({
        startTime: new Date(slot.startTime),
        duration: slot.duration as 15 | 30 | 45 | 60,
      }));

      setTimeSlots(slots);
      setBusinessHours(data.businessHours);
    } catch (err) {
      console.error("Error fetching available slots:", err);

      if (err instanceof ApiError) {
        if (err.errorCode === "NETWORK_ERROR") {
          setError(
            "Unable to connect to the booking service. Please check your internet connection."
          );
        } else {
          setError(`Failed to load available slots: ${err.message}`);
        }
      } else {
        setError("An unexpected error occurred while loading available slots.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDuration]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatBusinessHours = () => {
    if (!businessHours) return "";

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayNames = businessHours.daysOfWeek.map((d) => days[d]).join(", ");

    const formatHour = (hour: number) => {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}${period}`;
    };

    return `${dayNames} • ${formatHour(businessHours.startHour)} - ${formatHour(
      businessHours.endHour
    )}`;
  };

  return (
    <div className="space-y-3">
      {/* Duration selector */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Meeting Duration
        </label>
        <div className="flex gap-2">
          {[15, 30, 45, 60].map((duration) => (
            <button
              key={duration}
              type="button"
              onClick={() => setSelectedDuration(duration as 15 | 30 | 45 | 60)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors border ${
                selectedDuration === duration
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {duration} min
            </button>
          ))}
        </div>
      </div>

      {/* Business hours info */}
      {businessHours && (
        <div className="text-xs text-slate-400 bg-slate-900/50 px-3 py-2 rounded-md border border-slate-700">
          <span className="font-medium">Business Hours:</span>{" "}
          {formatBusinessHours()}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center p-8 bg-slate-900 rounded-md border border-slate-700">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
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
            <p className="text-slate-400 text-sm">Loading available slots...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md">
          <p className="text-sm mb-2">{error}</p>
          <button
            type="button"
            onClick={fetchAvailableSlots}
            className="text-xs bg-red-800 hover:bg-red-700 px-3 py-1 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Time slots grid */}
      {!isLoading && !error && (
        <div className="max-h-60 overflow-y-auto bg-slate-900 p-2 rounded-md border border-slate-700">
          {timeSlots.length === 0 && (
            <p className="text-slate-400 text-center p-4">
              No available slots found for the selected duration. Try a
              different duration or check back later.
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {timeSlots.map((slot, index) => {
              const isSelected =
                selectedSlot?.startTime.getTime() ===
                  slot.startTime.getTime() &&
                selectedSlot?.duration === slot.duration;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={`p-2 rounded-md text-sm text-center transition-colors border ${
                    isSelected
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="font-semibold">
                    {formatDate(slot.startTime)}
                  </div>
                  <div>{formatTime(slot.startTime)}</div>
                  <div className="text-xs text-slate-400">
                    {slot.duration} min
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;
