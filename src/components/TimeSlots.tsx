import React from "react";
import { cn } from "../lib/utils";
import {
  DayAvailability,
  DateOverride,
  Booking,
  getAvailableTimeSlots,
} from "../services/availabilityService";

interface TimeSlotsProps {
  selectedDate: Date;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  onConfirm: () => void;
  is24Hour: boolean;
  weeklyHours: DayAvailability[];
  overrides: DateOverride[];
  bookings: Booking[];
  duration: number;
  timeIncrement?: number;
  hostTimezone?: string;
  inviteeTimezone: string;
  minimumNotice?: number;
}

export const TimeSlots: React.FC<TimeSlotsProps> = ({
  selectedDate,
  selectedTime,
  onTimeSelect,
  onConfirm,
  is24Hour,
  weeklyHours,
  overrides,
  bookings,
  duration,
  timeIncrement,
  hostTimezone = "UTC",
  inviteeTimezone,
  minimumNotice = 0,
}) => {
  const slots = React.useMemo(() => {
    return getAvailableTimeSlots({
      selectedDate,
      is24Hour,
      weeklyHours,
      overrides,
      bookings,
      duration,
      timeIncrement,
      hostTimezone,
      inviteeTimezone,
      minimumNotice,
    });
  }, [
    selectedDate,
    weeklyHours,
    overrides,
    bookings,
    duration,
    is24Hour,
    timeIncrement,
    hostTimezone,
    inviteeTimezone,
    minimumNotice,
  ]);

  if (slots.length === 0) {
    return (
      <div className="text-center py-12 pr-4">
        <p className="text-gray-500">No available time slots for this date.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pb-10 px-4 md:pr-4">
      <div className="space-y-3 max-w-sm mx-auto md:mx-0">
        {slots.map((slot) => {
          const isSelected = selectedTime === slot.label;

          return (
            <div
              key={slot.label}
              className={cn(
                "time-slot-row",
                isSelected && "time-slot-row-selected",
              )}
            >
              <button
                onClick={() => onTimeSelect(slot.label)}
                className={cn(
                  "py-3 px-4 border border-[1px] rounded-sm font-bold text-sm transition-all min-w-0",
                  isSelected
                    ? "bg-gray-500 border-gray-500 text-white"
                    : "border-blue-400 text-blue-600 hover:bg-blue-50 hover:shadow-[inset_0_0_0_1.5px_#2563eb]",
                )}
              >
                {slot.label}
              </button>

              <button
                onClick={onConfirm}
                disabled={!isSelected}
                className={cn(
                  "next-button py-3 px-4 bg-blue-600 text-white rounded-sm font-bold text-sm hover:bg-blue-700 transition-colors",
                  !isSelected && "pointer-events-none",
                )}
              >
                Next
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
