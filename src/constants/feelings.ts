export interface FeelingLabel {
  value: number;
  label: string;
  emoji: string;
}

export const FEELINGS: FeelingLabel[] = [
  { value: 1, label: 'Shit', emoji: '💩' },
  { value: 2, label: 'Terrible', emoji: '😰' },
  { value: 3, label: 'Bad', emoji: '😔' },
  { value: 4, label: 'Not great', emoji: '😕' },
  { value: 5, label: 'Meh', emoji: '😐' },
  { value: 6, label: 'Okay', emoji: '🙂' },
  { value: 7, label: 'Good', emoji: '😊' },
  { value: 8, label: 'Great', emoji: '😄' },
  { value: 9, label: 'Awesome', emoji: '🤩' },
  { value: 10, label: 'Best day ever', emoji: '🎉' },
];

export const getFeelingLabel = (value: number): FeelingLabel => {
  // Handle unset state (0)
  if (value === 0) {
    return { value: 0, label: 'Tap to set', emoji: '❓' };
  }
  const feeling = FEELINGS.find((f) => f.value === value);
  return feeling || FEELINGS[4]; // Default to "Meh"
};

export const getFeelingColor = (value: number): string => {
  if (value === 0) return '#9ca3af'; // Gray for unset
  if (value <= 2) return '#f44336'; // Red
  if (value <= 4) return '#ff9800'; // Orange
  if (value <= 6) return '#ffeb3b'; // Yellow
  if (value <= 8) return '#8bc34a'; // Light green
  return '#4caf50'; // Green
};
