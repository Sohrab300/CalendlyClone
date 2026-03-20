import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface TimeZoneSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTimezone: string;
  onSelect: (timezone: string) => void;
  is24Hour: boolean;
  onToggleFormat: (is24Hour: boolean) => void;
}

const TIMEZONES = [
  { group: 'US/CANADA', zones: [
    { id: 'America/Los_Angeles', label: 'Pacific Time - US & Canada' },
    { id: 'America/Denver', label: 'Mountain Time - US & Canada' },
    { id: 'America/Chicago', label: 'Central Time - US & Canada' },
    { id: 'America/New_York', label: 'Eastern Time - US & Canada' },
    { id: 'America/Phoenix', label: 'Arizona' },
    { id: 'America/Anchorage', label: 'Alaska' },
    { id: 'Pacific/Honolulu', label: 'Hawaii' },
  ]},
  { group: 'EUROPE', zones: [
    { id: 'Europe/London', label: 'London' },
    { id: 'Europe/Paris', label: 'Paris, Berlin, Rome, Madrid' },
    { id: 'Europe/Istanbul', label: 'Istanbul' },
    { id: 'Europe/Dublin', label: 'Dublin' },
    { id: 'Europe/Amsterdam', label: 'Amsterdam' },
  ]},
  { group: 'ASIA', zones: [
    { id: 'Asia/Kolkata', label: 'India Standard Time' },
    { id: 'Asia/Dubai', label: 'Dubai' },
    { id: 'Asia/Singapore', label: 'Singapore' },
    { id: 'Asia/Tokyo', label: 'Tokyo' },
    { id: 'Asia/Hong_Kong', label: 'Hong Kong' },
    { id: 'Asia/Seoul', label: 'Seoul' },
    { id: 'Asia/Bangkok', label: 'Bangkok' },
  ]},
  { group: 'AUSTRALIA', zones: [
    { id: 'Australia/Sydney', label: 'Sydney' },
    { id: 'Australia/Perth', label: 'Perth' },
    { id: 'Australia/Melbourne', label: 'Melbourne' },
    { id: 'Australia/Brisbane', label: 'Brisbane' },
  ]}
];

export const TimeZoneSelector: React.FC<TimeZoneSelectorProps> = ({
  isOpen,
  onClose,
  selectedTimezone,
  onSelect,
  is24Hour,
  onToggleFormat
}) => {
  const [search, setSearch] = React.useState('');
  const [now, setNow] = React.useState(new Date());

  // Update the clock every minute
  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000); // Check every 10 seconds for better responsiveness
    return () => clearInterval(timer);
  }, [isOpen]);
  
  if (!isOpen) return null;

  const filteredTimezones = TIMEZONES.map(group => ({
    ...group,
    zones: group.zones.filter(z => 
      z.label.toLowerCase().includes(search.toLowerCase()) || 
      z.id.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(group => group.zones.length > 0);

  const getCurrentTime = (tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: !is24Hour
    }).format(now);
  };

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="p-4 border-bottom flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="px-4 py-2 border-b flex items-center justify-between bg-white">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time Zone</span>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
          <button 
            onClick={() => onToggleFormat(false)}
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all",
              !is24Hour ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            am/pm
          </button>
          <button 
            onClick={() => onToggleFormat(true)}
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all",
              is24Hour ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            24h
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredTimezones.map((group) => (
          <div key={group.group}>
            <div className="px-4 py-2 bg-white sticky top-0 z-10">
              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">{group.group}</span>
            </div>
            {group.zones.map((tz) => (
              <button
                key={tz.id}
                onClick={() => {
                  onSelect(tz.id);
                  onClose();
                }}
                className={cn(
                  "w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors text-left",
                  selectedTimezone === tz.id && "bg-blue-50"
                )}
              >
                <span className={cn("text-sm", selectedTimezone === tz.id ? "text-blue-600 font-bold" : "text-gray-700")}>
                  {tz.label}
                </span>
                <span className="text-xs text-gray-500">{getCurrentTime(tz.id)}</span>
              </button>
            ))}
          </div>
        ))}
        {filteredTimezones.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">
            No time zones found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
};
