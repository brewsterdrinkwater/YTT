export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  source: 'google' | 'manual';
}

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface GeocodingResult {
  city: string;
  state?: string;
  country?: string;
  formatted: string;
}

export interface GoogleOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
