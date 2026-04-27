import React from 'react';
import { 
  Search, 
  MoreVertical, 
  ChevronDown, 
  ChevronUp, 
  ArrowUp, 
  ArrowDown, 
  EyeOff,
  UserPlus,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { availabilityService, Booking } from '../../services/availabilityService';
import { supabase } from '../../lib/supabase';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { AddContactSidebar } from './AddContactSidebar';

interface Contact {
  name: string;
  email: string;
  phone: string;
  lastMeeting: string | null;
  nextMeeting: string | null;
  company: string;
  source: string;
  createdOn: string;
  timezone: string;
  jobTitle: string;
  linkedin: string;
  city: string;
  state: string;
  country: string;
}

const ALL_COLUMNS = [
  'Email',
  'Phone number',
  'Last meeting date',
  'Next meeting date',
  'Company',
  'Source',
  'Created on',
  'Time zone',
  'Job title',
  'LinkedIn',
  'City',
  'State',
  'Country'
];

export const ContactsView: React.FC = () => {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>([
    'Email', 'Phone number', 'Last meeting date', 'Next meeting date', 'Company'
  ]);
  const [tempVisibleColumns, setTempVisibleColumns] = React.useState<string[]>([]);
  const [isColumnPopoverOpen, setIsColumnPopoverOpen] = React.useState(false);
  const [isAddSidebarOpen, setIsAddSidebarOpen] = React.useState(false);
  const [activeMenuColumn, setActiveMenuColumn] = React.useState<string | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Contact; direction: 'asc' | 'desc' } | null>(null);

  const popoverRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    loadContacts();
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsColumnPopoverOpen(false);
      }
      // Check if the click was on a menu button to avoid double-toggling
      const isMenuButton = (event.target as HTMLElement).closest('.menu-button');
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && !isMenuButton) {
        setActiveMenuColumn(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const bookings = await availabilityService.getAllBookings(user.id);
      const now = new Date();
      
      // Group by email
      const contactMap = new Map<string, Contact>();
      
      bookings.forEach(booking => {
        const existing = contactMap.get(booking.email);
        const bookingDate = parseISO(booking.start_time);
        
        // Helper to extract phone from custom_answers if column is empty
        const extractFromAnswers = (field: 'phone' | 'company') => {
          if (!booking.custom_answers) return '';
          const answers = Object.values(booking.custom_answers);
          for (const ans of answers) {
            const val = typeof ans === 'string' ? ans : (ans as any)?.value || '';
            if (field === 'phone' && (val.startsWith('+') || /^\d{7,}$/.test(val))) return val;
          }
          return '';
        };

        const phone = booking.mobile_number || extractFromAnswers('phone');
        const company = booking.company_name || extractFromAnswers('company');
        
        if (!existing) {
          contactMap.set(booking.email, {
            name: booking.name,
            email: booking.email,
            phone: phone,
            lastMeeting: isBefore(bookingDate, now) ? booking.start_time : null,
            nextMeeting: isAfter(bookingDate, now) ? booking.start_time : null,
            company: company,
            source: booking.source || '',
            createdOn: booking.created_at || booking.start_time,
            timezone: booking.timezone || '',
            jobTitle: booking.job_title || '',
            linkedin: booking.linkedin || '',
            city: booking.city || '',
            state: booking.state || '',
            country: booking.country || ''
          });
        } else {
          // Update details if they are missing but present in this booking
          if (!existing.phone && phone) existing.phone = phone;
          if (!existing.company && company) existing.company = company;
          if (!existing.timezone && booking.timezone) existing.timezone = booking.timezone;
          if (!existing.jobTitle && booking.job_title) existing.jobTitle = booking.job_title;
          if (!existing.linkedin && booking.linkedin) existing.linkedin = booking.linkedin;
          if (!existing.city && booking.city) existing.city = booking.city;
          if (!existing.state && booking.state) existing.state = booking.state;
          if (!existing.country && booking.country) existing.country = booking.country;

          // Update last/next meeting dates
          if (isBefore(bookingDate, now)) {
            if (!existing.lastMeeting || isAfter(bookingDate, parseISO(existing.lastMeeting))) {
              existing.lastMeeting = booking.start_time;
              // If this is a more recent past meeting, also update name/company to most recent
              existing.name = booking.name;
              if (phone) existing.phone = phone;
              if (company) existing.company = company;
            }
          } else if (isAfter(bookingDate, now)) {
            if (!existing.nextMeeting || isBefore(bookingDate, parseISO(existing.nextMeeting))) {
              existing.nextMeeting = booking.start_time;
            }
          }
        }
      });
      
      setContacts(Array.from(contactMap.values()));
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = React.useMemo(() => {
    let result = contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [contacts, searchQuery, sortConfig]);

  const handleToggleColumn = (column: string) => {
    setTempVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column) 
        : [...prev, column]
    );
  };

  const handleApplyColumns = () => {
    setVisibleColumns(tempVisibleColumns);
    setIsColumnPopoverOpen(false);
  };

  const openColumnPopover = () => {
    setTempVisibleColumns(visibleColumns);
    setIsColumnPopoverOpen(true);
  };

  const handleSort = (key: keyof Contact, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
    setActiveMenuColumn(null);
  };

  const handleHideColumn = (column: string) => {
    setVisibleColumns(prev => prev.filter(c => c !== column));
    setActiveMenuColumn(null);
  };

  const getColumnKey = (column: string): keyof Contact => {
    switch (column) {
      case 'Name': return 'name';
      case 'Email': return 'email';
      case 'Phone number': return 'phone';
      case 'Last meeting date': return 'lastMeeting';
      case 'Next meeting date': return 'nextMeeting';
      case 'Company': return 'company';
      case 'Source': return 'source';
      case 'Created on': return 'createdOn';
      case 'Time zone': return 'timezone';
      case 'Job title': return 'jobTitle';
      case 'LinkedIn': return 'linkedin';
      case 'City': return 'city';
      case 'State': return 'state';
      case 'Country': return 'country';
      default: return 'name';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <button 
          onClick={() => setIsAddSidebarOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700 transition-all shadow-sm"
        >
          <UserPlus className="w-5 h-5" />
          Add contact
        </button>
      </div>

      <AddContactSidebar 
        isOpen={isAddSidebarOpen} 
        onClose={() => setIsAddSidebarOpen(false)} 
        onSuccess={loadContacts}
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name and email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="relative" ref={popoverRef}>
            <button 
              onClick={openColumnPopover}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all",
                isColumnPopoverOpen && "bg-slate-50 border-slate-300"
              )}
            >
              <EyeOff className="w-4 h-4" />
              Show columns
              {isColumnPopoverOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {isColumnPopoverOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="max-h-96 overflow-y-auto py-2">
                    {ALL_COLUMNS.map(column => (
                      <div 
                        key={column}
                        onClick={() => handleToggleColumn(column)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          tempVisibleColumns.includes(column) 
                            ? "bg-blue-600 border-blue-600" 
                            : "border-slate-300 bg-white"
                        )}>
                          {tempVisibleColumns.includes(column) && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-sm text-slate-700">{column}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-slate-100">
                    <button 
                      onClick={handleApplyColumns}
                      className="w-full py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 border-b border-slate-100 sticky left-0 bg-white z-20">
                  <div className="flex items-center justify-between gap-2">
                    <span>Name</span>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuColumn(activeMenuColumn === 'Name' ? null : 'Name')}
                        className="menu-button p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
                      {activeMenuColumn === 'Name' && (
                        <div ref={menuRef} className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                          <button 
                            onClick={() => handleSort('name', 'asc')}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <ArrowUp className="w-4 h-4" /> Sort ascending
                          </button>
                          <button 
                            onClick={() => handleSort('name', 'desc')}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <ArrowDown className="w-4 h-4" /> Sort descending
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </th>
                {visibleColumns.map(column => (
                  <th key={column} className="px-6 py-4 text-left text-sm font-bold text-slate-900 border-b border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <span>{column}</span>
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenuColumn(activeMenuColumn === column ? null : column)}
                          className="menu-button p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                        {activeMenuColumn === column && (
                          <div ref={menuRef} className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                            <button 
                              onClick={() => handleSort(getColumnKey(column), 'asc')}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <ArrowUp className="w-4 h-4" /> Sort ascending
                            </button>
                            <button 
                              onClick={() => handleSort(getColumnKey(column), 'desc')}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <ArrowDown className="w-4 h-4" /> Sort descending
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button 
                              onClick={() => handleHideColumn(column)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <EyeOff className="w-4 h-4" /> Hide column
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 border-b border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-600 font-bold text-xs">
                        {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{contact.name}</span>
                    </div>
                  </td>
                  {visibleColumns.map(column => (
                    <td key={column} className="px-6 py-4 border-b border-slate-100">
                      <span className="text-sm text-slate-600">
                        {column === 'Last meeting date' || column === 'Next meeting date' || column === 'Created on'
                          ? (contact[getColumnKey(column)] ? format(parseISO(contact[getColumnKey(column)] as string), 'd/M/yyyy') : '')
                          : contact[getColumnKey(column)]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredContacts.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-500">No contacts found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
