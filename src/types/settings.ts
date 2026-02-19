import { ActivityType } from './activity';

export type AppVersion = 'trust' | 'secure';
export type UIStyle = 'modern' | 'retro' | 'structured';

export interface CustomLocation {
  id: string;
  name: string;
  icon: string;
}

export type EntryFieldType = 'location' | 'feeling' | 'activities' | 'highlights';

export interface AppSettings {
  version: AppVersion;
  autoLocation: boolean;
  locationStyle: 'buttons' | 'dropdown';
  uiStyle: UIStyle;
  apis: {
    gmail: boolean;
    stripe: boolean;
    calendar: boolean;
    mapsTimeline: boolean;
  };
  notifications: {
    enabled: boolean;
    time: string; // HH:mm (default: "18:00")
  };
  activityOrder: ActivityType[];
  theme: 'light' | 'dark' | 'system';
  customLocations: CustomLocation[];
  entryFields: Record<EntryFieldType, boolean>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  version: 'secure',
  autoLocation: false,
  locationStyle: 'buttons',
  uiStyle: 'structured',
  apis: {
    gmail: false,
    stripe: false,
    calendar: false,
    mapsTimeline: false,
  },
  notifications: {
    enabled: true,
    time: '18:00',
  },
  activityOrder: ['workout', 'travel', 'work', 'social', 'wellness', 'creative', 'food', 'sleep'],
  theme: 'light',
  customLocations: [],
  entryFields: {
    location: true,
    feeling: true,
    activities: true,
    highlights: true,
  },
};
