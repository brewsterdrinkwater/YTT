import { ActivityConfig, ActivityType } from '../types';

export const ACTIVITIES: ActivityConfig[] = [
  {
    key: 'workout',
    label: 'Workout',
    icon: '🏋️',
    color: '#4caf50',
  },
  {
    key: 'travel',
    label: 'Travel',
    icon: '✈️',
    color: '#2196f3',
  },
  {
    key: 'work',
    label: 'Work',
    icon: '💼',
    color: '#9c27b0',
  },
  {
    key: 'social',
    label: 'Social',
    icon: '👥',
    color: '#ff9800',
  },
  {
    key: 'wellness',
    label: 'Wellness',
    icon: '🧘',
    color: '#00bcd4',
  },
  {
    key: 'creative',
    label: 'Creative',
    icon: '🎨',
    color: '#e91e63',
  },
  {
    key: 'food',
    label: 'Food',
    icon: '🍽️',
    color: '#ff5722',
  },
  {
    key: 'sleep',
    label: 'Sleep',
    icon: '😴',
    color: '#673ab7',
  },
];

export const ACTIVITY_MAP: Record<ActivityType, ActivityConfig> = ACTIVITIES.reduce(
  (acc, activity) => ({
    ...acc,
    [activity.key]: activity,
  }),
  {} as Record<ActivityType, ActivityConfig>
);

export const INTENSITY_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'intense', label: 'Intense' },
];

export const PRODUCTIVITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const SLEEP_QUALITY_OPTIONS = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' },
];

export const WELLNESS_FEELING_OPTIONS = [
  { value: 'refreshed', label: 'Refreshed' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'energized', label: 'Energized' },
  { value: 'calm', label: 'Calm' },
];
