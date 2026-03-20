import React from 'react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface TimeSlotsProps {
  selectedDate: Date;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  onConfirm: () => void;
  is24Hour: boolean;
}

export const TimeSlots: React.FC<TimeSlotsProps> = ({ 
  selectedDate, 
  selectedTime, 
  onTimeSelect,
  onConfirm,
  is24Hour
}) => {
  // Generate time slots from 12:00am to 11:30pm in 15-minute intervals
  const slots = React.useMemo(() => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (is24Hour) {
          const displayH = h.toString().padStart(2, '0');
          const displayM = m.toString().padStart(2, '0');
          times.push(`${displayH}:${displayM}`);
        } else {
          const period = h < 12 ? 'am' : 'pm';
          const displayH = h % 12 === 0 ? 12 : h % 12;
          const displayM = m === 0 ? '00' : m;
          times.push(`${displayH}:${displayM}${period}`);
        }
      }
    }
    return times;
  }, [is24Hour]);

  return (
    <div className="w-full h-full overflow-y-auto pr-2 custom-scrollbar">
      <h3 className="hidden md:block text-slate-800 font-medium mb-6 sticky top-0 bg-white py-2">
        {format(selectedDate, 'EEEE, MMMM d')}
      </h3>
      
      <div className="space-y-3 max-w-sm mx-auto md:mx-0">
        {slots.map((slot) => {
          const isSelected = selectedTime === slot;
          
          return (
            <div key={slot} className="flex gap-2">
              <button
                onClick={() => onTimeSelect(slot)}
                className={cn(
                  "flex-1 py-3 px-4 border rounded-lg font-bold transition-all text-sm",
                  isSelected 
                    ? "bg-gray-500 border-gray-500 text-white w-1/2" 
                    : "border-blue-200 text-blue-600 hover:border-blue-600 hover:bg-blue-50"
                )}
              >
                {slot}
              </button>
              
              {isSelected && (
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all animate-in fade-in slide-in-from-left-2"
                >
                  Next
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
