import { Entry, Activities, ActivityType } from '../types';
import { getFeelingLabel } from '../constants/feelings';
import { ACTIVITY_MAP } from '../constants/activities';
import { formatDisplayDate } from './dateUtils';

export const formatActivitySummary = (activities: Activities): string[] => {
  const summaries: string[] = [];

  if (activities.workout) {
    summaries.push(`${activities.workout.type} (${activities.workout.duration}min)`);
  }
  if (activities.travel) {
    summaries.push(`Travel to ${activities.travel.destination}`);
  }
  if (activities.work) {
    summaries.push(`Work: ${activities.work.hours}h`);
  }
  if (activities.social) {
    summaries.push(`${activities.social.activity} with ${activities.social.people}`);
  }
  if (activities.wellness) {
    summaries.push(`${activities.wellness.type}`);
  }
  if (activities.creative) {
    summaries.push(`${activities.creative.type}: ${activities.creative.project}`);
  }
  if (activities.food) {
    const meals = [activities.food.breakfast, activities.food.lunch, activities.food.dinner]
      .filter(Boolean)
      .length;
    summaries.push(`${meals} meal${meals !== 1 ? 's' : ''} logged`);
  }
  if (activities.sleep) {
    summaries.push(`Sleep: ${activities.sleep.quality}`);
  }

  return summaries;
};

export const getActiveActivities = (activities: Activities): ActivityType[] => {
  return (Object.keys(activities) as ActivityType[]).filter((key) => {
    const activity = activities[key];
    if (!activity) return false;

    // Check if the activity has any non-empty values
    return Object.values(activity).some(
      (value) => value !== undefined && value !== null && value !== ''
    );
  });
};

export const formatEntrySummary = (entry: Entry): string => {
  const feeling = getFeelingLabel(entry.feeling);
  const location = entry.location === 'other' ? entry.otherLocationName : entry.location;
  return `${formatDisplayDate(entry.date)} - ${location} - Feeling: ${feeling.label}`;
};

export const getActivityIcon = (type: ActivityType): string => {
  return ACTIVITY_MAP[type]?.icon || '📝';
};

export const getActivityLabel = (type: ActivityType): string => {
  return ACTIVITY_MAP[type]?.label || type;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};
