import React from 'react';
import { toast } from 'sonner';
import { MOCK_EVENTS } from '../../constants';
import { supabase } from '../../lib/supabase';
import { availabilityService, EventType } from '../../services/availabilityService';
import { AdminProfile, EventFormData, ScheduleOption, SettingsTab } from '../types';

const DEFAULT_EVENT_NAME = 'New Meeting';
const DEFAULT_EVENT_COLOR = '#8247E5';

const DEFAULT_WEEKLY_HOURS = [
  { day_index: 0, enabled: false, slots: [] },
  { day_index: 1, enabled: true, slots: [{ id: '1', start: '09:00am', end: '05:00pm' }] },
  { day_index: 2, enabled: true, slots: [{ id: '2', start: '09:00am', end: '05:00pm' }] },
  { day_index: 3, enabled: true, slots: [{ id: '3', start: '09:00am', end: '05:00pm' }] },
  { day_index: 4, enabled: true, slots: [{ id: '4', start: '09:00am', end: '05:00pm' }] },
  { day_index: 5, enabled: true, slots: [{ id: '5', start: '09:00am', end: '05:00pm' }] },
  { day_index: 6, enabled: false, slots: [] },
];

const buildSlug = (title: string, existingEvents: EventType[]) => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  let slug = baseSlug;
  let counter = 1;
  while (existingEvents.some(event => event.slug === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

export function useAdminDashboard() {
  const [sidebarTab, setSidebarTab] = React.useState('Scheduling');
  const [activeTab, setActiveTab] = React.useState('Event types');
  const [targetScheduleId, setTargetScheduleId] = React.useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [newEventName, setNewEventName] = React.useState(DEFAULT_EVENT_NAME);
  const [newEventColor, setNewEventColor] = React.useState(DEFAULT_EVENT_COLOR);
  const [editingEvent, setEditingEvent] = React.useState<EventType | null>(null);
  const [events, setEvents] = React.useState<EventType[]>([]);
  const [schedules, setSchedules] = React.useState<ScheduleOption[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [profile, setProfile] = React.useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [settingsTab, setSettingsTab] = React.useState<SettingsTab>('Profile');

  const resetDraftEvent = () => {
    setEditingEvent(null);
    setNewEventName(DEFAULT_EVENT_NAME);
    setNewEventColor(DEFAULT_EVENT_COLOR);
  };

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userId = user.id;
      const [eventsData, schedulesData, profileResponse] = await Promise.all([
        availabilityService.getEventTypes(userId),
        availabilityService.getSchedules(userId),
        supabase.from('profiles').select('*').eq('id', userId).limit(1).single(),
      ]);

      setProfile(profileResponse.data);

      let finalEvents = eventsData;
      let finalSchedules = schedulesData || [];

      if (eventsData.length === 0 && finalSchedules.length === 0) {
        console.log('New user detected. Seeding default data...');
        const defaultSchedule = await availabilityService.createSchedule('Working hours (default)', userId, true);
        finalSchedules = [defaultSchedule];

        await availabilityService.updateWeeklyHours(defaultSchedule.id, DEFAULT_WEEKLY_HOURS);

        for (const event of MOCK_EVENTS) {
          const { id, ...rest } = event;
          await availabilityService.createEventType({
            ...rest,
            user_id: userId,
            schedule_id: defaultSchedule.id,
          });
        }

        finalEvents = await availabilityService.getEventTypes(userId);
      }

      setEvents(finalEvents);
      setSchedules(finalSchedules);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    try {
      for (const id of selectedIds) {
        await availabilityService.deleteEventType(id);
      }
      setEvents(prev => prev.filter(event => !selectedIds.has(event.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error deleting events:', error);
      alert('Failed to delete events');
    }
  };

  const handleCopyLink = (event: EventType) => {
    const userSlug = profile?.username;
    if (!userSlug) {
      toast.error('Profile not loaded yet. Please wait.');
      return;
    }

    const link = `${window.location.origin}/${userSlug}/${event.slug}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  const handleViewLandingPage = () => {
    const userSlug = profile?.username;
    if (!userSlug) return;
    window.open(`/${userSlug}`, '_blank');
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateEvent = async (data: EventFormData) => {
    try {
      const userSlug = profile?.username;
      if (!userSlug) {
        toast.error('Profile not loaded. Cannot save event.');
        return;
      }

      if (editingEvent) {
        const eventLink = `${window.location.origin}/${userSlug}/${data.slug || editingEvent.slug}`;
        const updated = await availabilityService.updateEventType(editingEvent.id, {
          title: data.title,
          duration: data.duration,
          color: `bg-[${data.color}]`,
          schedule_id: data.schedule_id,
          description: data.description,
          buffer_before: data.buffer_before,
          buffer_after: data.buffer_after,
          meeting_limit_count: data.meeting_limit_count,
          meeting_limit_period: data.meeting_limit_period,
          slug: data.slug,
          link: eventLink,
          time_increment: data.time_increment,
          timezone_display: data.timezone_display,
          invitee_detail_type: data.invitee_detail_type,
          autofill_enabled: data.autofill_enabled,
          allow_guests: data.allow_guests,
          questions: data.questions,
          confirmation_type: data.confirmation_type,
          confirmation_links: data.confirmation_links?.map(link =>
            link.isDefault ? { ...link, url: eventLink } : link
          ),
          date_range_kind: data.date_range_kind,
          date_range_value: data.date_range_value,
          date_range_type: data.date_range_type,
          date_range_start: data.date_range_start || null,
          date_range_end: data.date_range_end || null,
          minimum_notice: data.minimum_notice,
          use_custom_schedule: data.use_custom_schedule,
          custom_weekly_hours: data.custom_weekly_hours,
          custom_date_overrides: data.custom_date_overrides,
        });
        setEvents(prev => prev.map(event => event.id === editingEvent.id ? updated : event));
        toast.success('Event type updated successfully');
      } else {
        const finalSlug = data.slug || buildSlug(data.title, events);
        const eventLink = `${window.location.origin}/${userSlug}/${finalSlug}`;
        const newEvent = {
          title: data.title,
          description: data.description || '',
          duration: data.duration,
          slug: finalSlug,
          location_type: 'web_conference',
          location: 'Google Meet',
          type: 'One-on-One',
          color: `bg-[${data.color}]`,
          link: eventLink,
          schedule_id: data.schedule_id,
          buffer_before: data.buffer_before,
          buffer_after: data.buffer_after,
          meeting_limit_count: data.meeting_limit_count,
          meeting_limit_period: data.meeting_limit_period,
          time_increment: data.time_increment || 30,
          timezone_display: data.timezone_display || 'detect',
          invitee_detail_type: data.invitee_detail_type || 'name_email',
          autofill_enabled: data.autofill_enabled ?? true,
          allow_guests: data.allow_guests || false,
          confirmation_type: data.confirmation_type || 'display',
          confirmation_links: (data.confirmation_links || [
            { id: 'default', name: 'Schedule another event', url: '', isDefault: true, status: true },
          ]).map(link => link.isDefault ? { ...link, url: eventLink } : link),
          date_range_kind: data.date_range_kind || 'relative',
          date_range_value: data.date_range_value || 60,
          date_range_type: data.date_range_type || 'calendar_days',
          date_range_start: data.date_range_start || null,
          date_range_end: data.date_range_end || null,
          minimum_notice: data.minimum_notice || 4,
          questions: data.questions || [],
          use_custom_schedule: data.use_custom_schedule || false,
          custom_weekly_hours: data.custom_weekly_hours || null,
          custom_date_overrides: data.custom_date_overrides || null,
        };

        const created = await availabilityService.createEventType(newEvent as any);
        setEvents(prev => [...prev, created]);
        toast.success('Event type created successfully');
      }

      setIsSidebarOpen(false);
      resetDraftEvent();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event type');
    }
  };

  const handleOpenCreate = () => {
    resetDraftEvent();
    setIsSidebarOpen(true);
  };

  const handleEditEvent = (event: EventType) => {
    setEditingEvent(event);
    setNewEventName(event.title);
    setNewEventColor(event.color.startsWith('bg-[') ? event.color.slice(4, -1) : DEFAULT_EVENT_COLOR);
    setIsSidebarOpen(true);
  };

  const navigateToSettings = (tab?: string) => {
    if (tab) setSettingsTab(tab);
    setSidebarTab('Settings');
  };

  const navigateToAvailability = (scheduleId: string) => {
    setSidebarTab('Availability');
    setTargetScheduleId(scheduleId);
    setIsSidebarOpen(false);
  };

  return {
    activeTab,
    editingEvent,
    events,
    handleCopyLink,
    handleCreateEvent,
    handleDelete,
    handleEditEvent,
    handleOpenCreate,
    handleViewLandingPage,
    isLoading,
    isSidebarOpen,
    navigateToAvailability,
    navigateToSettings,
    newEventColor,
    newEventName,
    profile,
    schedules,
    selectedIds,
    setActiveTab,
    setIsSidebarOpen,
    setNewEventColor,
    setNewEventName,
    setProfile,
    setSelectedIds,
    setSidebarTab,
    settingsTab,
    sidebarTab,
    targetScheduleId,
    toggleSelection,
  };
}
