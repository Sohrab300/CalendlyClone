import { supabase } from '../lib/supabase';
import { addDays, addMinutes, endOfDay, format, parseISO, startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

export interface DayAvailability {
  day_index: number;
  enabled: boolean;
  slots: TimeSlot[];
}

export interface DateOverride {
  id: string;
  dates: string[]; // ISO strings
  slots: TimeSlot[];
}

export interface Booking {
  id: string;
  event_slug: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  name: string;
  email: string;
  mobile_number: string;
  company_name?: string;
  notes?: string;
  timezone?: string;
  created_at?: string;
  host_notes?: string;
  source?: string;
  job_title?: string;
  linkedin?: string;
  city?: string;
  state?: string;
  country?: string;
  guests?: string[];
  custom_answers?: Record<string, any>;
}

export interface CustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'phone';
  required: boolean;
  status: boolean;
  options?: string[];
  includeOther?: boolean;
}

export interface ConfirmationLink {
  id: string;
  name: string;
  url: string;
  status: boolean;
  isDefault?: boolean;
}

export interface EventType {
  id: string;
  title: string;
  description: string;
  duration: number;
  slug: string;
  location_type: string;
  location: string;
  type: string;
  color: string;
  link: string;
  schedule_id?: string;
  created_at?: string;
  buffer_before?: number;
  buffer_after?: number;
  meeting_limit_count?: number;
  meeting_limit_period?: string;
  time_increment?: number;
  timezone_display?: 'detect' | 'lock';
  invitee_detail_type?: 'name_email' | 'first_last_email';
  autofill_enabled?: boolean;
  allow_guests?: boolean;
  questions?: CustomQuestion[];
  confirmation_type?: 'display' | 'redirect';
  confirmation_links?: ConfirmationLink[];
  date_range_kind?: 'relative' | 'range' | 'indefinite';
  date_range_value?: number;
  date_range_type?: 'calendar_days' | 'weekdays';
  date_range_start?: string;
  date_range_end?: string;
  minimum_notice?: number; // in hours
  require_email_verification?: boolean;
  use_custom_schedule?: boolean;
  custom_weekly_hours?: any[];
  custom_date_overrides?: any[];
}

export interface DayAvailability {
  day_index: number;
  enabled: boolean;
  slots: TimeSlot[];
}

