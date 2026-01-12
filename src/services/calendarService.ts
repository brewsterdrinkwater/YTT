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

// Fetch events for a specific date
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

// Initiate Google OAuth flow
export const initiateOAuthFlow = (clientId: string, redirectUri: string): void => {
  const scope = 'https://www.googleapis.com/auth/calendar.readonly';
  const responseType = 'token';

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', responseType);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('prompt', 'consent');

  window.location.href = authUrl.toString();
};

// Parse OAuth callback
export const parseOAuthCallback = (): { accessToken: string; expiresIn: number } | null => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');

  if (accessToken && expiresIn) {
    return {
      accessToken,
      expiresIn: parseInt(expiresIn, 10),
    };
  }

  return null;
};

// Check if token is expired
export const isTokenExpired = (expiresAt: number): boolean => {
  return Date.now() > expiresAt;
};

// Store token securely
export const storeCalendarToken = (accessToken: string, expiresIn: number): void => {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(
    'ytt-calendar-token',
    JSON.stringify({ accessToken, expiresAt })
  );
};

// Retrieve stored token
export const getStoredToken = (): { accessToken: string; expiresAt: number } | null => {
  const stored = localStorage.getItem('ytt-calendar-token');
  if (!stored) return null;

  try {
    const { accessToken, expiresAt } = JSON.parse(stored);
    if (isTokenExpired(expiresAt)) {
      localStorage.removeItem('ytt-calendar-token');
      return null;
    }
    return { accessToken, expiresAt };
  } catch {
    return null;
  }
};

// Clear token
export const clearCalendarToken = (): void => {
  localStorage.removeItem('ytt-calendar-token');
};

export default {
  fetchCalendarEvents,
  initiateOAuthFlow,
  parseOAuthCallback,
  storeCalendarToken,
  getStoredToken,
  clearCalendarToken,
};
