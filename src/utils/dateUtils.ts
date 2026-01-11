import {
  format,
  addDays,
  subDays,
  isToday,
  isYesterday,
  isTomorrow,
  differenceInDays,
  startOfDay,
  endOfDay,
  parseISO,
} from 'date-fns';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
};

export const formatDisplayDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEE, MMM d, yyyy');
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const getRelativeDayLabel = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isTomorrow(date)) return 'Tomorrow';

  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diff = differenceInDays(target, today);

  if (diff < 0) {
    return `${Math.abs(diff)} days ago`;
  }
  return `In ${diff} days`;
};

export const navigateDate = (current: Date, direction: 'prev' | 'next'): Date => {
  return direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
};

export const getDateRange = (date: Date): { start: string; end: string } => {
  return {
    start: startOfDay(date).toISOString(),
    end: endOfDay(date).toISOString(),
  };
};

export const toISODateString = (date: Date): string => {
  return date.toISOString();
};

export { addDays, subDays, isToday, startOfDay, endOfDay, parseISO, format };
