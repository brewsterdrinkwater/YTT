// Deep Research Agent Types

export type PersonCategory =
  | 'artist'
  | 'author'
  | 'actor'
  | 'leader'
  | 'scientist'
  | 'athlete'
  | 'musician'
  | 'other';

export interface Controversy {
  allegation: string;
  year: number;
  source: string;
  outcome: string;
}

export interface Controversies {
  sexualMisconduct: Controversy[];
  domesticViolence: Controversy[];
  racism: Controversy[];
}

export interface LeaderInfo {
  include: boolean;
  highSchool: string | null;
  college: string | null;
  fraternity: string | null;
  positions: string[];
}

export interface TimelineItem {
  year: number;
  title: string;
  type: 'album' | 'book' | 'film' | 'role' | 'achievement' | 'tv' | 'novel' | 'single' | 'other';
  significance: string;
  link: string | null;
}

export interface DeepCut {
  title: string;
  year: number | null;
  why: string;
  link: string | null;
}

export interface Source {
  title: string;
  type: 'primary' | 'secondary';
  url: string | null;
  description: string;
}

export interface ActionLinks {
  spotify: string | null;
  kindle: string | null;
  imdb: string | null;
  wikipedia: string | null;
}

export interface ResearchResult {
  name: string;
  category: PersonCategory;
  birthYear: number | null;
  deathYear: number | null;
  birthPlace: string | null;
  summary: string;
  leaderInfo: LeaderInfo | null;
  famousFor: string[];
  controversies: Controversies;
  timeline: TimelineItem[];
  deepCuts: DeepCut[];
  sources: Source[];
  actionLinks: ActionLinks;
}

// Saved list item types
export interface SpotifyListItem {
  name: string;
  spotifyUrl: string | null;
  addedAt: string;
}

export interface ReadingListItem {
  name: string;
  works: string[];
  kindleUrl: string | null;
  addedAt: string;
}

export interface WatchlistItem {
  name: string;
  works: string[];
  imdbUrl: string | null;
  addedAt: string;
}

export interface HistoryItem {
  name: string;
  category: PersonCategory;
  timestamp: string;
}
