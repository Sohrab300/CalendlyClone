import { ConfirmationLink, CustomQuestion } from '../services/availabilityService';

export interface AdminProfile {
  id?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

export interface ScheduleOption {
  id: string;
  name: string;
  is_active: boolean;
}

export type SettingsTab = string;

export interface EventFormData {
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
  questions?: CustomQuestion[];
  confirmation_type?: 'display' | 'redirect';
  confirmation_links?: ConfirmationLink[];
  date_range_kind?: 'relative' | 'range' | 'indefinite';
  date_range_value?: number;
  date_range_type?: 'calendar_days' | 'weekdays';
  date_range_start?: string;
  date_range_end?: string;
  minimum_notice?: number;
  use_custom_schedule?: boolean;
  custom_weekly_hours?: any[];
  custom_date_overrides?: any[];
}
