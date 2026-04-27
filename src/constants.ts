import { EventType } from './types';

export const MOCK_EVENTS: any[] = [
  {
    id: '1',
    title: '30 Minute Meeting',
    description: 'A quick call to discuss your project requirements and how we can help.',
    duration: 30,
    slug: '30-minute-meeting',
    location_type: 'web_conference',
    location: 'Google Meet',
    type: 'One-on-One',
    color: 'bg-indigo-600',
    time_increment: 30,
    timezone_display: 'detect'
  },
  {
    id: '2',
    title: '15 Minute Quick Chat',
    description: 'A brief introduction and overview of our services.',
    duration: 15,
    slug: '15-minute-quick-chat',
    location_type: 'web_conference',
    location: 'Zoom',
    type: 'One-on-One',
    color: 'bg-emerald-500',
    time_increment: 30,
    timezone_display: 'detect'
  },
  {
    id: '3',
    title: 'Product Demo',
    description: 'A detailed walkthrough of our product features and capabilities.',
    duration: 60,
    slug: 'product-demo',
    location_type: 'web_conference',
    location: 'Phone Call',
    type: 'One-on-One',
    color: 'bg-orange-500',
    time_increment: 30,
    timezone_display: 'detect'
  }
];
