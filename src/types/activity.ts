export interface WorkoutActivity {
  type: string;
  duration: number; // minutes
  intensity: 'light' | 'moderate' | 'intense';
  notes?: string;
}

export interface TravelActivity {
  destination: string;
  transport: string;
  purpose: string;
  notes?: string;
}

export interface WorkActivity {
  projects: string;
  hours: number;
  productivity: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface SocialActivity {
  people: string;
  activity: string;
  location: string;
  notes?: string;
}

export interface WellnessActivity {
  type: string;
  duration: number;
  feeling: string;
  notes?: string;
}

export interface CreativeActivity {
  type: string;
  project: string;
  duration: number;
  notes?: string;
}

export interface FoodActivity {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  notes?: string;
}

export interface SleepActivity {
  bedtime: string; // HH:mm
  waketime: string; // HH:mm
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
}

export interface Activities {
  workout?: WorkoutActivity;
  travel?: TravelActivity;
  work?: WorkActivity;
  social?: SocialActivity;
  wellness?: WellnessActivity;
  creative?: CreativeActivity;
  food?: FoodActivity;
  sleep?: SleepActivity;
}

export type ActivityType = keyof Activities;

export interface ActivityConfig {
  key: ActivityType;
  label: string;
  icon: string;
  color: string;
}
