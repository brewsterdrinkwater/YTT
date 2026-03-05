import { CalendarEvent } from '../types';
import { startOfDay, endOfDay } from '../utils/dateUtils';

const GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  description?: string;
}

// Format Google Calendar event to our CalendarEvent type
const formatCalendarEvent = (event: GoogleCalendarEvent): CalendarEvent => {
  const startTime = event.start?.dateTime || event.start?.date || '';
  const endTime = event.end?.dateTime || event.end?.date || '';

  return {
    id: event.id,
    title: event.summary || 'Untitled Event',
    start: startTime,
    end: endTime,
    location: event.location,
    description: event.description,
    source: 'google',
  };
};

/**
 * Fetch events for a specific date using the Supabase Google OAuth provider token.
 * The token is obtained via supabase.auth session (session.provider_token)
 * and is never stored in localStorage.
 */
export const fetchCalendarEvents = async (
  date: Date,
  accessToken: string
): Promise<CalendarEvent[]> => {
  const timeMin = startOfDay(date).toISOString();
  const timeMax = endOfDay(date).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Calendar access token expired');
    }
    throw new Error('Failed to fetch calendar events');
  }

  const data = await response.json();
  return (data.items || []).map(formatCalendarEvent);
};

export default {
  fetchCalendarEvents,
};
