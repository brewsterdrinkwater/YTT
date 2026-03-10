/**
 * InventoryContext
 *
 * Manages inventory items and locations with the same hybrid architecture
 * as ListsContext: localStorage for instant reads, Supabase as the
 * authoritative cloud store.
 *
 * Data is stored in the existing research_lists table as two list_types:
 *  - 'inventory_items'     → InventoryItem[]
 *  - 'inventory_locations' → InventoryLocation[]
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { storageService } from '../services/storageService';
import {
  InventoryItem,
  InventoryLocation,
  InventoryZone,
  InventorySpot,
  InventoryCategory,
} from '../types/inventory';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const STORAGE_KEY_ITEMS = 'ytt-inventory-items';
const STORAGE_KEY_LOCATIONS = 'ytt-inventory-locations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

function loadLocal<T>(key: string): T[] {
  return storageService.get<T[]>(key) ?? [];
}

function saveLocal<T>(key: string, data: T[]): void {
  storageService.set(key, data);
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface InventoryContextType {
  // Data
  items: InventoryItem[];
  locations: InventoryLocation[];

  // Items
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => InventoryItem;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  removeItem: (id: string) => void;

  // Locations (Tier 1)
  addLocation: (name: string) => InventoryLocation;
  updateLocation: (id: string, name: string) => void;
  removeLocation: (id: string) => void;

  // Zones (Tier 2)
  addZone: (locationId: string, name: string) => void;
  updateZone: (locationId: string, zoneId: string, name: string) => void;
  removeZone: (locationId: string, zoneId: string) => void;

  // Spots (Tier 3)
  addSpot: (locationId: string, zoneId: string, name: string) => void;
  updateSpot: (locationId: string, zoneId: string, spotId: string, name: string) => void;
  removeSpot: (locationId: string, zoneId: string, spotId: string) => void;

  // Helpers
  getLocationPath: (locationId: string, zoneId?: string | null, spotId?: string | null) => string;
  getItemsByLocation: (locationId: string, zoneId?: string | null, spotId?: string | null) => InventoryItem[];
  getItemsByCategory: (category: InventoryCategory) => InventoryItem[];
  searchItems: (query: string) => InventoryItem[];
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<InventoryItem[]>(() => loadLocal(STORAGE_KEY_ITEMS));
  const [locations, setLocations] = useState<InventoryLocation[]>(() => loadLocal(STORAGE_KEY_LOCATIONS));

  // ---- Supabase helpers ----

  const saveToSupabase = useCallback(
    (listType: string, data: unknown[], userId: string) => {
      supabase
        .from('research_lists')
        .upsert({ user_id: userId, list_type: listType, items: data }, { onConflict: 'user_id,list_type' })
        .then(({ error }) => {
          if (error) console.error(`[Inventory] Supabase save error (${listType}):`, error);
        });
    },
    []
  );

  // ---- Load from Supabase on login ----

  useEffect(() => {
    if (authLoading || !user) return;

    supabase
      .from('research_lists')
      .select('list_type, items')
      .eq('user_id', user.id)
      .in('list_type', ['inventory_items', 'inventory_locations'])
      .then(({ data, error }) => {
        if (error) {
          console.error('[Inventory] Error loading from Supabase:', error);
          return;
        }
        if (!data) return;

        const existingTypes = new Set(data.map((r) => r.list_type));

        data.forEach(({ list_type, items: serverItems }) => {
          const parsed = (serverItems as unknown[]) ?? [];
          if (list_type === 'inventory_items') {
            setItems(parsed as InventoryItem[]);
            saveLocal(STORAGE_KEY_ITEMS, parsed);
          } else if (list_type === 'inventory_locations') {
            setLocations(parsed as InventoryLocation[]);
            saveLocal(STORAGE_KEY_LOCATIONS, parsed);
          }
        });

        // Upload local data for any type not yet on server
        if (!existingTypes.has('inventory_items')) {
          const local = loadLocal<InventoryItem>(STORAGE_KEY_ITEMS);
          if (local.length > 0) saveToSupabase('inventory_items', local, user.id);
        }
        if (!existingTypes.has('inventory_locations')) {
          const local = loadLocal<InventoryLocation>(STORAGE_KEY_LOCATIONS);
          if (local.length > 0) saveToSupabase('inventory_locations', local, user.id);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // ---- Persist helpers ----

  const persistItems = useCallback(
    (newItems: InventoryItem[]) => {
      setItems(newItems);
      saveLocal(STORAGE_KEY_ITEMS, newItems);
      if (user) saveToSupabase('inventory_items', newItems, user.id);
    },
    [user, saveToSupabase]
  );

  const persistLocations = useCallback(
    (newLocations: InventoryLocation[]) => {
      setLocations(newLocations);
      saveLocal(STORAGE_KEY_LOCATIONS, newLocations);
      if (user) saveToSupabase('inventory_locations', newLocations, user.id);
    },
    [user, saveToSupabase]
  );

  // ---- Items ----

  const addItem = useCallback(
    (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): InventoryItem => {
      const now = new Date().toISOString();
      const newItem: InventoryItem = {
        ...item,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      persistItems([newItem, ...items]);
      return newItem;
    },
    [items, persistItems]
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<InventoryItem>) => {
      persistItems(
        items.map((i) =>
          i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
        )
      );
    },
    [items, persistItems]
  );

  const removeItem = useCallback(
    (id: string) => {
      persistItems(items.filter((i) => i.id !== id));
    },
    [items, persistItems]
  );

  // ---- Locations (Tier 1) ----

  const addLocation = useCallback(
    (name: string): InventoryLocation => {
      const newLoc: InventoryLocation = {
        id: generateId(),
        name,
        zones: [],
        createdAt: new Date().toISOString(),
      };
      persistLocations([...locations, newLoc]);
      return newLoc;
    },
    [locations, persistLocations]
  );

  const updateLocation = useCallback(
    (id: string, name: string) => {
      persistLocations(locations.map((l) => (l.id === id ? { ...l, name } : l)));
    },
    [locations, persistLocations]
  );

  const removeLocation = useCallback(
    (id: string) => {
      persistLocations(locations.filter((l) => l.id !== id));
      // Also remove items at this location
      persistItems(items.filter((i) => i.locationId !== id));
    },
    [locations, persistLocations, items, persistItems]
  );

  // ---- Zones (Tier 2) ----

  const addZone = useCallback(
    (locationId: string, name: string) => {
      persistLocations(
        locations.map((l) =>
          l.id === locationId
            ? { ...l, zones: [...l.zones, { id: generateId(), name, spots: [] }] }
            : l
        )
      );
    },
    [locations, persistLocations]
  );

  const updateZone = useCallback(
    (locationId: string, zoneId: string, name: string) => {
      persistLocations(
        locations.map((l) =>
          l.id === locationId
            ? { ...l, zones: l.zones.map((z) => (z.id === zoneId ? { ...z, name } : z)) }
            : l
        )
      );
    },
    [locations, persistLocations]
  );

  const removeZone = useCallback(
    (locationId: string, zoneId: string) => {
      persistLocations(
        locations.map((l) =>
          l.id === locationId
            ? { ...l, zones: l.zones.filter((z) => z.id !== zoneId) }
            : l
        )
      );
      persistItems(items.filter((i) => !(i.locationId === locationId && i.zoneId === zoneId)));
    },
    [locations, persistLocations, items, persistItems]
  );

  // ---- Spots (Tier 3) ----

  const addSpot = useCallback(
    (locationId: string, zoneId: string, name: string) => {
      persistLocations(
        locations.map((l) =>
          l.id === locationId
            ? {
                ...l,
                zones: l.zones.map((z) =>
                  z.id === zoneId
                    ? { ...z, spots: [...z.spots, { id: generateId(), name }] }
                    : z
                ),
              }
            : l
        )
      );
    },
    [locations, persistLocations]
  );

  const updateSpot = useCallback(
    (locationId: string, zoneId: string, spotId: string, name: string) => {
      persistLocations(
        locations.map((l) =>
          l.id === locationId
            ? {
                ...l,
                zones: l.zones.map((z) =>
                  z.id === zoneId
                    ? { ...z, spots: z.spots.map((s) => (s.id === spotId ? { ...s, name } : s)) }
                    : z
                ),
              }
            : l
        )
      );
    },
    [locations, persistLocations]
  );

  const removeSpot = useCallback(
    (locationId: string, zoneId: string, spotId: string) => {
      persistLocations(
        locations.map((l) =>
          l.id === locationId
            ? {
                ...l,
                zones: l.zones.map((z) =>
                  z.id === zoneId
                    ? { ...z, spots: z.spots.filter((s) => s.id !== spotId) }
                    : z
                ),
              }
            : l
        )
      );
      persistItems(
        items.filter((i) => !(i.locationId === locationId && i.zoneId === zoneId && i.spotId === spotId))
      );
    },
    [locations, persistLocations, items, persistItems]
  );

  // ---- Helpers ----

  const getLocationPath = useCallback(
    (locationId: string, zoneId?: string | null, spotId?: string | null): string => {
      const loc = locations.find((l) => l.id === locationId);
      if (!loc) return 'Unknown';
      const parts = [loc.name];
      if (zoneId) {
        const zone = loc.zones.find((z) => z.id === zoneId);
        if (zone) {
          parts.push(zone.name);
          if (spotId) {
            const spot = zone.spots.find((s) => s.id === spotId);
            if (spot) parts.push(spot.name);
          }
        }
      }
      return parts.join(' > ');
    },
    [locations]
  );

  const getItemsByLocation = useCallback(
    (locationId: string, zoneId?: string | null, spotId?: string | null): InventoryItem[] => {
      return items.filter((i) => {
        if (i.locationId !== locationId) return false;
        if (zoneId && i.zoneId !== zoneId) return false;
        if (spotId && i.spotId !== spotId) return false;
        return true;
      });
    },
    [items]
  );

  const getItemsByCategory = useCallback(
    (category: InventoryCategory): InventoryItem[] => {
      return items.filter((i) => i.category === category);
    },
    [items]
  );

  const searchItems = useCallback(
    (query: string): InventoryItem[] => {
      const q = query.toLowerCase().trim();
      if (!q) return items;
      return items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)) ||
          i.notes.toLowerCase().includes(q) ||
          getLocationPath(i.locationId, i.zoneId, i.spotId).toLowerCase().includes(q)
      );
    },
    [items, getLocationPath]
  );

  // ---- Context value ----

  return (
    <InventoryContext.Provider
      value={{
        items,
        locations,
        addItem,
        updateItem,
        removeItem,
        addLocation,
        updateLocation,
        removeLocation,
        addZone,
        updateZone,
        removeZone,
        addSpot,
        updateSpot,
        removeSpot,
        getLocationPath,
        getItemsByLocation,
        getItemsByCategory,
        searchItems,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within an InventoryProvider');
  return ctx;
};

export default InventoryContext;
