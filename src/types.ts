export type EventType = {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  slug: string;
  location_type: 'web_conference' | 'in_person' | 'phone';
};

export type Booking = {
  id: string;
  event_type_id: string;
  start_time: string;
  end_time: string;
  attendee_name: string;
  attendee_email: string;
  attendee_whatsapp?: string;
  notes?: string;
  created_at: string;
};

export type Availability = {
  id: string;
  day_of_week: number; // 0-6
  start_time: string; // HH:mm
  end_time: string; // HH:mm
};
