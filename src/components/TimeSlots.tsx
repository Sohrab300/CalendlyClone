import React from "react";
import { format, addMinutes, parseISO, addDays, isSameDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { cn } from "../lib/utils";
import {
  DayAvailability,
  DateOverride,
  Booking,
  parseTime,
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
  // Generate time slots based on availability and overrides
  const slots = React.useMemo(() => {
    const availableSlots: { label: string; minutes: number }[] = [];
    const increment = timeIncrement || 30;
    const now = new Date();
    const noticeThreshold = addMinutes(now, minimumNotice * 60);

    // We check availability for the host's days that might overlap with the invitee's selected date
    const checkDays = [-1, 0, 1];

    // Normalize selectedDate to start of day in invitee's timezone for comparison
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

    checkDays.forEach((offset) => {
      const hostDate = addDays(selectedDate, offset);
      const dayIndex = hostDate.getDay();
      const dateStr = format(hostDate, "yyyy-MM-dd");

      const override = overrides.find((o) =>
        o.dates.some((d) => format(new Date(d), "yyyy-MM-dd") === dateStr),
      );

      let activeSlots: { start: string; end: string }[] = [];
      if (override) {
        activeSlots = override.slots;
      } else {
        const dayAvailability = weeklyHours.find(
          (h) => h.day_index === dayIndex,
        );
        if (dayAvailability?.enabled) {
          activeSlots = dayAvailability.slots;
        }
      }

      activeSlots.forEach((range) => {
        const startMinutes = parseTime(range.start);
        const endMinutes = parseTime(range.end);

        for (let m = startMinutes; m + duration <= endMinutes; m += increment) {
          // 1. Create a date-time string in the HOST's timezone
          const hostDateTimeStr = `${dateStr} ${Math.floor(m / 60)
            .toString()
            .padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}:00`;

          // 2. Convert host-local time to UTC
          const utcDate = fromZonedTime(hostDateTimeStr, hostTimezone);

          // 3. Convert UTC to INVITEE's timezone
          const inviteeZonedDate = toZonedTime(utcDate, inviteeTimezone);

          // 4. Check if this slot falls on the invitee's selected date
          // We use format to get the YYYY-MM-DD in the invitee's timezone
          const inviteeDateStr = format(inviteeZonedDate, "yyyy-MM-dd");

          if (inviteeDateStr === selectedDateStr) {
            // 5. Check minimum notice
            if (utcDate < noticeThreshold) continue;

            // 6. Format the time for display
            const slotLabel = format(
              inviteeZonedDate,
              is24Hour ? "HH:mm" : "h:mmaaa",
            );

            // 7. Check if slot is booked (bookings are stored in UTC)
            const slotEnd = addMinutes(utcDate, duration);

            const isBooked = bookings.some((booking) => {
              const bStart = parseISO(booking.start_time);
              const bEnd = parseISO(booking.end_time);

              return (
                (utcDate >= bStart && utcDate < bEnd) ||
                (slotEnd > bStart && slotEnd <= bEnd) ||
                (bStart >= utcDate && bStart < slotEnd)
              );
            });

            if (!isBooked) {
              // Store minutes from start of day for sorting
              const inviteeMinutes =
                inviteeZonedDate.getHours() * 60 +
                inviteeZonedDate.getMinutes();
              availableSlots.push({
                label: slotLabel,
                minutes: inviteeMinutes,
              });
            }
          }
        }
      });
    });

    // Sort by minutes and remove duplicates (can happen if host has overlapping slots or across days)
    const uniqueSlots = Array.from(
      new Map(availableSlots.map((s) => [s.label, s])).values(),
    );
    return uniqueSlots.sort((a, b) => a.minutes - b.minutes);
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
    <div className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar pb-10 pr-4">
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
