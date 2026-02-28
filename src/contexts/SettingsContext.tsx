import React, { createContext, useContext, useCallback, ReactNode, useState, useEffect } from 'react';
import { AppSettings, DEFAULT_SETTINGS, ActivityType } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../constants/config';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: AppSettings;
  settingsLoading: boolean;
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
  const { user, loading: authLoading } = useAuth();
  const [localSettings, setLocalSettings] = useLocalStorage<AppSettings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );
  // settingsLoading stays true until we've resolved settings from Supabase
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Save settings to Supabase in the background (fire-and-forget)
  const saveToSupabase = useCallback(
    (newSettings: AppSettings, userId: string) => {
      supabase
        .from('user_settings')
        .upsert({ user_id: userId, settings: newSettings }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) console.error('[Settings] Supabase save error:', error);
        });
    },
    []
  );

  // Load settings from Supabase when auth finishes and user is known
  useEffect(() => {
    // Wait for auth to fully resolve before deciding what to do
    if (authLoading) return;

    if (!user) {
      // Not logged in — keep localStorage settings, stop loading
      setSettingsLoading(false);
      return;
    }

    // User is logged in — fetch their settings from Supabase
    setSettingsLoading(true);

    // Check the legacy onboarding flag for users upgrading from the old system
    const legacyOnboardingDone = localStorage.getItem('ytt-onboarding-complete') === 'true';

    (async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[Settings] Error loading from Supabase:', error);
          // Fall back to localStorage, but still apply legacy migration
          if (legacyOnboardingDone && !localSettings.onboardingComplete) {
            setLocalSettings({ ...localSettings, onboardingComplete: true });
          }
          setSettingsLoading(false);
          return;
        }

        if (data?.settings) {
          // Supabase has settings — merge with DEFAULT_SETTINGS to pick up any
          // new fields added since the user last saved, then apply.
          // Also migrate the legacy onboarding flag if the server record predates this field.
          const merged: AppSettings = {
            ...DEFAULT_SETTINGS,
            ...data.settings,
            onboardingComplete: data.settings.onboardingComplete ?? legacyOnboardingDone,
          };
          setLocalSettings(merged); // sync to localStorage too
          // If we migrated the flag, persist the update back to Supabase
          if (merged.onboardingComplete !== data.settings.onboardingComplete) {
            saveToSupabase(merged, user.id);
          }
        } else {
          // First time this user logs in on this device (or no server record yet).
          // Build the settings to upload, migrating the legacy flag if needed.
          const toUpload: AppSettings = {
            ...DEFAULT_SETTINGS,
            ...localSettings,
            onboardingComplete: localSettings.onboardingComplete ?? legacyOnboardingDone,
          };
          setLocalSettings(toUpload);
          saveToSupabase(toUpload, user.id);
        }

        setSettingsLoading(false);
      } catch (err) {
        console.error('[Settings] Unexpected error:', err);
        setSettingsLoading(false);
      }
    })();
    // We only want to re-run this when the logged-in user actually changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      setLocalSettings((prev) => {
        const newSettings = { ...prev, ...updates };
        if (user) saveToSupabase(newSettings, user.id);
        return newSettings;
      });
    },
    [setLocalSettings, user, saveToSupabase]
  );

  const resetSettings = useCallback(() => {
    setLocalSettings(DEFAULT_SETTINGS);
    if (user) saveToSupabase(DEFAULT_SETTINGS, user.id);
  }, [setLocalSettings, user, saveToSupabase]);

  const setVersion = useCallback(
    (version: 'trust' | 'secure') => {
      setLocalSettings((prev) => {
        const newSettings = {
          ...prev,
          version,
          autoLocation: version === 'secure' ? false : prev.autoLocation,
          apis:
            version === 'secure'
              ? { gmail: false, stripe: false, calendar: false, mapsTimeline: false }
              : prev.apis,
        };
        if (user) saveToSupabase(newSettings, user.id);
        return newSettings;
      });
    },
    [setLocalSettings, user, saveToSupabase]
  );

  const setActivityOrder = useCallback(
    (order: ActivityType[]) => {
      setLocalSettings((prev) => {
        const newSettings = { ...prev, activityOrder: order };
        if (user) saveToSupabase(newSettings, user.id);
        return newSettings;
      });
    },
    [setLocalSettings, user, saveToSupabase]
  );

  const toggleApi = useCallback(
    (api: keyof AppSettings['apis']) => {
      setLocalSettings((prev) => {
        const newSettings = {
          ...prev,
          apis: { ...prev.apis, [api]: !prev.apis[api] },
        };
        if (user) saveToSupabase(newSettings, user.id);
        return newSettings;
      });
    },
    [setLocalSettings, user, saveToSupabase]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings: localSettings,
        settingsLoading,
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
