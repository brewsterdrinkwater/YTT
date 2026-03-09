// Custom List Types

export type CustomFieldType = 'text' | 'number' | 'boolean' | 'url' | 'date' | 'select';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[]; // For 'select' type
}

export interface CustomListItem {
  id: string;
  name: string;
  checked: boolean;
  fields: Record<string, string | number | boolean>;
  addedAt: string;
}

export interface CustomList {
  id: string;
  name: string;
  icon: string;
  color: string;
  template: string | null; // template ID or null for fully custom
  fields: CustomFieldDefinition[];
  items: CustomListItem[];
  createdAt: string;
  updatedAt: string;
}

// Predefined templates
export interface ListTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  fields: Omit<CustomFieldDefinition, 'id'>[];
}

export const LIST_TEMPLATES: ListTemplate[] = [
  {
    id: 'gift-list',
    name: 'Gift List',
    icon: '🎁',
    color: 'bg-pink-100 border-pink-500',
    description: 'Track gift ideas for someone special',
    fields: [
      { name: 'Price', type: 'number', required: false },
      { name: 'Link', type: 'url', required: false },
      { name: 'For', type: 'text', required: false },
      { name: 'Occasion', type: 'select', required: false, options: ['Birthday', 'Anniversary', 'Holiday', 'Just Because', 'Other'] },
      { name: 'Purchased', type: 'boolean', required: false },
    ],
  },
  {
    id: 'todo',
    name: 'To-Do List',
    icon: '✅',
    color: 'bg-blue-100 border-blue-500',
    description: 'Simple task tracking',
    fields: [
      { name: 'Due Date', type: 'date', required: false },
      { name: 'Priority', type: 'select', required: false, options: ['Low', 'Medium', 'High'] },
      { name: 'Notes', type: 'text', required: false },
    ],
  },
  {
    id: 'bucket-list',
    name: 'Bucket List',
    icon: '🪣',
    color: 'bg-yellow-100 border-yellow-500',
    description: 'Things to do before you die',
    fields: [
      { name: 'Category', type: 'select', required: false, options: ['Travel', 'Adventure', 'Career', 'Personal', 'Creative'] },
      { name: 'Target Date', type: 'date', required: false },
      { name: 'Notes', type: 'text', required: false },
      { name: 'Done', type: 'boolean', required: false },
    ],
  },
  {
    id: 'wish-list',
    name: 'Wish List',
    icon: '⭐',
    color: 'bg-purple-100 border-purple-500',
    description: 'Things you want for yourself',
    fields: [
      { name: 'Price', type: 'number', required: false },
      { name: 'Link', type: 'url', required: false },
      { name: 'Priority', type: 'select', required: false, options: ['Want', 'Need', 'Dream'] },
      { name: 'Purchased', type: 'boolean', required: false },
    ],
  },
  {
    id: 'blank',
    name: 'Blank List',
    icon: '📝',
    color: 'bg-gray-100 border-gray-500',
    description: 'Start from scratch with custom fields',
    fields: [],
  },
];

export const CUSTOM_LIST_ICONS = [
  '🎁', '✅', '🪣', '⭐', '📝', '💡', '🎯', '🏆',
  '💝', '🌹', '🎉', '🎂', '🛍️', '👗', '💍', '🧸',
  '🏠', '🚗', '🎮', '🎨', '🎼', '📸', '🧘', '🌱',
];

export const CUSTOM_LIST_COLORS = [
  'bg-pink-100 border-pink-500',
  'bg-blue-100 border-blue-500',
  'bg-yellow-100 border-yellow-500',
  'bg-purple-100 border-purple-500',
  'bg-green-100 border-green-500',
  'bg-red-100 border-red-500',
  'bg-orange-100 border-orange-500',
  'bg-indigo-100 border-indigo-500',
];
