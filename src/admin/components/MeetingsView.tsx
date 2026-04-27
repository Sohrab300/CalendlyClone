import React from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter, 
  ChevronDown, 
  Play,
  HelpCircle,
  X,
  Loader2,
  ExternalLink,
  MessageSquare,
  Clock,
  User,
  MapPin,
  Mail,
  StickyNote,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameDay, 
  isWithinInterval, 
  startOfDay, 
  endOfDay,
  eachDayOfInterval,
  isToday,
  parseISO,
  isPast,
  isFuture
} from 'date-fns';
import { cn } from '../../lib/utils';
import { availabilityService, Booking, EventType } from '../../services/availabilityService';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

type DateRangePreset = 'Today' | 'This week' | 'This month' | 'All time' | 'Custom';

export const MeetingsView: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'Upcoming' | 'Past' | 'Date Range'>('Upcoming');
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [eventTypes, setEventTypes] = React.useState<EventType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [expandedBookingId, setExpandedBookingId] = React.useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = React.useState<string | null>(null);
  const [tempNotes, setTempNotes] = React.useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = React.useState(false);
  
  // Date Picker State
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<DateRangePreset>('All time');
  const [startDate, setStartDate] = React.useState<Date | null>(null);
  const [endDate, setEndDate] = React.useState<Date | null>(null);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
  const [viewDate, setViewDate] = React.useState(new Date()); // Left month view
  
  const datePickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [bookingsData, eventTypesData] = await Promise.all([
          availabilityService.getAllBookings(user.id),
          availabilityService.getEventTypes(user.id)
        ]);
        setBookings(bookingsData);
        setEventTypes(eventTypesData);
      } catch (error) {
        console.error('Error loading meetings data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
    const now = new Date();
    switch (preset) {
      case 'Today':
        setStartDate(startOfDay(now));
        setEndDate(endOfDay(now));
        break;
      case 'This week':
        setStartDate(startOfWeek(now));
        setEndDate(endOfWeek(now));
        break;
      case 'This month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'All time':
        setStartDate(null);
        setEndDate(null);
        break;
    }
  };

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
      setHoverDate(null);
      setSelectedPreset('Custom');
    } else {
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
      setHoverDate(null);
    }
  };

  const filteredBookings = React.useMemo(() => {
    let filtered = [...bookings];

    if (activeTab === 'Upcoming') {
      filtered = filtered.filter(b => isFuture(parseISO(b.start_time)) || isSameDay(parseISO(b.start_time), new Date()));
    } else if (activeTab === 'Past') {
      filtered = filtered.filter(b => isPast(parseISO(b.start_time)) && !isSameDay(parseISO(b.start_time), new Date()));
    } else if (activeTab === 'Date Range') {
      if (startDate && endDate) {
        filtered = filtered.filter(b => {
          const bookingDate = parseISO(b.start_time);
          return isWithinInterval(bookingDate, { start: startOfDay(startDate), end: endOfDay(endDate) });
        });
      } else if (startDate) {
        filtered = filtered.filter(b => isSameDay(parseISO(b.start_time), startDate));
      }
    }

    return filtered;
  }, [bookings, activeTab, startDate, endDate]);

  const handleExport = () => {
    if (filteredBookings.length === 0 || editingNotesId) return;

    const headers = ['Name', 'Email', 'Event Type', 'Start Time', 'End Time', 'Company', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredBookings.map(b => {
        const eventType = eventTypes.find(et => et.slug === b.event_slug);
        return [
          `"${b.name}"`,
          `"${b.email}"`,
          `"${eventType?.title || b.event_slug}"`,
          `"${format(parseISO(b.start_time), 'PPpp')}"`,
          `"${format(parseISO(b.end_time), 'PPpp')}"`,
          `"${b.company_name || ''}"`,
          `"${b.notes || ''}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `meetings_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ];

  const handleUpdateNotes = async (bookingId: string) => {
    setIsUpdatingNotes(true);
    try {
      await availabilityService.updateBooking(bookingId, { host_notes: tempNotes });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, host_notes: tempNotes } : b));
      setEditingNotesId(null);
      toast.success('Meeting notes updated successfully');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update meeting notes. Please ensure the host_notes column exists in your bookings table.');
    } finally {
      setIsUpdatingNotes(false);
    }
  };

  const renderCalendar = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const startDateView = startOfWeek(monthStart);
    const endDateView = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDateView, end: endDateView });

    return (
      <div className="w-64">
        <div className="text-center font-bold text-slate-800 mb-4">
          {format(monthDate, 'MMMM yyyy')}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <div key={d} className="text-[10px] font-bold text-slate-400 text-center py-1">
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            const isSelectedStart = startDate && isSameDay(day, startDate);
            const isSelectedEnd = endDate && isSameDay(day, endDate);
            
            // Range logic including hover
            let effectiveStart = startDate;
            let effectiveEnd = endDate;
            if (startDate && !endDate && hoverDate) {
              if (hoverDate < startDate) {
                effectiveStart = hoverDate;
                effectiveEnd = startDate;
              } else {
                effectiveStart = startDate;
                effectiveEnd = hoverDate;
              }
            }

            const isEffectiveStart = effectiveStart && isSameDay(day, effectiveStart);
            const isEffectiveEnd = effectiveEnd && isSameDay(day, effectiveEnd);
            const isInRange = effectiveStart && effectiveEnd && isWithinInterval(day, { start: effectiveStart, end: effectiveEnd });
            const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
            const isTodayDate = isToday(day);

            // Special logic for today's date as per user request
            const isTodayInitial = isTodayDate && !startDate && !endDate;
            const isTodayWithSelection = isTodayDate && (startDate || endDate) && !isEffectiveStart && !isEffectiveEnd;
            const isSelected = isEffectiveStart || isEffectiveEnd;

            return (
              <div 
                key={i} 
                className={cn(
                  "relative h-10 flex items-center justify-center cursor-pointer text-sm font-medium",
                  !isCurrentMonth && "opacity-0 pointer-events-none"
                )}
                onClick={() => handleDateClick(day)}
                onMouseEnter={() => startDate && !endDate && setHoverDate(day)}
                onMouseLeave={() => setHoverDate(null)}
              >
                {/* Range background for middle days */}
                {isInRange && !isEffectiveStart && !isEffectiveEnd && (
                  <div className="absolute inset-y-1 inset-x-0 bg-slate-100 z-0" />
                )}
                
                {/* Range background for start/end to connect to middle */}
                {isEffectiveStart && effectiveEnd && !isSameDay(effectiveStart, effectiveEnd) && (
                  <div className="absolute inset-y-1 right-0 left-1/2 bg-slate-100 z-0" />
                )}
                {isEffectiveEnd && effectiveStart && !isSameDay(effectiveStart, effectiveEnd) && (
                  <div className="absolute inset-y-1 left-0 right-1/2 bg-slate-100 z-0" />
                )}

                <div className={cn(
                  "w-8 h-8 flex flex-col items-center justify-center rounded-full transition-all relative z-10",
                  (isSelected || isTodayInitial) ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-700 hover:bg-slate-100"
                )}>
                  <span>{format(day, 'd')}</span>
                  {isTodayWithSelection && (
                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const groupedBookings = React.useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    filteredBookings.forEach(booking => {
      const dateKey = format(parseISO(booking.start_time), 'EEEE, d MMMM yyyy');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(booking);
    });
    return Object.entries(groups);
  }, [filteredBookings]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Meetings</h1>
          <HelpCircle className="w-5 h-5 text-slate-400 cursor-pointer" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50",
              editingNotesId && "opacity-50 pointer-events-none"
            )}>
              My Calendly
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className={cn(
              "flex items-center gap-2",
              editingNotesId && "opacity-50 pointer-events-none"
            )}>
              <span className="text-sm text-slate-600">Show buffers</span>
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            Displaying {filteredBookings.length} of {bookings.length} Events
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 flex items-center justify-between relative">
          <div className="flex gap-8">
            {(['Upcoming', 'Past', 'Date Range'] as const).map(tab => (
              <div key={tab} className="relative">
                <button
                  disabled={!!editingNotesId}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === 'Date Range') setIsDatePickerOpen(!isDatePickerOpen);
                    else setIsDatePickerOpen(false);
                  }}
                  className={cn(
                    "pb-4 text-sm font-bold transition-all flex items-center gap-1 whitespace-nowrap",
                    activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800',
                    editingNotesId && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {tab === 'Date Range' && startDate && endDate ? (
                    <span className="flex items-center gap-1">
                      {format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}
                    </span>
                  ) : tab}
                  {tab === 'Date Range' && (
                    <ChevronDown className={cn("w-4 h-4 transition-transform", isDatePickerOpen && "rotate-180")} />
                  )}
                </button>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button 
              disabled={!!editingNotesId}
              onClick={handleExport}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors",
                editingNotesId && "opacity-50 cursor-not-allowed"
              )}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              disabled={!!editingNotesId}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors",
                editingNotesId && "opacity-50 cursor-not-allowed"
              )}
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Date Picker Popover */}
          <AnimatePresence>
            {isDatePickerOpen && (
              <motion.div
                ref={datePickerRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-6 min-w-[600px]"
              >
                <div className="flex gap-6 mb-8">
                  {(['Today', 'This week', 'This month', 'All time'] as DateRangePreset[]).map(preset => (
                    <button
                      key={preset}
                      onClick={() => handlePresetClick(preset)}
                      className={cn(
                        "text-sm font-bold transition-colors",
                        selectedPreset === preset ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex items-start justify-between gap-12 relative">
                  <button 
                    onClick={() => setViewDate(subMonths(viewDate, 1))}
                    className="absolute left-0 top-0 p-1 hover:bg-slate-100 rounded-full transition-colors z-10"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <button 
                    onClick={() => setViewDate(addMonths(viewDate, 1))}
                    className="absolute right-0 top-0 p-1 hover:bg-slate-100 rounded-full transition-colors z-10"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>

                  <div className="flex gap-12">
                    {renderCalendar(viewDate)}
                    {renderCalendar(addMonths(viewDate, 1))}
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button 
                    onClick={() => setIsDatePickerOpen(false)}
                    className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setIsDatePickerOpen(false)}
                    className="px-8 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="divide-y divide-slate-100">
          {groupedBookings.length > 0 ? (
            groupedBookings.map(([date, dayBookings]) => (
              <div key={date}>
                <div className="px-6 py-3 bg-slate-50/50 text-sm font-medium text-slate-500">
                  {date}
                </div>
                {(dayBookings as Booking[]).map(booking => {
                  const eventType = eventTypes.find(et => et.slug === booking.event_slug);
                  const startTime = parseISO(booking.start_time);
                  const endTime = parseISO(booking.end_time);
                  
                  return (
                    <div key={booking.id} className="border-b border-slate-100 last:border-0">
                      <div 
                        className={cn(
                          "px-6 py-6 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer",
                          expandedBookingId === booking.id && "bg-slate-50",
                          editingNotesId && editingNotesId !== booking.id && "opacity-50 pointer-events-none"
                        )}
                        onClick={() => {
                          if (editingNotesId) return;
                          setExpandedBookingId(expandedBookingId === booking.id ? null : booking.id);
                        }}
                      >
                        <div className="flex items-center gap-8 flex-1">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0",
                            eventType?.color.startsWith('bg-[') ? "" : (eventType?.color || "bg-blue-600")
                          )} style={{ backgroundColor: eventType?.color.startsWith('bg-[') ? eventType.color.slice(4, -1) : undefined }}>
                            {booking.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="w-32 shrink-0">
                            <span className="text-sm font-medium text-slate-500">
                              {format(startTime, 'h:mm a')} – {format(endTime, 'h:mm a')}
                            </span>
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="font-bold text-slate-900">{booking.name}</span>
                            <span className="text-sm text-slate-500">
                              Event type <span className="font-bold text-slate-700">{eventType?.title || booking.event_slug}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-sm text-slate-500 hidden sm:block">
                            1 host | 0 non-hosts
                          </div>
                          <button className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
                            <ChevronDown className={cn("w-4 h-4 transition-transform", expandedBookingId === booking.id && "rotate-180")} />
                            Details
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedBookingId === booking.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-white border-t border-slate-100"
                          >
                            <div className="px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
                              {/* Left Column - Actions (Skipped as requested) */}
                              <div className="md:col-span-3 hidden md:block">
                                {/* Empty space or other actions if needed later */}
                              </div>

                              {/* Right Column - Details */}
                              <div className="md:col-span-9 space-y-8">
                                {/* Invitee */}
                                <section>
                                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Invitee</h3>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                      {booking.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-900">{booking.name}</span>
                                      <span className="text-sm text-slate-500">{booking.email}</span>
                                    </div>
                                  </div>
                                  <button 
                                    disabled={!!editingNotesId}
                                    className={cn(
                                      "mt-3 text-sm font-bold text-blue-600 hover:underline",
                                      editingNotesId && "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    View contact
                                  </button>
                                </section>

                                {/* Location */}
                                <section>
                                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Location</h3>
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    {eventType?.location_type === 'google_meet' ? (
                                      <>
                                        <span>This is a Google Meet web conference.</span>
                                        <a 
                                          href={editingNotesId ? undefined : eventType.location} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className={cn(
                                            "text-blue-600 font-bold hover:underline",
                                            editingNotesId && "opacity-50 cursor-not-allowed"
                                          )}
                                          onClick={(e) => {
                                            if (editingNotesId) {
                                              e.preventDefault();
                                              return;
                                            }
                                            e.stopPropagation();
                                          }}
                                        >
                                          Join now
                                        </a>
                                      </>
                                    ) : (
                                      <span>{eventType?.location || 'No location specified'}</span>
                                    )}
                                  </div>
                                </section>

                                {/* Timezone */}
                                <section>
                                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Invitee Time Zone</h3>
                                  <p className="text-sm text-slate-700">{booking.timezone || 'India Standard Time'}</p>
                                </section>

                                {/* Questions */}
                                <section>
                                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Questions</h3>
                                  <div className="space-y-2">
                                    <p className="text-sm text-slate-500">Please share anything that will help prepare for our meeting.</p>
                                    <p className="text-sm text-slate-900 font-medium">{booking.notes || 'No notes provided'}</p>
                                  </div>
                                </section>

                                {/* Meeting Host */}
                                <section>
                                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Meeting Host</h3>
                                  <div className="flex flex-col gap-3">
                                    <p className="text-sm text-slate-600">Host will attend this meeting</p>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                                      S
                                    </div>
                                  </div>
                                </section>

                                  {/* Add meeting notes */}
                                  <section className="pt-4 border-t border-slate-100">
                                    {editingNotesId === booking.id ? (
                                      <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">MEETING NOTES</h3>
                                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                          <ReactQuill 
                                            theme="snow"
                                            value={tempNotes}
                                            onChange={setTempNotes}
                                            modules={quillModules}
                                            formats={quillFormats}
                                            placeholder="Add any information relevant to this event"
                                          />
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <button 
                                            disabled={isUpdatingNotes}
                                            onClick={() => handleUpdateNotes(booking.id)}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                          >
                                            {isUpdatingNotes && <Loader2 className="w-3 h-3 animate-spin" />}
                                            Update
                                          </button>
                                          <button 
                                            disabled={isUpdatingNotes}
                                            onClick={() => setEditingNotesId(null)}
                                            className="text-sm font-bold text-slate-600 hover:text-slate-900"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className={cn(
                                          "space-y-4",
                                          editingNotesId && editingNotesId !== booking.id && "opacity-50 pointer-events-none"
                                        )}>
                                          {booking.host_notes ? (
                                            <div className="space-y-2">
                                              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">MEETING NOTES</h3>
                                              <div 
                                                className="text-sm text-slate-700 host-notes-display"
                                                dangerouslySetInnerHTML={{ __html: booking.host_notes }}
                                              />
                                              <button 
                                                onClick={() => {
                                                  setEditingNotesId(booking.id);
                                                  setTempNotes(booking.host_notes || '');
                                                }}
                                                className="text-sm font-bold text-blue-600 hover:underline"
                                              >
                                                Edit notes
                                              </button>
                                            </div>
                                          ) : (
                                            <>
                                              <button 
                                                onClick={() => {
                                                  setEditingNotesId(booking.id);
                                                  setTempNotes('');
                                                }}
                                                className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                                              >
                                                <StickyNote className="w-4 h-4" />
                                                Add meeting notes
                                              </button>
                                              <p className="mt-1 text-xs text-slate-400">(only the host will see these)</p>
                                            </>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </section>

                                {/* Footer */}
                                <div className="pt-8 text-xs text-slate-400">
                                  Created {format(parseISO(booking.created_at || booking.start_time), 'd MMMM yyyy')} by {booking.name}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400">
              No meetings found for this period
            </div>
          )}
          <div className="p-6 text-center text-sm text-slate-400">
            You've reached the end of the list
          </div>
        </div>
      </div>
    </div>
  );
};