export const availabilityService = {
  async getEventTypes(userId?: string) {
    let query = supabase
      .from('event_types')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as EventType[];
  },

  async createEventType(event: Omit<EventType, 'id'> & { user_id?: string }) {
    const { data, error } = await supabase
      .from('event_types')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEventType(id: string) {
    const { error } = await supabase
      .from('event_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateEventType(id: string, updates: Partial<EventType>) {
    const { data, error } = await supabase
      .from('event_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getActiveSchedule(userId?: string) {
    let query = supabase
      .from('schedules')
      .select('*')
      .eq('is_active', true);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return data;
  },

  async getWeeklyHours(scheduleId: string) {
    const { data, error } = await supabase
      .from('weekly_hours')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('day_index', { ascending: true });

    if (error) throw error;
    return data as DayAvailability[];
  },

  async getDateOverrides(scheduleId: string) {
    const { data, error } = await supabase
      .from('date_overrides')
      .select('*')
      .eq('schedule_id', scheduleId);

    if (error) throw error;
    return data as DateOverride[];
  },

  async getBookings(date: Date, hostId?: string) {
    const start = startOfDay(date).toISOString();
    const end = endOfDay(date).toISOString();

    let query = supabase
      .from('bookings')
      .select('*')
      .gte('start_time', start)
      .lte('start_time', end);
    
    if (hostId) {
      query = query.eq('host_id', hostId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Booking[];
  },

  async getAllBookings(hostId?: string) {
    let query = supabase
      .from('bookings')
      .select('*')
      .order('start_time', { ascending: true });
    
    if (hostId) {
      query = query.eq('host_id', hostId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Booking[];
  },

  async createBooking(booking: Omit<Booking, 'id'> & { host_id: string }) {
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  async updateBooking(id: string, updates: Partial<Booking>) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSchedules(userId?: string) {
    let query = supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createSchedule(name: string, userId: string, isActive: boolean = false) {
    const { data, error } = await supabase
      .from('schedules')
      .insert([{ name, user_id: userId, is_active: isActive }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWeeklyHours(scheduleId: string, hours: DayAvailability[]) {
    // Usually we delete and re-insert or upsert. Let's assume re-insert for simplicity in this logic
    const { error: deleteError } = await supabase
      .from('weekly_hours')
      .delete()
      .eq('schedule_id', scheduleId);
    
    if (deleteError) throw deleteError;

    const { data, error } = await supabase
      .from('weekly_hours')
      .insert(hours.map(h => ({
        schedule_id: scheduleId,
        day_index: h.day_index,
        enabled: h.enabled,
        slots: h.slots
      })))
      .select();

    if (error) throw error;
    return data;
  },

  async getProfile(username: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(id: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const parseTime = (timeStr: string) => {
  const match = timeStr.match(/^(\d+):(\d+)(am|pm)$/);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3];
  if (period === 'pm' && hours !== 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

interface GetAvailableTimeSlotsParams {
  selectedDate: Date;
  is24Hour: boolean;
  weeklyHours: DayAvailability[];
  overrides: DateOverride[];
  bookings?: Booking[];
  duration: number;
  timeIncrement?: number;
  hostTimezone?: string;
  inviteeTimezone: string;
  minimumNotice?: number;
}

export const getAvailableTimeSlots = ({
  selectedDate,
  is24Hour,
  weeklyHours,
  overrides,
  bookings = [],
  duration,
  timeIncrement,
  hostTimezone = "UTC",
  inviteeTimezone,
  minimumNotice = 0,
}: GetAvailableTimeSlotsParams) => {
  const availableSlots: { label: string; minutes: number }[] = [];
  const increment = timeIncrement || 30;
  const now = new Date();
  const noticeThreshold = addMinutes(now, minimumNotice * 60);
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

  [-1, 0, 1].forEach((offset) => {
    const hostDate = addDays(selectedDate, offset);
    const dayIndex = hostDate.getDay();
    const dateStr = format(hostDate, "yyyy-MM-dd");

    const override = overrides.find((o) =>
      o.dates.some((d) => format(new Date(d), "yyyy-MM-dd") === dateStr),
    );

    let activeSlots: { start: string; end: string }[] = [];
    if (override) {
      activeSlots = override.slots;
    } else {
      const dayAvailability = weeklyHours.find((h) => h.day_index === dayIndex);
      if (dayAvailability?.enabled) {
        activeSlots = dayAvailability.slots;
      }
    }

    activeSlots.forEach((range) => {
      const startMinutes = parseTime(range.start);
      const endMinutes = parseTime(range.end);

      for (let m = startMinutes; m + duration <= endMinutes; m += increment) {
        const hostDateTimeStr = `${dateStr} ${Math.floor(m / 60)
          .toString()
          .padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}:00`;

        const utcDate = fromZonedTime(hostDateTimeStr, hostTimezone);
        const inviteeZonedDate = toZonedTime(utcDate, inviteeTimezone);
        const inviteeDateStr = format(inviteeZonedDate, "yyyy-MM-dd");

        if (inviteeDateStr !== selectedDateStr || utcDate < noticeThreshold) {
          continue;
        }

        const slotEnd = addMinutes(utcDate, duration);
        const isBooked = bookings.some((booking) => {
          const bStart = parseISO(booking.start_time);
          const bEnd = parseISO(booking.end_time);

          return (
            (utcDate >= bStart && utcDate < bEnd) ||
            (slotEnd > bStart && slotEnd <= bEnd) ||
            (bStart >= utcDate && bStart < slotEnd)
          );
        });

        if (!isBooked) {
          const label = format(inviteeZonedDate, is24Hour ? "HH:mm" : "h:mmaaa");
          availableSlots.push({
            label,
            minutes:
              inviteeZonedDate.getHours() * 60 + inviteeZonedDate.getMinutes(),
          });
        }
      }
    });
  });

  const uniqueSlots = Array.from(
    new Map(availableSlots.map((slot) => [slot.label, slot])).values(),
  );

  return uniqueSlots.sort((a, b) => a.minutes - b.minutes);
};

export const formatTime = (totalMinutes: number, is24Hour: boolean = false) => {
  let h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  
  if (is24Hour) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  const period = h < 12 ? 'am' : 'pm';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m === 0 ? '00' : m.toString().padStart(2, '0');
  return `${displayH}:${displayM}${period}`;
};
