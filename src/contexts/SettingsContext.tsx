import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { AppSettings, DEFAULT_SETTINGS, ActivityType } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../constants/config';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setVersion: (version: 'trust' | 'secure') => void;
  setActivityOrder: (order: ActivityType[]) => void;
  toggleApi: (api: keyof AppSettings['apis']) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    [setSettings]
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, [setSettings]);

  const setVersion = useCallback(
    (version: 'trust' | 'secure') => {
      setSettings((prev) => ({
        ...prev,
        version,
        // If switching to secure mode, disable auto features
        autoLocation: version === 'secure' ? false : prev.autoLocation,
        apis:
          version === 'secure'
            ? { gmail: false, stripe: false, calendar: false, mapsTimeline: false }
            : prev.apis,
      }));
    },
    [setSettings]
  );

  const setActivityOrder = useCallback(
    (order: ActivityType[]) => {
      setSettings((prev) => ({
        ...prev,
        activityOrder: order,
      }));
    },
    [setSettings]
  );

  const toggleApi = useCallback(
    (api: keyof AppSettings['apis']) => {
      setSettings((prev) => ({
        ...prev,
        apis: {
          ...prev.apis,
          [api]: !prev.apis[api],
        },
      }));
    },
    [setSettings]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        setVersion,
        setActivityOrder,
        toggleApi,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
