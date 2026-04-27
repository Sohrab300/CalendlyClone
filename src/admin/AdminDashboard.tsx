import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CreateEventSidebar } from './components/CreateEventSidebar';
import { Search, Plus, ExternalLink, Copy, MoreHorizontal, HelpCircle, AlertCircle, Trash2, ToggleLeft, Calendar, X, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

import { MOCK_EVENTS } from '../constants';
import { AvailabilityView } from './components/AvailabilityView';
import { MeetingsView } from './components/MeetingsView';
import { ContactsView } from './components/ContactsView';
import { availabilityService, EventType } from '../services/availabilityService';
import { supabase } from '../lib/supabase';
import { SettingsView } from './components/SettingsView';

export default function AdminDashboard() {
  const [sidebarTab, setSidebarTab] = React.useState('Scheduling');
  const [activeTab, setActiveTab] = React.useState('Event types');
  const [targetScheduleId, setTargetScheduleId] = React.useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [newEventName, setNewEventName] = React.useState('New Meeting');
  const [newEventColor, setNewEventColor] = React.useState('#8247E5'); // Default violet
  const [editingEvent, setEditingEvent] = React.useState<EventType | null>(null);
  const [events, setEvents] = React.useState<EventType[]>([]);
  const [schedules, setSchedules] = React.useState<{ id: string; name: string; is_active: boolean }[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [profile, setProfile] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [settingsTab, setSettingsTab] = React.useState('Profile');

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const userId = user.id;

      let profileQuery = supabase.from('profiles').select('*').eq('id', userId);
      const [eventsData, schedulesData, profileResponse] = await Promise.all([
        availabilityService.getEventTypes(userId),
        availabilityService.getSchedules(userId),
        profileQuery.limit(1).single()
      ]);
      
      const profileData = profileResponse.data;
      setProfile(profileData);

      let finalEvents = eventsData;
      let finalSchedules = schedulesData || [];

      // SEEDING: If this is a brand new user (no events AND no schedules)
      if (eventsData.length === 0 && (!schedulesData || schedulesData.length === 0)) {
        console.log('🌱 New user detected. Seeding default data...');
        
        // 1. Create default schedule
        const defaultSchedule = await availabilityService.createSchedule('Working hours (default)', userId, true);
        finalSchedules = [defaultSchedule];

        // 2. Add default weekly hours
        const defaultHours = [
          { day_index: 0, enabled: false, slots: [] },
          { day_index: 1, enabled: true, slots: [{ id: '1', start: '09:00am', end: '05:00pm' }] },
          { day_index: 2, enabled: true, slots: [{ id: '2', start: '09:00am', end: '05:00pm' }] },
          { day_index: 3, enabled: true, slots: [{ id: '3', start: '09:00am', end: '05:00pm' }] },
          { day_index: 4, enabled: true, slots: [{ id: '4', start: '09:00am', end: '05:00pm' }] },
          { day_index: 5, enabled: true, slots: [{ id: '5', start: '09:00am', end: '05:00pm' }] },
          { day_index: 6, enabled: false, slots: [] },
        ];
        await availabilityService.updateWeeklyHours(defaultSchedule.id, defaultHours);

        // 3. Create mock events
        for (const event of MOCK_EVENTS) {
          const { id, ...rest } = event;
          await availabilityService.createEventType({ 
            ...rest, 
            user_id: userId,
            schedule_id: defaultSchedule.id 
          });
        }
        
        // Refresh events after seeding
        finalEvents = await availabilityService.getEventTypes(userId);
      }

      setEvents(finalEvents);
      setSchedules(finalSchedules);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleCopyLink = (event: any) => {
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
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleCreateEvent = async (data: { 
    title: string; 
    duration: number; 
    color: string; 
    schedule_id: string | null;
    description?: string;
    buffer_before?: number;
    buffer_after?: number;
    meeting_limit_count?: number;
    meeting_limit_period?: string;
    slug?: string;
    time_increment?: number;
    timezone_display?: 'detect' | 'lock';
    invitee_detail_type?: 'name_email' | 'first_last_email';
    autofill_enabled?: boolean;
    allow_guests?: boolean;
    questions?: any[];
    confirmation_type?: 'display' | 'redirect';
    confirmation_links?: any[];
    date_range_kind?: 'relative' | 'range' | 'indefinite';
    date_range_value?: number;
    date_range_type?: 'calendar_days' | 'weekdays';
    date_range_start?: string;
    date_range_end?: string;
    minimum_notice?: number;
    use_custom_schedule?: boolean;
    custom_weekly_hours?: any[];
    custom_date_overrides?: any[];
  }) => {
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
          confirmation_links: data.confirmation_links?.map(l => 
            l.isDefault ? { ...l, url: eventLink } : l
          ),
          date_range_kind: data.date_range_kind,
          date_range_value: data.date_range_value,
          date_range_type: data.date_range_type,
          date_range_start: data.date_range_start || null,
          date_range_end: data.date_range_end || null,
          minimum_notice: data.minimum_notice,
          use_custom_schedule: data.use_custom_schedule,
          custom_weekly_hours: data.custom_weekly_hours,
          custom_date_overrides: data.custom_date_overrides
        });
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e));
        toast.success('Event type updated successfully');
      } else {
        let finalSlug = data.slug;
        
        if (!finalSlug) {
          const baseSlug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
          
          // Check for uniqueness
          finalSlug = baseSlug;
          let counter = 1;
          while (events.some(e => e.slug === finalSlug)) {
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
          }
        }

        const userSlug = profile?.username;
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
            { id: 'default', name: 'Schedule another event', url: '', isDefault: true, status: true }
          ]).map((l: any) => l.isDefault ? { ...l, url: eventLink } : l),
          date_range_kind: data.date_range_kind || 'relative',
          date_range_value: data.date_range_value || 60,
          date_range_type: data.date_range_type || 'calendar_days',
          date_range_start: data.date_range_start || null,
          date_range_end: data.date_range_end || null,
          minimum_notice: data.minimum_notice || 4,
          questions: data.questions || [],
          use_custom_schedule: data.use_custom_schedule || false,
          custom_weekly_hours: data.custom_weekly_hours || null,
          custom_date_overrides: data.custom_date_overrides || null
        };
        
        const created = await availabilityService.createEventType(newEvent as any);
        setEvents(prev => [...prev, created]);
        toast.success('Event type created successfully');
      }
      setIsSidebarOpen(false);
      setEditingEvent(null);
      setNewEventName('New Meeting');
      setNewEventColor('#8247E5');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event type');
    }
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setNewEventName('New Meeting');
    setNewEventColor('#8247E5');
    setIsSidebarOpen(true);
  };

  const handleEditEvent = (event: EventType) => {
    setEditingEvent(event);
    setNewEventName(event.title);
    const hex = event.color.startsWith('bg-[') ? event.color.slice(4, -1) : '#8247E5';
    setNewEventColor(hex);
    setIsSidebarOpen(true);
  };

  const tabs = ['Event types', 'Single-use links', 'Meeting polls'];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (sidebarTab === 'Settings') {
    return (
      <SettingsView 
        onBack={() => setSidebarTab('Scheduling')} 
        onProfileUpdate={(updated) => setProfile(updated)}
        initialTab={settingsTab}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900 relative">
      <Sidebar 
        activeTab={sidebarTab} 
        onTabChange={setSidebarTab} 
        onCreateClick={handleOpenCreate} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          profile={profile}
          onNavigateToSettings={(tab) => {
            if (tab) setSettingsTab(tab);
            setSidebarTab('Settings');
          }} 
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {sidebarTab === 'Scheduling' ? (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">Scheduling</h1>
                  <HelpCircle className="w-5 h-5 text-slate-400 cursor-pointer" />
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create</span>
                  <span className="border-l border-white/30 pl-2 ml-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
              </div>

              <div className="border-b border-slate-200 mb-6">
                <div className="flex gap-8">
                  {tabs.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-4 text-sm font-bold transition-all relative ${
                        activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search event types"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold overflow-hidden">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (profile?.full_name?.[0] || 'S').toUpperCase()
                      )}
                    </div>
                    <span className="font-bold text-slate-800">{profile?.full_name || 'Sohrab sheikh'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleViewLandingPage}
                      className="text-blue-600 text-sm font-bold flex items-center gap-2 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View landing page
                    </button>
                    <div className="w-px h-4 bg-slate-200" />
                    <MoreHorizontal className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600" />
                  </div>
                </div>

                {isSidebarOpen && (
                  <div className="bg-blue-50/50 border border-blue-200 rounded-lg shadow-sm overflow-hidden flex animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-2" style={{ backgroundColor: newEventColor }} />
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <input 
                            type="checkbox" 
                            disabled
                            className="mt-1.5 w-4 h-4 rounded border-slate-300 text-blue-600 opacity-50" 
                          />
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{newEventName}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                              <AlertCircle className="w-4 h-4 text-orange-500 fill-orange-500 text-white" />
                              <span>30 min • No location set • One-on-One</span>
                            </div>
                            <p className="text-sm text-slate-500">Weekdays, 9 am - 5 pm</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {events.map((event) => (
                  <div 
                    key={event.id}
                    onClick={() => handleEditEvent(event)}
                    className={cn(
                      "bg-white border rounded-lg shadow-sm overflow-hidden flex hover:shadow-md transition-all cursor-pointer group",
                      selectedIds.has(event.id) ? "border-blue-600 bg-blue-50/30" : "border-slate-200"
                    )}
                  >
                    <div 
                      className={cn("w-2", !event.color.startsWith('bg-[') && event.color)} 
                      style={{ backgroundColor: event.color.startsWith('bg-[') ? event.color.slice(4, -1) : undefined }}
                    />
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(event.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelection(event.id);
                            }}
                            className="mt-1.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{event.title}</h3>
                            <p className="text-sm text-slate-500 mb-1">{event.duration} min • {event.location} • {event.type}</p>
                            <p className="text-sm text-slate-500">Weekdays, 9 am - 5 pm</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleCopyLink(event)}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            Copy link
                          </button>
                          <div className="w-px h-6 bg-slate-200" />
                          <MoreHorizontal className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : sidebarTab === 'Meetings' ? (
            <MeetingsView />
          ) : sidebarTab === 'Availability' ? (
            <AvailabilityView initialScheduleId={targetScheduleId} />
          ) : sidebarTab === 'Contacts' ? (
            <ContactsView />
          ) : (
            <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-slate-400">
              <p className="text-lg font-medium">{sidebarTab} content coming soon</p>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 flex items-center gap-6 z-50 min-w-[600px]"
          >
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-full">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">{selectedIds.size}</span>
              <span className="text-sm font-bold text-slate-700">selected</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                <ToggleLeft className="w-4 h-4" />
                Toggle on/off
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="w-px h-6 bg-slate-200 mx-2" />
            
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && (
          <CreateEventSidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            eventName={newEventName}
            setEventName={setNewEventName}
            eventColor={newEventColor}
            setEventColor={setNewEventColor}
            onCreate={handleCreateEvent}
            schedules={schedules}
            editingEvent={editingEvent}
            profile={profile}
            onNavigateToAvailability={(scheduleId) => {
              setSidebarTab('Availability');
              setTargetScheduleId(scheduleId);
              setIsSidebarOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
