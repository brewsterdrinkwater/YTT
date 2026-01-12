export const STORAGE_KEYS = {
  ENTRIES: 'ytt-entries',
  SETTINGS: 'ytt-settings',
  APP_VERSION: 'ytt-app-version',
  ACTIVITY_ORDER: 'ytt-activity-order',
  CALENDAR_TOKEN: 'ytt-calendar-token',
  GMAIL_TOKEN: 'ytt-gmail-token',
  LAST_NOTIFICATION: 'ytt-last-notification',
  ONBOARDING_COMPLETE: 'ytt-onboarding-complete',
} as const;

export const LOCATIONS = [
  { id: 'nashville', name: 'Nashville', icon: '🎸' },
  { id: 'nyc', name: 'NYC', icon: '🗽' },
  { id: 'other', name: 'Other', icon: '🌍' },
] as const;

export const TRIP_TYPES = [
  { value: 'business', label: 'Business' },
  { value: 'pleasure', label: 'Pleasure' },
] as const;

export const DASHBOARD_KEYWORDS = {
  food: ['recommend', 'try', 'amazing', 'delicious', 'great', 'love', 'favorite', 'must', 'restaurant', 'food'],
  movies: ['movie', 'film', 'show', 'watched', 'netflix', 'hulu', 'streaming', 'theater', 'cinema'],
  books: ['book', 'read', 'reading', 'novel', 'author', 'finished', 'started'],
  ideas: ['idea', 'insight', 'learned', 'realized', 'thought', 'discovered', 'understood'],
} as const;

export const API_CONFIG = {
  GOOGLE_MAPS_API_URL: 'https://maps.googleapis.com/maps/api',
  GOOGLE_CALENDAR_API_URL: 'https://www.googleapis.com/calendar/v3',
  GOOGLE_GEOLOCATION_API_URL: 'https://www.googleapis.com/geolocation/v1/geolocate',
  GMAIL_API_URL: 'https://gmail.googleapis.com/gmail/v1',
} as const;

export const NOTIFICATION_CONFIG = {
  START_HOUR: 18, // 6 PM
  END_HOUR: 20, // 8 PM
  AUTO_DISMISS_MS: 10000, // 10 seconds
} as const;
