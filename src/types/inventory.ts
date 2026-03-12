// Inventory Types

export interface InventoryLocation {
  id: string;
  name: string;       // e.g., "NYC Apartment"
  zones: InventoryZone[];
  createdAt: string;
}

export interface InventoryZone {
  id: string;
  name: string;       // e.g., "Bedroom", "Garage"
  spots: InventorySpot[];
}

export interface InventorySpot {
  id: string;
  name: string;       // e.g., "Closet shelf", "Box #3"
}

export type InventoryCategory =
  | 'clothing'
  | 'bags_accessories'
  | 'art_decor'
  | 'electronics'
  | 'furniture'
  | 'documents'
  | 'sports_outdoor'
  | 'shoes'
  | 'jewelry_watches'
  | 'kitchenware'
  | 'other';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: InventoryCategory;
  locationId: string;       // Tier 1
  zoneId: string | null;    // Tier 2 (optional)
  spotId: string | null;    // Tier 3 (optional)
  imageUrl: string | null;  // Photo URL or base64 data URI
  productUrl: string | null; // Link to product page
  tags: string[];
  quantity: number;
  estimatedValue: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const INVENTORY_CATEGORIES: Record<InventoryCategory, { label: string; icon: string; color: string }> = {
  clothing: { label: 'Clothing', icon: '👔', color: 'bg-blue-100 border-blue-400 text-blue-700' },
  shoes: { label: 'Shoes', icon: '👟', color: 'bg-amber-100 border-amber-400 text-amber-700' },
  bags_accessories: { label: 'Bags & Accessories', icon: '👜', color: 'bg-pink-100 border-pink-400 text-pink-700' },
  jewelry_watches: { label: 'Jewelry & Watches', icon: '💎', color: 'bg-purple-100 border-purple-400 text-purple-700' },
  art_decor: { label: 'Art & Decor', icon: '🎨', color: 'bg-rose-100 border-rose-400 text-rose-700' },
  electronics: { label: 'Electronics & Machines', icon: '💻', color: 'bg-cyan-100 border-cyan-400 text-cyan-700' },
  furniture: { label: 'Furniture', icon: '🛋️', color: 'bg-emerald-100 border-emerald-400 text-emerald-700' },
  kitchenware: { label: 'Kitchenware', icon: '🍳', color: 'bg-orange-100 border-orange-400 text-orange-700' },
  documents: { label: 'Documents', icon: '📄', color: 'bg-slate-100 border-slate-400 text-slate-700' },
  sports_outdoor: { label: 'Sports & Outdoor', icon: '⚽', color: 'bg-green-100 border-green-400 text-green-700' },
  other: { label: 'Other', icon: '📦', color: 'bg-gray-100 border-gray-400 text-gray-700' },
};

export interface InventoryData {
  items: InventoryItem[];
  locations: InventoryLocation[];
}
