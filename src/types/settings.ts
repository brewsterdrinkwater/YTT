import { ActivityType } from './activity';

export type AppVersion = 'trust' | 'secure';

export interface AppSettings {
  version: AppVersion;
  autoLocation: boolean;
  locationStyle: 'buttons' | 'dropdown';
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
}

export const DEFAULT_SETTINGS: AppSettings = {
  version: 'secure',
  autoLocation: false,
  locationStyle: 'buttons',
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
};
