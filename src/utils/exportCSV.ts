import { Entry } from '../types';
import { getFeelingLabel } from '../constants/feelings';
import { format, parseISO } from 'date-fns';

const CSV_HEADERS = [
  'Date',
  'Day',
  'Location',
  'Trip_Type',
  'Feeling',
  'Feeling_Label',
  'Workout_Type',
  'Workout_Duration',
  'Workout_Intensity',
  'Social_Activity',
  'Social_People',
  'Social_Location',
  'Food_Breakfast',
  'Food_Lunch',
  'Food_Dinner',
  'Travel_Destination',
  'Travel_Transport',
  'Work_Projects',
  'Work_Hours',
  'Work_Productivity',
  'Creative_Type',
  'Creative_Project',
  'Creative_Duration',
  'Wellness_Type',
  'Wellness_Duration',
  'Sleep_Quality',
  'Sleep_Bedtime',
  'Sleep_Waketime',
  'Highlights',
  'Notes',
];

const escapeCSV = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // Escape double quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const formatEntryAsRow = (entry: Entry): string => {
  const date = parseISO(entry.date);
  const feeling = getFeelingLabel(entry.feeling);

  const values = [
    format(date, 'yyyy-MM-dd'),
    format(date, 'EEEE'),
    entry.location === 'other' ? entry.otherLocationName : entry.location,
    entry.tripType || '',
    entry.feeling,
    feeling.label,
    entry.activities.workout?.type || '',
    entry.activities.workout?.duration || '',
    entry.activities.workout?.intensity || '',
    entry.activities.social?.activity || '',
    entry.activities.social?.people || '',
    entry.activities.social?.location || '',
    entry.activities.food?.breakfast || '',
    entry.activities.food?.lunch || '',
    entry.activities.food?.dinner || '',
    entry.activities.travel?.destination || '',
    entry.activities.travel?.transport || '',
    entry.activities.work?.projects || '',
    entry.activities.work?.hours || '',
    entry.activities.work?.productivity || '',
    entry.activities.creative?.type || '',
    entry.activities.creative?.project || '',
    entry.activities.creative?.duration || '',
    entry.activities.wellness?.type || '',
    entry.activities.wellness?.duration || '',
    entry.activities.sleep?.quality || '',
    entry.activities.sleep?.bedtime || '',
    entry.activities.sleep?.waketime || '',
    entry.highlights || '',
    collectNotes(entry),
  ];

  return values.map(escapeCSV).join(',');
};

const collectNotes = (entry: Entry): string => {
  const notes: string[] = [];
  const activities = entry.activities;

  if (activities.workout?.notes) notes.push(`Workout: ${activities.workout.notes}`);
  if (activities.travel?.notes) notes.push(`Travel: ${activities.travel.notes}`);
  if (activities.work?.notes) notes.push(`Work: ${activities.work.notes}`);
  if (activities.social?.notes) notes.push(`Social: ${activities.social.notes}`);
  if (activities.wellness?.notes) notes.push(`Wellness: ${activities.wellness.notes}`);
  if (activities.creative?.notes) notes.push(`Creative: ${activities.creative.notes}`);
  if (activities.food?.notes) notes.push(`Food: ${activities.food.notes}`);
  if (activities.sleep?.notes) notes.push(`Sleep: ${activities.sleep.notes}`);

  return notes.join(' | ');
};

export const exportToCSV = (entries: Entry[]): void => {
  const rows = entries.map(formatEntryAsRow);
  const csvContent = [CSV_HEADERS.join(','), ...rows].join('\n');

  downloadCSV(csvContent, `ytt-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
};

const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateCSVPreview = (entries: Entry[], maxRows = 5): string => {
  const rows = entries.slice(0, maxRows).map(formatEntryAsRow);
  return [CSV_HEADERS.join(','), ...rows].join('\n');
};
