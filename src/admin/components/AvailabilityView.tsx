import React from 'react';
import { 
  ChevronDown, 
  Plus, 
  X, 
  Copy, 
  Calendar as CalendarIcon, 
  List, 
  MoreVertical,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Check
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TimePicker } from './TimePicker';
import { supabase } from '../../lib/supabase';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface DayAvailability {
  day: string;
  enabled: boolean;
  slots: TimeSlot[];
}

interface DateOverride {
  id: string;
  dates: Date[];
  slots: TimeSlot[];
}

const INITIAL_AVAILABILITY: DayAvailability[] = [
  { day: 'S', enabled: false, slots: [] },
  { day: 'M', enabled: true, slots: [{ id: '1', start: '9:00am', end: '5:00pm' }] },
  { day: 'T', enabled: true, slots: [{ id: '2', start: '9:00am', end: '5:00pm' }] },
  { day: 'W', enabled: true, slots: [{ id: '3', start: '9:00am', end: '5:00pm' }] },
  { day: 'T', enabled: true, slots: [{ id: '4', start: '9:00am', end: '5:00pm' }] },
  { day: 'F', enabled: true, slots: [{ id: '5', start: '9:00am', end: '5:00pm' }] },
  { day: 'S', enabled: false, slots: [] },
];

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

const formatTime = (totalMinutes: number) => {
  let h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const period = h < 12 ? 'am' : 'pm';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m === 0 ? '00' : m.toString().padStart(2, '0');
  return `${displayH}:${displayM}${period}`;
};

