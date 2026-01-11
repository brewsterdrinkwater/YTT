import { Activities, ActivityType } from './activity';

export interface AutoDetectedLocation {
  name: string;
  coords: {
    latitude: number;
    longitude: number;
  };
  source: 'gps' | 'wifi' | 'ip' | 'pattern';
  confidence: number; // 0-1
  verified: boolean;
  timestamp: string;
}

export interface AutoDetectedActivity {
  type: string;
  source: 'gmail' | 'stripe' | 'calendar' | 'maps';
  data: Record<string, unknown>;
  suggestedFor: ActivityType;
  confidence: number;
  applied: boolean;
}

export interface Entry {
  id: string; // UUID
  date: string; // ISO 8601
  location: string; // "Nashville", "NYC", or custom
  otherLocationName?: string;
  tripType?: 'business' | 'pleasure';
  feeling: number; // 1-10
  highlights?: string;
  activities: Activities;
  autoDetected?: {
    location?: AutoDetectedLocation;
    activities: AutoDetectedActivity[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardItem {
  text: string;
  date: string;
  location: string;
  entryId?: string;
}
