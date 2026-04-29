import React from 'react';
import { Check, ChevronDown, ChevronUp, Info, Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const CustomSelect: React.FC<{
  label: string;
  value: string;
  options: any[];
  onChange: (val: string) => void;
  showInfo?: boolean;
  hasSearch?: boolean;
  isTimezone?: boolean;
  className?: string;
}> = ({ label, value, options, onChange, showInfo, hasSearch, isTimezone, className }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = hasSearch
    ? options.filter(opt => {
        const text = typeof opt === 'string' ? opt : opt.label;
        return text.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : options;

  const selectedOption = isTimezone
    ? options.find(opt => opt.name === value) || options.find(opt => opt.label === value)
    : value;
  const displayValue = isTimezone ? (selectedOption?.label || value) : value;

  return (
    <div className={cn('space-y-2.5 relative', className)} ref={dropdownRef}>
      <label className="flex items-center gap-1.5 text-sm font-bold text-[#1a1a1a]">
        {label}
        {showInfo && <Info className="w-3.5 h-3.5 text-[#94a3b8] cursor-help" />}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-3 bg-white border rounded-lg text-sm text-[#334155] flex items-center justify-between transition-all outline-none',
          isOpen ? 'border-[#006bff] ring-[1px] ring-[#006bff]' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
        )}
      >
        <span className="truncate">{displayValue}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#006bff]" /> : <ChevronDown className="w-4 h-4 text-[#94a3b8]" />}
      </button>

      {isOpen && (
        <div className={cn(
          'absolute inset-x-0 z-50 mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100',
          (isTimezone || label === 'Country') ? 'bottom-full mb-2' : 'top-full'
        )}>
          {hasSearch && (
            <div className="p-3 border-bottom border-[#f1f5f9]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#006bff] rounded-lg text-sm focus:outline-none ring-1 ring-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className={cn('overflow-y-auto', (isTimezone || label === 'Country') ? 'max-h-[300px]' : 'max-h-[250px]')}>
            {isTimezone && <p className="text-[11px] font-bold text-[#b2b2b2] px-4 py-2 uppercase tracking-tight">Time Zone</p>}
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 italic">No results found</div>
            ) : filteredOptions.map((opt, i) => {
              const optVal = typeof opt === 'string' ? opt : opt.name || opt;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = isTimezone ? opt.name === value : optVal === value;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(optVal);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between hover:bg-[#f8fafc] transition-colors',
                    isSelected ? (isTimezone ? 'bg-[#006bff] text-white' : 'text-[#1a1a1a]') : 'text-[#1a1a1a]'
                  )}
                >
                  <span>{optLabel}</span>
                  <div className="flex items-center gap-4">
                    {isTimezone && <span className={cn(isSelected ? 'text-white' : 'text-[#64748b]')}>{getCurrentTime(opt.offset)}</span>}
                    {isSelected && !isTimezone && <Check className="w-4 h-4 text-[#006bff]" />}
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

const getCurrentTime = (offset: string) => {
  try {
    const now = new Date();
    const parts = offset.match(/([+-])(\d{2}):(\d{2})/);
    if (!parts) return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();

    const [, sign, hours, minutes] = parts;
    const offsetMs = (parseInt(hours) * 60 + parseInt(minutes)) * 60 * 1000 * (sign === '+' ? 1 : -1);
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + offsetMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  } catch {
    return '';
  }
};
