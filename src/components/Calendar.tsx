import React from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isBefore,
  startOfToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Globe, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { TimeZoneSelector } from "./TimeZoneSelector";

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
  is24Hour: boolean;
  onFormatToggle: (is24Hour: boolean) => void;
  isDateAvailable?: (date: Date) => boolean;
  isTimezoneLocked?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  timezone,
  onTimezoneChange,
  is24Hour,
  onFormatToggle,
  isDateAvailable,
  isTimezoneLocked,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [isSelectorOpen, setIsSelectorOpen] = React.useState(false);
  const [now, setNow] = React.useState(new Date());
  const today = startOfToday();

  // Update the clock every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000); // Check every 10 seconds for better responsiveness
    return () => clearInterval(timer);
  }, []);

  const getTimezoneLabel = (tz: string) => {
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "numeric",
      hour12: !is24Hour,
    });

    const nameFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "long",
    });

    const time = timeFormatter.format(now);
    const parts = nameFormatter.formatToParts(now);
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value || tz;

    return `${tzName} (${time})`;
  };

  const renderHeader = () => {
    const isFirstMonth = isSameMonth(currentMonth, new Date());
    return (
      <div className="flex items-center justify-center gap-6 mb-8 px-4">
        <button
          disabled={isFirstMonth}
          onClick={() =>
            !isFirstMonth && setCurrentMonth(subMonths(currentMonth, 1))
          }
          className={cn(
            "p-2 rounded-full transition-colors",
            isFirstMonth
              ? "cursor-not-allowed text-slate-500"
              : "text-blue-600 bg-blue-50 hover:bg-blue-100",
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-medium text-slate-800">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors text-blue-600"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-bold text-gray-500 tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isPast = isBefore(day, today);
        const isToday = isSameDay(day, today);
        const isAvailable = isDateAvailable ? isDateAvailable(day) : true;

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "relative flex items-center justify-center h-11 w-11 mx-auto rounded-full cursor-pointer transition-all text-sm font-bold",
              !isCurrentMonth && "text-transparent pointer-events-none",
              isCurrentMonth &&
                !isPast &&
                isAvailable &&
                !isSelected &&
                "text-blue-600 bg-blue-50 hover:bg-blue-100",
              (isPast || !isAvailable) &&
                isCurrentMonth &&
                "text-gray-400 cursor-default",
              isSelected &&
                "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
            )}
            onClick={() =>
              isCurrentMonth && !isPast && isAvailable && onDateSelect(cloneDay)
            }
          >
            <span>{formattedDate}</span>
            {isToday && !isSelected && isCurrentMonth && (
              <div className="absolute bottom-1.5 w-1 h-1 bg-blue-600 rounded-full" />
            )}
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 mb-1" key={day.toString()}>
          {days}
        </div>,
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="w-full max-w-md relative">
      {renderHeader()}
      {renderDays()}
      {renderCells()}

      <div className="mt-8 px-4">
        <h4 className="text-sm font-bold text-slate-900 mb-3">Time zone</h4>
        <button
          onClick={() => !isTimezoneLocked && setIsSelectorOpen(true)}
          className={cn(
            "flex items-center gap-2 text-slate-700 transition-colors group",
            isTimezoneLocked ? "cursor-default" : "hover:text-slate-900",
          )}
        >
          <Globe className="w-5 h-5 text-slate-900" />
          <span
            className={cn(
              "text-sm font-medium border-b border-transparent",
              !isTimezoneLocked && "group-hover:border-slate-900",
            )}
          >
            {getTimezoneLabel(timezone)}
          </span>
          {!isTimezoneLocked && (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          )}
        </button>
      </div>

      <TimeZoneSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        selectedTimezone={timezone}
        onSelect={onTimezoneChange}
        is24Hour={is24Hour}
        onToggleFormat={onFormatToggle}
      />
    </div>
  );
};
