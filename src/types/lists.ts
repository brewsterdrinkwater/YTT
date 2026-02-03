// Unified List System Types

// Tag for filtering and categorization
export interface ListTag {
  id: string;
  name: string;
  color: string; // Tailwind color class
}

// Universal list item structure
export interface ListItem {
  id: string;
  name: string;
  completed: boolean;
  details: string; // Links, notes, etc.
  tags: string[]; // Tag IDs
  url?: string; // Optional link to buy/view
  quantity?: number; // For grocery items
  unit?: string; // For grocery items
  addedAt: string;
  completedAt?: string;
}

// List type identifiers
export type ListTypeId =
  | 'grocery'
  | 'watchlist'
  | 'reading'
  | 'restaurants'
  | 'gifts'
  | 'music'
  | 'places'
  | string; // Custom lists

// User list definition
export interface UserList {
  id: string;
  name: string;
  icon: string;
  color: string; // Tailwind bg color class
  typeId: ListTypeId;
  isDefault: boolean; // System default list
  isVisible: boolean; // User can hide lists
  items: ListItem[];
  createdAt: string;
}

// Default list configurations
export const DEFAULT_LISTS: Omit<UserList, 'id' | 'items' | 'createdAt'>[] = [
  {
    name: 'Grocery List',
    icon: '🛒',
    color: 'bg-green-50',
    typeId: 'grocery',
    isDefault: true,
    isVisible: true,
  },
  {
    name: 'Watchlist',
    icon: '🎬',
    color: 'bg-red-50',
    typeId: 'watchlist',
    isDefault: true,
    isVisible: true,
  },
  {
    name: 'Reading List',
    icon: '📚',
    color: 'bg-orange-50',
    typeId: 'reading',
    isDefault: true,
    isVisible: true,
  },
  {
    name: 'Restaurants',
    icon: '🍽️',
    color: 'bg-pink-50',
    typeId: 'restaurants',
    isDefault: true,
    isVisible: true,
  },
  {
    name: 'Gift Ideas',
    icon: '🎁',
    color: 'bg-purple-50',
    typeId: 'gifts',
    isDefault: true,
    isVisible: true,
  },
];

// Default tag colors
export const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-yellow-100 text-yellow-700',
  'bg-red-100 text-red-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
];
