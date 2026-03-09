// Event & Reminder Types

export interface EventReminder {
  id: string;
  type: 'before-start' | 'day-of' | 'week-before' | 'before-end';
  offsetMinutes: number; // minutes before the trigger time
  sent: boolean;
  sentAt: string | null;
}

export interface SharedEvent {
  id: string;
  name: string;
  description: string;
  location: string | null;
  startDate: string; // ISO datetime
  endDate: string | null; // ISO datetime (null for all-day or no end)
  durationMinutes: number | null;
  sharedBy: string; // user ID
  sharedWithPhones: string[];
  reminders: EventReminder[];
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  triggerAt: string; // ISO datetime
  listItemRef: {
    listType: string; // 'places', 'grocery', 'custom-<id>', etc.
    itemId: string;
  } | null;
  eventRef: string | null; // SharedEvent ID
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  sent: boolean;
  sentAt: string | null;
  createdAt: string;
}

// Default event reminders based on user's requirements:
// - 7 days before
// - Day of (morning)
// - 1 hour before start
// - 2 hours before end (if event > 4 hours)
export function createEventReminders(event: { startDate: string; endDate: string | null; durationMinutes: number | null }): EventReminder[] {
  const reminders: EventReminder[] = [
    {
      id: `rem-7d-${Date.now()}`,
      type: 'week-before',
      offsetMinutes: 7 * 24 * 60, // 7 days
      sent: false,
      sentAt: null,
    },
    {
      id: `rem-day-${Date.now()}`,
      type: 'day-of',
      offsetMinutes: 0, // Same day, sent at 9 AM
      sent: false,
      sentAt: null,
    },
    {
      id: `rem-1h-${Date.now()}`,
      type: 'before-start',
      offsetMinutes: 60, // 1 hour before
      sent: false,
      sentAt: null,
    },
  ];

  // Add 2-hour-before-end reminder if event is longer than 4 hours
  const duration = event.durationMinutes;
  if (duration && duration > 240) {
    reminders.push({
      id: `rem-2h-end-${Date.now()}`,
      type: 'before-end',
      offsetMinutes: 120, // 2 hours before end
      sent: false,
      sentAt: null,
    });
  }

  return reminders;
}
