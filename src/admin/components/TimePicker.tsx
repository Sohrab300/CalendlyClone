import React from 'react';
import { cn } from '../../lib/utils';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  isOpen: boolean;
  onClose: () => void;
  minTime?: string;
}

const parseTime = (timeStr: string) => {
  const match = timeStr.match(/^(\d+):(\d+)(am|pm)$/);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3];
  if (period === 'pm' && hours !== 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, isOpen, onClose, minTime }) => {
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const times = React.useMemo(() => {
    const result = [];
    const minMinutes = minTime ? parseTime(minTime) : -1;

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const totalMinutes = hour * 60 + minute;
        if (totalMinutes <= minMinutes) continue;

        const period = hour < 12 ? 'am' : 'pm';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const displayMinute = minute === 0 ? '00' : minute;
        result.push(`${displayHour}:${displayMinute}${period}`);
      }
    }
    return result;
  }, [minTime]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-40 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-[100] scrollbar-thin scrollbar-thumb-slate-200"
    >
      {times.map((time) => (
        <button
          key={time}
          onClick={() => {
            onChange(time);
            onClose();
          }}
          className={cn(
            "w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors",
            value === time ? "bg-slate-100 font-bold text-blue-600" : "text-slate-700"
          )}
        >
          {time}
        </button>
      ))}
    </div>
  );
};
