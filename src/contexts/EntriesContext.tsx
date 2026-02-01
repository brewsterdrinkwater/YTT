import React, { createContext, useContext, useCallback, useMemo, ReactNode, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Entry, Activities } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../constants/config';
import { formatDate } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface EntriesContextType {
  entries: Entry[];
  currentEntry: Entry | null;
  loading: boolean;
  getEntryByDate: (date: Date) => Entry | undefined;
  getEntryById: (id: string) => Entry | undefined;
  createEntry: (date: Date) => Entry;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  saveEntry: (entry: Entry) => void;
  searchEntries: (query: string) => Entry[];
  filterByLocation: (location: string) => Entry[];
  getOrCreateEntryForDate: (date: Date) => Entry;
  exportToCSV: (startDate?: Date, endDate?: Date) => void;
  migrateFromLocalStorage: () => Promise<number>;
}

const EntriesContext = createContext<EntriesContextType | undefined>(undefined);

interface EntriesProviderProps {
  children: ReactNode;
}

export const EntriesProvider: React.FC<EntriesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep localStorage for offline/migration purposes
  const [localEntries] = useLocalStorage<Entry[]>(STORAGE_KEYS.ENTRIES, []);

  // Load entries from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const loadEntries = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) {
          console.error('Error loading entries:', error);
          return;
        }

        // Transform from DB format to app format
        const transformedEntries: Entry[] = (data || []).map((row) => ({
          id: row.id,
          date: new Date(row.date).toISOString(),
          location: row.location,
          otherLocationName: row.other_location_name,
          tripType: row.trip_type,
          feeling: row.feeling,
          highlights: row.highlights,
          activities: row.activities || {},
          autoDetected: row.auto_detected,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        setEntries(transformedEntries);
      } catch (err) {
        console.error('Error loading entries:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [user]);

  const getEntryByDate = useCallback(
    (date: Date): Entry | undefined => {
      const dateStr = formatDate(date);
      return entries.find((e) => e.date.startsWith(dateStr));
    },
    [entries]
  );

  const getEntryById = useCallback(
    (id: string): Entry | undefined => {
      return entries.find((e) => e.id === id);
    },
    [entries]
  );

  const createEntry = useCallback((date: Date): Entry => {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      date: date.toISOString(),
      location: '',
      feeling: 5,
      activities: {},
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  const getOrCreateEntryForDate = useCallback(
    (date: Date): Entry => {
      const existing = getEntryByDate(date);
      if (existing) return existing;
      return createEntry(date);
    },
    [getEntryByDate, createEntry]
  );

  const saveEntry = useCallback(
    async (entry: Entry) => {
      if (!user) return;

      const now = new Date().toISOString();
      const updatedEntry = {
        ...entry,
        updatedAt: now,
      };

      // Update local state immediately
      setEntries((prev) => {
        const existingIndex = prev.findIndex((e) => e.id === entry.id);
        if (existingIndex >= 0) {
          const newEntries = [...prev];
          newEntries[existingIndex] = updatedEntry;
          return newEntries;
        }
        return [...prev, updatedEntry];
      });

      // Sync to Supabase
      try {
        const dbEntry = {
          id: entry.id,
          user_id: user.id,
          date: entry.date.split('T')[0], // Just the date part
          location: entry.location,
          other_location_name: entry.otherLocationName || null,
          trip_type: entry.tripType || null,
          feeling: entry.feeling,
          highlights: entry.highlights || null,
          activities: entry.activities,
          auto_detected: entry.autoDetected || null,
        };

        const { error } = await supabase
          .from('entries')
          .upsert(dbEntry, { onConflict: 'user_id,date' });

        if (error) {
          console.error('Error saving entry:', error);
        }
      } catch (err) {
        console.error('Error saving entry:', err);
      }
    },
    [user]
  );

  const updateEntry = useCallback(
    (id: string, updates: Partial<Entry>) => {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        saveEntry({ ...entry, ...updates });
      }
    },
    [entries, saveEntry]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!user) return;

      // Update local state
      setEntries((prev) => prev.filter((e) => e.id !== id));

      // Delete from Supabase
      try {
        const { error } = await supabase
          .from('entries')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting entry:', error);
        }
      } catch (err) {
        console.error('Error deleting entry:', err);
      }
    },
    [user]
  );

  const searchEntries = useCallback(
    (query: string): Entry[] => {
      if (!query.trim()) return entries;

      const lowerQuery = query.toLowerCase();
      return entries.filter((entry) => {
        // Search in location
        if (entry.location.toLowerCase().includes(lowerQuery)) return true;
        if (entry.otherLocationName?.toLowerCase().includes(lowerQuery)) return true;

        // Search in highlights
        if (entry.highlights?.toLowerCase().includes(lowerQuery)) return true;

        // Search in activities
        const activities = entry.activities as Activities;
        for (const key of Object.keys(activities)) {
          const activity = activities[key as keyof Activities];
          if (activity) {
            const activityStr = JSON.stringify(activity).toLowerCase();
            if (activityStr.includes(lowerQuery)) return true;
          }
        }

        return false;
      });
    },
    [entries]
  );

  const filterByLocation = useCallback(
    (location: string): Entry[] => {
      if (!location || location === 'all') return entries;
      return entries.filter((e) => {
        if (location === 'other') {
          return e.location === 'other';
        }
        return e.location.toLowerCase() === location.toLowerCase();
      });
    },
    [entries]
  );

  // CSV Export function
  const exportToCSV = useCallback(
    (startDate?: Date, endDate?: Date) => {
      let filteredEntries = entries;

      if (startDate) {
        filteredEntries = filteredEntries.filter(
          (e) => new Date(e.date) >= startDate
        );
      }
      if (endDate) {
        filteredEntries = filteredEntries.filter(
          (e) => new Date(e.date) <= endDate
        );
      }

      // Sort by date
      filteredEntries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Build CSV headers
      const headers = [
        'Date',
        'Location',
        'Other Location',
        'Trip Type',
        'Feeling (1-10)',
        'Highlights',
        'Latitude',
        'Longitude',
        'Workout Type',
        'Workout Duration (mins)',
        'Workout Intensity',
        'Travel Destination',
        'Travel Transport',
        'Travel Purpose',
        'Work Projects',
        'Work Hours',
        'Work Productivity',
        'Social People',
        'Social Activity',
        'Social Location',
        'Wellness Type',
        'Wellness Duration (mins)',
        'Wellness Feeling',
        'Creative Type',
        'Creative Project',
        'Creative Duration (mins)',
        'Food Breakfast',
        'Food Lunch',
        'Food Dinner',
        'Sleep Bedtime',
        'Sleep Waketime',
        'Sleep Quality',
      ];

      // Build CSV rows
      const rows = filteredEntries.map((entry) => {
        const a = entry.activities;
        const loc = entry.autoDetected?.location;

        return [
          entry.date.split('T')[0],
          entry.location,
          entry.otherLocationName || '',
          entry.tripType || '',
          entry.feeling,
          entry.highlights || '',
          loc?.coords?.latitude || '',
          loc?.coords?.longitude || '',
          a.workout?.type || '',
          a.workout?.duration || '',
          a.workout?.intensity || '',
          a.travel?.destination || '',
          a.travel?.transport || '',
          a.travel?.purpose || '',
          a.work?.projects || '',
          a.work?.hours || '',
          a.work?.productivity || '',
          a.social?.people || '',
          a.social?.activity || '',
          a.social?.location || '',
          a.wellness?.type || '',
          a.wellness?.duration || '',
          a.wellness?.feeling || '',
          a.creative?.type || '',
          a.creative?.project || '',
          a.creative?.duration || '',
          a.food?.breakfast || '',
          a.food?.lunch || '',
          a.food?.dinner || '',
          a.sleep?.bedtime || '',
          a.sleep?.waketime || '',
          a.sleep?.quality || '',
        ];
      });

      // Convert to CSV string
      const escapeCSV = (val: string | number) => {
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csv = [
        headers.map(escapeCSV).join(','),
        ...rows.map((row) => row.map(escapeCSV).join(',')),
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ytt-export-${formatDate(new Date())}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [entries]
  );

  // Migrate data from localStorage to Supabase
  const migrateFromLocalStorage = useCallback(async (): Promise<number> => {
    if (!user || localEntries.length === 0) return 0;

    let migrated = 0;

    for (const entry of localEntries) {
      // Check if entry already exists for this date
      const existingEntry = entries.find(
        (e) => e.date.split('T')[0] === entry.date.split('T')[0]
      );

      if (!existingEntry) {
        await saveEntry(entry);
        migrated++;
      }
    }

    return migrated;
  }, [user, localEntries, entries, saveEntry]);

  const currentEntry = useMemo(() => {
    return getEntryByDate(new Date()) || null;
  }, [getEntryByDate]);

  return (
    <EntriesContext.Provider
      value={{
        entries,
        currentEntry,
        loading,
        getEntryByDate,
        getEntryById,
        createEntry,
        updateEntry,
        deleteEntry,
        saveEntry,
        searchEntries,
        filterByLocation,
        getOrCreateEntryForDate,
        exportToCSV,
        migrateFromLocalStorage,
      }}
    >
      {children}
    </EntriesContext.Provider>
  );
};

export const useEntries = (): EntriesContextType => {
  const context = useContext(EntriesContext);
  if (!context) {
    throw new Error('useEntries must be used within an EntriesProvider');
  }
  return context;
};

export default EntriesContext;
