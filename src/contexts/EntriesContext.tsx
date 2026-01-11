import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Entry, Activities } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../constants/config';
import { formatDate } from '../utils/dateUtils';

interface EntriesContextType {
  entries: Entry[];
  currentEntry: Entry | null;
  getEntryByDate: (date: Date) => Entry | undefined;
  getEntryById: (id: string) => Entry | undefined;
  createEntry: (date: Date) => Entry;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  saveEntry: (entry: Entry) => void;
  searchEntries: (query: string) => Entry[];
  filterByLocation: (location: string) => Entry[];
  getOrCreateEntryForDate: (date: Date) => Entry;
}

const EntriesContext = createContext<EntriesContextType | undefined>(undefined);

interface EntriesProviderProps {
  children: ReactNode;
}

export const EntriesProvider: React.FC<EntriesProviderProps> = ({ children }) => {
  const [entries, setEntries] = useLocalStorage<Entry[]>(STORAGE_KEYS.ENTRIES, []);

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
    (entry: Entry) => {
      setEntries((prev) => {
        const existingIndex = prev.findIndex((e) => e.id === entry.id);
        const updatedEntry = {
          ...entry,
          updatedAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
          const newEntries = [...prev];
          newEntries[existingIndex] = updatedEntry;
          return newEntries;
        }
        return [...prev, updatedEntry];
      });
    },
    [setEntries]
  );

  const updateEntry = useCallback(
    (id: string, updates: Partial<Entry>) => {
      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === id);
        if (index < 0) return prev;

        const newEntries = [...prev];
        newEntries[index] = {
          ...newEntries[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return newEntries;
      });
    },
    [setEntries]
  );

  const deleteEntry = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [setEntries]
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

  const currentEntry = useMemo(() => {
    return getEntryByDate(new Date()) || null;
  }, [getEntryByDate]);

  return (
    <EntriesContext.Provider
      value={{
        entries,
        currentEntry,
        getEntryByDate,
        getEntryById,
        createEntry,
        updateEntry,
        deleteEntry,
        saveEntry,
        searchEntries,
        filterByLocation,
        getOrCreateEntryForDate,
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