export const AvailabilityView: React.FC<{ initialScheduleId?: string | null }> = ({ initialScheduleId }) => {
  const [activeTab, setActiveTab] = React.useState('Schedules');
  const [availability, setAvailability] = React.useState<DayAvailability[]>(INITIAL_AVAILABILITY);
  const [openPicker, setOpenPicker] = React.useState<{ dayIndex: number | 'modal'; slotId: string; type: 'start' | 'end' } | null>(null);
  const [copyingFrom, setCopyingFrom] = React.useState<number | null>(null);
  const [selectedCopyDays, setSelectedCopyDays] = React.useState<Set<number>>(new Set());
  
  // Schedule state
  const [schedules, setSchedules] = React.useState<string[]>(['Working hours (default)']);
  const [selectedSchedule, setSelectedSchedule] = React.useState('Working hours (default)');
  const [isScheduleDropdownOpen, setIsScheduleDropdownOpen] = React.useState(false);
  const [isCreateScheduleModalOpen, setIsCreateScheduleModalOpen] = React.useState(false);
  const [newScheduleName, setNewScheduleName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const isInitialFetchRef = React.useRef(false);

  // Date-specific hours state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [overrides, setOverrides] = React.useState<DateOverride[]>([]);
  const [modalSelectedDates, setModalSelectedDates] = React.useState<Date[]>([]);
  const [modalSlots, setModalSlots] = React.useState<TimeSlot[]>([{ id: '1', start: '9:00am', end: '5:00pm' }]);
  const [currentMonth, setCurrentMonth] = React.useState(new Date(2026, 2, 1)); // March 2026
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Event types state
  const [eventTypes, setEventTypes] = React.useState<any[]>([]);
  const [isEventTypesPopoverOpen, setIsEventTypesPopoverOpen] = React.useState(false);
  const [eventSearchQuery, setEventSearchQuery] = React.useState('');
  const [selectedEventIds, setSelectedEventIds] = React.useState<Set<string>>(new Set());
  const [currentScheduleId, setCurrentScheduleId] = React.useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch data on mount
  React.useEffect(() => {
    if (!isInitialFetchRef.current) {
      isInitialFetchRef.current = true;
      fetchSchedules(initialScheduleId);
    }

    // Set up real-time listener for event types
    const channel = supabase
      .channel('event_types_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_types'
        },
        (payload) => {
          // Refresh event types when changes occur
          supabase.from('event_types').select('*').then(({ data }) => {
            if (data) setEventTypes(data);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApplyEventTypes = async () => {
    if (!currentScheduleId) return;

    const currentlyAssigned = new Set(eventTypes.filter(e => e.schedule_id === currentScheduleId).map(e => e.id));
    
    // Check if there are any changes
    const hasChanges = selectedEventIds.size !== currentlyAssigned.size || 
                       Array.from(selectedEventIds).some(id => !currentlyAssigned.has(id));

    if (!hasChanges) {
      setIsEventTypesPopoverOpen(false);
      return;
    }

    try {
      // Update event types in Supabase
      // 1. Remove schedule_id from events that were unselected
      const toRemove = Array.from(currentlyAssigned).filter(id => !selectedEventIds.has(id));
      if (toRemove.length > 0) {
        await supabase
          .from('event_types')
          .update({ schedule_id: null })
          .in('id', toRemove);
      }

      // 2. Add schedule_id to events that were selected
      const toAdd = Array.from(selectedEventIds).filter(id => !currentlyAssigned.has(id));
      if (toAdd.length > 0) {
        await supabase
          .from('event_types')
          .update({ schedule_id: currentScheduleId })
          .in('id', toAdd);
      }

      // Refresh event types state
      const { data } = await supabase.from('event_types').select('*');
      if (data) setEventTypes(data);
      
      showToast('Event types updated successfully!');
      setIsEventTypesPopoverOpen(false);
    } catch (error) {
      console.error('Error updating event types:', error);
      showToast('Failed to update event types', 'error');
    }
  };

  const filteredEventTypes = eventTypes.filter(e => 
    e.title.toLowerCase().includes(eventSearchQuery.toLowerCase())
  );

  const fetchSchedules = async (targetId?: string | null) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const userId = user.id;

      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (schedulesError) throw schedulesError;

      const { data: eventTypesData, error: eventTypesError } = await supabase
        .from('event_types')
        .select('*')
        .eq('user_id', userId);
      
      if (eventTypesError) throw eventTypesError;
      setEventTypes(eventTypesData || []);

      if (schedulesData && schedulesData.length > 0) {
        setSchedules(schedulesData.map(s => s.name));
        
        let activeSchedule;
        if (targetId) {
          activeSchedule = schedulesData.find(s => s.id === targetId) || schedulesData.find(s => s.is_active) || schedulesData[0];
        } else {
          activeSchedule = schedulesData.find(s => s.is_active) || schedulesData[0];
        }

        setSelectedSchedule(activeSchedule.name);
        setCurrentScheduleId(activeSchedule.id);
        await fetchAvailability(activeSchedule.id);
        
        // Assign orphaned events (null schedule_id) to the active schedule
        const orphanedEvents = eventTypesData?.filter(e => !e.schedule_id) || [];
        if (orphanedEvents.length > 0) {
          await supabase
            .from('event_types')
            .update({ schedule_id: activeSchedule.id })
            .is('schedule_id', null);
          
          const updatedEventTypes = (eventTypesData || []).map(e => 
            e.schedule_id ? e : { ...e, schedule_id: activeSchedule.id }
          );
          setEventTypes(updatedEventTypes);
          setSelectedEventIds(new Set(updatedEventTypes.filter(e => e.schedule_id === activeSchedule.id).map(e => e.id)));
        } else {
          // Set initially selected event IDs for this schedule
          const initialSelected = new Set(
            eventTypesData?.filter(e => e.schedule_id === activeSchedule.id).map(e => e.id) || []
          );
          setSelectedEventIds(initialSelected);
        }
      } else {
        // Create default schedule if none exists
        const { data: newSchedule, error: createError } = await supabase
          .from('schedules')
          .insert([{ name: 'Working hours (default)', is_active: true }])
          .select()
          .single();

        if (createError) throw createError;
        setCurrentScheduleId(newSchedule.id);
        
        // Initialize default weekly hours
        const weeklyHours = INITIAL_AVAILABILITY.map((day, idx) => ({
          schedule_id: newSchedule.id,
          day_index: idx,
          enabled: day.enabled,
          slots: day.slots
        }));

        await supabase.from('weekly_hours').insert(weeklyHours);
        setSchedules(['Working hours (default)']);
        setSelectedSchedule('Working hours (default)');
        
        // By default, assign all events to the first schedule if none assigned
        if (eventTypesData && eventTypesData.length > 0) {
          await supabase
            .from('event_types')
            .update({ schedule_id: newSchedule.id })
            .is('schedule_id', null);
          
          const updatedEventTypes = eventTypesData.map(e => ({ ...e, schedule_id: e.schedule_id || newSchedule.id }));
          setEventTypes(updatedEventTypes);
          setSelectedEventIds(new Set(updatedEventTypes.filter(e => e.schedule_id === newSchedule.id).map(e => e.id)));
        }
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async (scheduleId: string) => {
    setCurrentScheduleId(scheduleId);
    try {
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('weekly_hours')
        .select('*')
        .eq('schedule_id', scheduleId)
        .order('day_index', { ascending: true });

      if (weeklyError) throw weeklyError;

      if (weeklyData) {
        setAvailability(weeklyData.map(d => ({
          day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.day_index],
          enabled: d.enabled,
          slots: d.slots
        })));
      }

      const { data: overridesData, error: overridesError } = await supabase
        .from('date_overrides')
        .select('*')
        .eq('schedule_id', scheduleId);

      if (overridesError) throw overridesError;

      if (overridesData) {
        setOverrides(overridesData.map(o => ({
          id: o.id,
          dates: o.dates.map((d: string) => new Date(d)),
          slots: o.slots
        })));
      }

      // Also update selected event IDs for this schedule
      const { data: eventTypesData } = await supabase
        .from('event_types')
        .select('*');
      
      if (eventTypesData) {
        setEventTypes(eventTypesData);
        setSelectedEventIds(new Set(eventTypesData.filter(e => e.schedule_id === scheduleId).map(e => e.id)));
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const saveWeeklyHours = async (dayIndex: number, enabled: boolean, slots: TimeSlot[]) => {
    try {
      const { data: schedule } = await supabase
        .from('schedules')
        .select('id')
        .eq('name', selectedSchedule)
        .single();

      if (schedule) {
        const { error } = await supabase
          .from('weekly_hours')
          .update({ enabled, slots })
          .eq('schedule_id', schedule.id)
          .eq('day_index', dayIndex);
        
        if (error) throw error;
        showToast('Availability updated successfully!');
      }
    } catch (error) {
      console.error('Error saving weekly hours:', error);
      showToast('Failed to update availability', 'error');
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const toggleDay = async (index: number) => {
    const newAvailability = [...availability];
    newAvailability[index].enabled = !newAvailability[index].enabled;
    if (newAvailability[index].enabled && newAvailability[index].slots.length === 0) {
      newAvailability[index].slots = [{ id: Math.random().toString(36).substr(2, 9), start: '9:00am', end: '5:00pm' }];
    }
    setAvailability(newAvailability);
    await saveWeeklyHours(index, newAvailability[index].enabled, newAvailability[index].slots);
  };

  const addSlot = async (dayIndex: number) => {
    const newAvailability = [...availability];
    const day = newAvailability[dayIndex];
    
    if (!day.enabled) {
      day.enabled = true;
      day.slots = [{ id: Math.random().toString(36).substr(2, 9), start: '9:00am', end: '5:00pm' }];
    } else {
      const lastSlot = day.slots[day.slots.length - 1];
      const startMinutes = parseTime(lastSlot.end) + 60; // +1 hour from previous end
      const endMinutes = startMinutes + 60; // 1 hour duration
      
      const newSlot = {
        id: Math.random().toString(36).substr(2, 9),
        start: formatTime(startMinutes),
        end: formatTime(endMinutes)
      };
      day.slots.push(newSlot);
    }
    setAvailability(newAvailability);
    await saveWeeklyHours(dayIndex, day.enabled, day.slots);
  };

  const removeSlot = async (dayIndex: number, slotId: string) => {
    const newAvailability = [...availability];
    newAvailability[dayIndex].slots = newAvailability[dayIndex].slots.filter(s => s.id !== slotId);
    if (newAvailability[dayIndex].slots.length === 0) {
      newAvailability[dayIndex].enabled = false;
    }
    setAvailability(newAvailability);
    await saveWeeklyHours(dayIndex, newAvailability[dayIndex].enabled, newAvailability[dayIndex].slots);
  };

  const updateSlot = async (dayIndex: number | 'modal', slotId: string, type: 'start' | 'end', time: string) => {
    if (dayIndex === 'modal') {
      setModalSlots(prev => prev.map(s => {
        if (s.id === slotId) {
          const updated = { ...s, [type]: time };
          if (type === 'start' && parseTime(updated.start) >= parseTime(updated.end)) {
            updated.end = formatTime(parseTime(updated.start) + 60);
          }
          return updated;
        }
        return s;
      }));
      return;
    }
    const newAvailability = [...availability];
    const slot = newAvailability[dayIndex].slots.find(s => s.id === slotId);
    if (slot) {
      slot[type] = time;
      if (type === 'start' && parseTime(slot.start) >= parseTime(slot.end)) {
        slot.end = formatTime(parseTime(slot.start) + 60);
      }
    }
    setAvailability(newAvailability);
    await saveWeeklyHours(dayIndex, newAvailability[dayIndex].enabled, newAvailability[dayIndex].slots);
  };

  const copyDay = (dayIndex: number) => {
    setCopyingFrom(dayIndex);
    setSelectedCopyDays(new Set());
  };

  const applyCopy = async () => {
    if (copyingFrom === null) return;
    
    const sourceSlots = availability[copyingFrom].slots;
    const newAvailability = [...availability];
    
    const targetIndices: number[] = [];
    selectedCopyDays.forEach(targetIndex => {
      if (targetIndex === copyingFrom) return;
      targetIndices.push(targetIndex);
      
      newAvailability[targetIndex].enabled = true;
      // Deep copy slots with new IDs
      newAvailability[targetIndex].slots = sourceSlots.map(slot => ({
        ...slot,
        id: Math.random().toString(36).substr(2, 9)
      }));
    });
    
    setAvailability(newAvailability);
    setCopyingFrom(null);

    // Save all updated days to Supabase
    for (const idx of targetIndices) {
      await saveWeeklyHours(idx, newAvailability[idx].enabled, newAvailability[idx].slots);
    }
  };

  // Modal helpers
  const toggleModalDate = (date: Date) => {
    const exists = modalSelectedDates.find(d => d.getTime() === date.getTime());
    if (exists) {
      setModalSelectedDates(prev => prev.filter(d => d.getTime() !== date.getTime()));
    } else {
      setModalSelectedDates(prev => [...prev, date].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const addModalSlot = () => {
    const lastSlot = modalSlots[modalSlots.length - 1];
    const startMinutes = parseTime(lastSlot.end) + 60;
    const endMinutes = startMinutes + 60;
    setModalSlots(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      start: formatTime(startMinutes),
      end: formatTime(endMinutes)
    }]);
  };

  const removeModalSlot = (id: string) => {
    setModalSlots(prev => prev.filter(s => s.id !== id));
  };

  const applyOverride = async () => {
    if (modalSelectedDates.length === 0) return;
    const newOverride: DateOverride = {
      id: Math.random().toString(36).substr(2, 9),
      dates: [...modalSelectedDates],
      slots: [...modalSlots]
    };
    setOverrides(prev => [...prev, newOverride]);
    setIsModalOpen(false);
    setModalSelectedDates([]);
    setModalSlots([{ id: '1', start: '9:00am', end: '5:00pm' }]);

    // Save to Supabase
    try {
      const { data: schedule } = await supabase
        .from('schedules')
        .select('id')
        .eq('name', selectedSchedule)
        .single();

      if (schedule) {
        const { error } = await supabase
          .from('date_overrides')
          .insert([{
            schedule_id: schedule.id,
            dates: newOverride.dates.map(d => d.toISOString()),
            slots: newOverride.slots
          }]);
        
        if (error) throw error;
        showToast('Date override added successfully!');
      }
    } catch (error) {
      console.error('Error saving override:', error);
      showToast('Failed to add date override', 'error');
    }
  };

  const removeOverride = async (id: string) => {
    setOverrides(prev => prev.filter(o => o.id !== id));
    try {
      const { error } = await supabase
        .from('date_overrides')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      showToast('Date override removed successfully!');
    } catch (error) {
      console.error('Error removing override:', error);
      showToast('Failed to remove date override', 'error');
    }
  };

  const handleCreateSchedule = async () => {
    if (!newScheduleName.trim()) return;
    const name = newScheduleName.trim();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const userId = user.id;

      // Deactivate current active schedule for THIS user
      await supabase
        .from('schedules')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Create new schedule
      const { data: newSchedule, error: createError } = await supabase
        .from('schedules')
        .insert([{ name, is_active: true, user_id: userId }])
        .select()
        .single();

      if (createError) throw createError;

      // Initialize weekly hours for new schedule
      const weeklyHours = INITIAL_AVAILABILITY.map((day, idx) => ({
        schedule_id: newSchedule.id,
        day_index: idx,
        enabled: day.enabled,
        slots: day.slots
      }));

      await supabase.from('weekly_hours').insert(weeklyHours);

      setSchedules(prev => [...prev, name]);
      setSelectedSchedule(name);
      setCurrentScheduleId(newSchedule.id);
      setSelectedEventIds(new Set());
      setNewScheduleName('');
      setIsCreateScheduleModalOpen(false);
      setIsScheduleDropdownOpen(false);
      
      // Refresh availability for new schedule
      setAvailability(INITIAL_AVAILABILITY.map(day => ({
        day: day.day,
        enabled: day.enabled,
        slots: day.slots
      })));
      setOverrides([]);
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const formatDateRange = (dates: Date[]) => {
    if (dates.length === 0) return '';
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    if (sorted.length === 1) {
      return `${monthNames[start.getMonth()]} ${start.getDate()}`;
    }
    
    // Check if consecutive
    let isConsecutive = true;
    for (let i = 0; i < sorted.length - 1; i++) {
      const diff = sorted[i+1].getTime() - sorted[i].getTime();
      if (diff > 86400000) {
        isConsecutive = false;
        break;
      }
    }

    if (isConsecutive) {
      return `${monthNames[start.getMonth()]} ${start.getDate()} – ${end.getDate()}`;
    } else {
      // Just show first and last for simplicity or list them
      return `${monthNames[start.getMonth()]} ${start.getDate()}, ...`;
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <h1 className="text-2xl font-bold mb-8">Availability</h1>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading availability...</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="border-b border-slate-200 mb-8">
            <div className="flex gap-8">
              {['Schedules', 'Calendar settings', 'Advanced settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-4 text-sm font-bold transition-all relative",
                    activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100">
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Schedule</p>
                  <button 
                    onClick={() => setIsScheduleDropdownOpen(!isScheduleDropdownOpen)}
                    className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 -ml-2 rounded-lg transition-colors group"
                  >
                    {selectedSchedule}
                    <ChevronDown className={cn(
                      "w-5 h-5 text-blue-600 transition-transform",
                      isScheduleDropdownOpen ? "rotate-180" : "group-hover:translate-y-0.5"
                    )} />
                  </button>

                  {isScheduleDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[140]" 
                        onClick={() => setIsScheduleDropdownOpen(false)} 
                      />
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-[150] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2">
                          {schedules.map(schedule => (
                            <button
                              key={schedule}
                              onClick={async () => {
                                setSelectedSchedule(schedule);
                                setIsScheduleDropdownOpen(false);
                                // Update active schedule in Supabase
                                try {
                                  const { data: { user } } = await supabase.auth.getUser();
                                  if (!user) return;
                                  const userId = user.id;

                                  await supabase
                                    .from('schedules')
                                    .update({ is_active: false })
                                    .eq('user_id', userId)
                                    .eq('is_active', true);
                                  
                                  const { data } = await supabase
                                    .from('schedules')
                                    .update({ is_active: true })
                                    .eq('user_id', userId)
                                    .eq('name', schedule)
                                    .select()
                                    .single();
                                  
                                  if (data) {
                                    setCurrentScheduleId(data.id);
                                    await fetchAvailability(data.id);
                                  }
                                } catch (error) {
                                  console.error('Error switching schedule:', error);
                                }
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors group"
                            >
                              <span className={cn(
                                "text-sm font-medium transition-colors",
                                selectedSchedule === schedule ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"
                              )}>
                                {schedule}
                              </span>
                              {selectedSchedule === schedule && (
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 p-2">
                          <button 
                            onClick={() => {
                              setIsCreateScheduleModalOpen(true);
                              setIsScheduleDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors text-slate-700 group"
                          >
                            <Plus className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                            <span className="text-sm font-medium">Create schedule</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="relative">
                    <button 
                      onClick={() => {
                        setIsEventTypesPopoverOpen(!isEventTypesPopoverOpen);
                        setEventSearchQuery('');
                        // Reset selected IDs to current state when opening
                        setSelectedEventIds(new Set(eventTypes.filter(e => e.schedule_id === currentScheduleId).map(e => e.id)));
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 font-bold mt-2 hover:underline"
                    >
                      Active on: {eventTypes.filter(e => e.schedule_id === currentScheduleId).length} event type{eventTypes.filter(e => e.schedule_id === currentScheduleId).length !== 1 ? 's' : ''}
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isEventTypesPopoverOpen && "rotate-180")} />
                    </button>

                    {isEventTypesPopoverOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-[140]" 
                          onClick={() => setIsEventTypesPopoverOpen(false)} 
                        />
                        <div className="absolute top-full left-0 mt-2 w-[400px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[150] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-4 border-b border-slate-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                type="text"
                                placeholder="Search..."
                                value={eventSearchQuery}
                                onChange={(e) => setEventSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all"
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-sm">
                              <button 
                                onClick={() => setSelectedEventIds(new Set(eventTypes.map(e => e.id)))}
                                className="text-blue-600 font-medium hover:underline"
                              >
                                select all
                              </button>
                              <span className="text-slate-300">/</span>
                              <button 
                                onClick={() => setSelectedEventIds(new Set())}
                                className="text-blue-600 font-medium hover:underline"
                              >
                                clear
                              </button>
                            </div>
                          </div>

                          <div className="max-h-[300px] overflow-y-auto p-2">
                            <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              USING {selectedSchedule.toUpperCase()}
                            </p>
                            {filteredEventTypes.length === 0 ? (
                              <div className="p-8 text-center text-slate-500 text-sm">
                                No event types found
                              </div>
                            ) : (
                              filteredEventTypes.map(event => (
                                <button
                                  key={event.id}
                                  onClick={() => {
                                    const newSelected = new Set(selectedEventIds);
                                    if (newSelected.has(event.id)) {
                                      newSelected.delete(event.id);
                                    } else {
                                      newSelected.add(event.id);
                                    }
                                    setSelectedEventIds(newSelected);
                                  }}
                                  className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors group text-left"
                                >
                                  <div className={cn(
                                    "mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all",
                                    selectedEventIds.has(event.id) 
                                      ? "bg-blue-600 border-blue-600" 
                                      : "bg-white border-slate-300 group-hover:border-blue-600"
                                  )}>
                                    {selectedEventIds.has(event.id) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: event.color.match(/\[(.*?)\]/)?.[1] || event.color.replace('bg-', '') }} 
                                      />
                                      <span className="text-sm font-bold text-slate-900 truncate">{event.title}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {event.duration} mins • {event.location}
                                    </p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>

                          <div className="p-4 border-t border-slate-100 flex items-center gap-3">
                            <button 
                              onClick={handleApplyEventTypes}
                              className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            >
                              Apply
                            </button>
                            <button 
                              onClick={() => setIsEventTypesPopoverOpen(false)}
                              className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-md text-sm font-bold shadow-sm">
                      <List className="w-4 h-4" />
                      List
                    </button>
                    <button className="flex items-center gap-2 px-4 py-1.5 text-slate-500 text-sm font-bold hover:text-slate-800 transition-colors">
                      <CalendarIcon className="w-4 h-4" />
                      Calendar
                    </button>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Weekly Hours */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <h3 className="font-bold text-slate-800">Weekly hours</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-8">Set when you are typically available for meetings</p>

                  <div className="space-y-6">
                    {availability.map((day, dayIndex) => (
                      <div key={dayIndex} className="flex items-start gap-4">
                        <button 
                          onClick={() => toggleDay(dayIndex)}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0 mt-1",
                            day.enabled ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          {day.day}
                        </button>

                        <div className="flex-1 min-h-[40px] flex flex-col gap-3">
                          {!day.enabled ? (
                            <div className="flex items-center gap-4 h-8">
                              <span className="text-sm text-slate-400">Unavailable</span>
                              <div className="relative group">
                                <button 
                                  onClick={() => addSlot(dayIndex)}
                                  className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                  <Plus className="w-5 h-5 text-slate-400" />
                                </button>
                                {/* Tooltip */}
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#0a1f35] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[110] shadow-xl">
                                  New interval for {DAYS_FULL[dayIndex]}
                                  {/* Arrow */}
                                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-[#0a1f35]" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            day.slots.map((slot, slotIndex) => (
                              <div key={slot.id} className="flex items-center gap-3">
                                <div className="relative">
                                  <button 
                                    onClick={() => setOpenPicker({ dayIndex, slotId: slot.id, type: 'start' })}
                                    className={cn(
                                      "w-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:border-blue-600 transition-all text-center",
                                      openPicker?.dayIndex === dayIndex && openPicker?.slotId === slot.id && openPicker?.type === 'start' && "border-blue-600 ring-2 ring-blue-100"
                                    )}
                                  >
                                    {slot.start}
                                  </button>
                                  <TimePicker 
                                    value={slot.start}
                                    isOpen={openPicker?.dayIndex === dayIndex && openPicker?.slotId === slot.id && openPicker?.type === 'start'}
                                    onClose={() => setOpenPicker(null)}
                                    onChange={(time) => updateSlot(dayIndex, slot.id, 'start', time)}
                                  />
                                </div>
                                
                                <span className="text-slate-400">-</span>

                                <div className="relative">
                                  <button 
                                    onClick={() => setOpenPicker({ dayIndex, slotId: slot.id, type: 'end' })}
                                    className={cn(
                                      "w-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:border-blue-600 transition-all text-center",
                                      openPicker?.dayIndex === dayIndex && openPicker?.slotId === slot.id && openPicker?.type === 'end' && "border-blue-600 ring-2 ring-blue-100"
                                    )}
                                  >
                                    {slot.end}
                                  </button>
                                  <TimePicker 
                                    value={slot.end}
                                    isOpen={openPicker?.dayIndex === dayIndex && openPicker?.slotId === slot.id && openPicker?.type === 'end'}
                                    onClose={() => setOpenPicker(null)}
                                    onChange={(time) => updateSlot(dayIndex, slot.id, 'end', time)}
                                    minTime={slot.start}
                                  />
                                </div>

                                <div className="flex items-center gap-1 ml-2">
                                  <button 
                                    onClick={() => removeSlot(dayIndex, slot.id)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  {slotIndex === day.slots.length - 1 && (
                                    <div className="relative group">
                                      <button 
                                        onClick={() => addSlot(dayIndex)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                      {/* Tooltip */}
                                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#0a1f35] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[110] shadow-xl">
                                        New interval for {DAYS_FULL[dayIndex]}
                                        {/* Arrow */}
                                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-[#0a1f35]" />
                                      </div>
                                    </div>
                                  )}
                                  <div className="relative">
                                    <button 
                                      onClick={() => copyDay(dayIndex)}
                                      className={cn(
                                        "p-2 rounded-lg transition-colors text-slate-400 hover:text-slate-600",
                                        copyingFrom === dayIndex ? "bg-slate-200 text-slate-800" : "hover:bg-slate-100"
                                      )}
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>

                                    {copyingFrom === dayIndex && (
                                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-[120] p-4 animate-in fade-in zoom-in-95 duration-200">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Copy times to...</p>
                                        <div className="space-y-3 mb-6">
                                          {DAYS_FULL.map((dayName, idx) => (
                                            <label key={idx} className="flex items-center justify-between cursor-pointer group">
                                              <span className={cn(
                                                "text-sm font-medium transition-colors",
                                                idx === dayIndex ? "text-slate-300 cursor-not-allowed" : "text-slate-700 group-hover:text-slate-900"
                                              )}>
                                                {dayName}
                                              </span>
                                              <div className="relative flex items-center">
                                                <input 
                                                  type="checkbox"
                                                  disabled={idx === dayIndex}
                                                  checked={selectedCopyDays.has(idx) || idx === dayIndex}
                                                  onChange={(e) => {
                                                    if (idx === dayIndex) return;
                                                    const next = new Set(selectedCopyDays);
                                                    if (e.target.checked) next.add(idx);
                                                    else next.delete(idx);
                                                    setSelectedCopyDays(next);
                                                  }}
                                                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-blue-600 checked:bg-blue-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                />
                                                <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                              </div>
                                            </label>
                                          ))}
                                        </div>
                                        <button 
                                          onClick={applyCopy}
                                          className="w-full py-2.5 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                        >
                                          Apply
                                        </button>
                                        <button 
                                          onClick={() => setCopyingFrom(null)}
                                          className="w-full mt-2 py-2 text-slate-500 text-xs font-bold hover:text-slate-800 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date-specific hours */}
                <div className="lg:border-l border-slate-100 lg:pl-12">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                    <h3 className="font-bold text-slate-800">Date-specific hours</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-8">Adjust hours for specific days</p>

                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors mb-8"
                  >
                    <Plus className="w-4 h-4" />
                    Hours
                  </button>

                  {overrides.length > 0 && (
                    <div className="space-y-6">
                      <p className="text-xs font-bold text-slate-400">2026</p>
                      {overrides.map(override => (
                        <div key={override.id} className="flex items-start justify-between group">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-slate-800">{formatDateRange(override.dates)}</span>
                              <div className="flex flex-col items-end">
                                {override.slots.map(slot => (
                                  <span key={slot.id} className="text-sm text-slate-500">{slot.start} – {slot.end}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeOverride(override.id)}
                            className="ml-4 p-1 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Date Specific Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg max-h-[calc(100vh-2rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-8">Select the date(s) you want to assign specific hours</h2>
              
              {/* Calendar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-slate-800">
                    {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <button 
                      onClick={handleNextMonth}
                      className="p-2 bg-blue-50 text-blue-600 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                    <div key={d} className="text-[10px] font-bold text-slate-400 text-center py-2">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getDaysInMonth(currentMonth).firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: getDaysInMonth(currentMonth).daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const isSelected = modalSelectedDates.some(d => d.getTime() === date.getTime());
                    
                    const today = new Date(2026, 2, 25);
                    const isToday = day === 25 && currentMonth.getMonth() === 2 && currentMonth.getFullYear() === 2026;
                    const isPast = date < today;
                    const isSelectable = !isPast;

                    return (
                      <button
                        key={day}
                        disabled={!isSelectable}
                        onClick={() => toggleModalDate(date)}
                        className={cn(
                          "aspect-square rounded-full flex flex-col items-center justify-center text-sm font-medium transition-all relative group",
                          isSelected 
                            ? "bg-blue-600 text-white" 
                            : isSelectable 
                              ? "bg-blue-50 text-blue-600 hover:bg-blue-100" 
                              : "text-slate-300 cursor-not-allowed",
                        )}
                      >
                        {day}
                        {isToday && (
                          <div className={cn(
                            "absolute bottom-1.5 w-1 h-1 rounded-full",
                            isSelected ? "bg-white" : "bg-blue-600"
                          )} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Section (Expands when dates selected) */}
              {modalSelectedDates.length > 0 && (
                <div className="border-t border-slate-100 pt-8 mt-8 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="font-bold text-slate-800 mb-6">What hours are you available?</h3>
                  <div className="space-y-4">
                    {modalSlots.map((slot, idx) => (
                      <div key={slot.id} className="flex items-center gap-3">
                        <div className="relative">
                          <button 
                            onClick={() => setOpenPicker({ dayIndex: 'modal', slotId: slot.id, type: 'start' })}
                            className={cn(
                              "w-28 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:border-blue-600 transition-all text-center",
                              openPicker?.dayIndex === 'modal' && openPicker?.slotId === slot.id && openPicker?.type === 'start' && "border-blue-600 ring-2 ring-blue-100"
                            )}
                          >
                            {slot.start}
                          </button>
                          <TimePicker 
                            value={slot.start}
                            isOpen={openPicker?.dayIndex === 'modal' && openPicker?.slotId === slot.id && openPicker?.type === 'start'}
                            onClose={() => setOpenPicker(null)}
                            onChange={(time) => updateSlot('modal', slot.id, 'start', time)}
                          />
                        </div>
                        <span className="text-slate-400">-</span>
                        <div className="relative">
                          <button 
                            onClick={() => setOpenPicker({ dayIndex: 'modal', slotId: slot.id, type: 'end' })}
                            className={cn(
                              "w-28 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:border-blue-600 transition-all text-center",
                              openPicker?.dayIndex === 'modal' && openPicker?.slotId === slot.id && openPicker?.type === 'end' && "border-blue-600 ring-2 ring-blue-100"
                            )}
                          >
                            {slot.end}
                          </button>
                          <TimePicker 
                            value={slot.end}
                            isOpen={openPicker?.dayIndex === 'modal' && openPicker?.slotId === slot.id && openPicker?.type === 'end'}
                            onClose={() => setOpenPicker(null)}
                            onChange={(time) => updateSlot('modal', slot.id, 'end', time)}
                            minTime={slot.start}
                          />
                        </div>
                        <button 
                          onClick={() => removeModalSlot(slot.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {idx === modalSlots.length - 1 && (
                          <button 
                            onClick={addModalSlot}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 flex items-center gap-4 shrink-0 bg-white">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={applyOverride}
                disabled={modalSelectedDates.length === 0}
                className="flex-1 py-3 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {isCreateScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-800">Create schedule</h2>
                <button 
                  onClick={() => setIsCreateScheduleModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Schedule name</label>
                  <input 
                    type="text"
                    autoFocus
                    value={newScheduleName}
                    onChange={(e) => setNewScheduleName(e.target.value)}
                    placeholder="Working Hours, Exclusive Hours, etc..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    onClick={() => setIsCreateScheduleModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateSchedule}
                    disabled={!newScheduleName.trim()}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={cn(
          "fixed bottom-8 right-8 px-6 py-3 rounded-xl shadow-2xl z-[200] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300",
          toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
        )}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
