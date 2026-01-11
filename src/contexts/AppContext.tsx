import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../constants/config';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
  isOnboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isOnboardingComplete, setOnboardingComplete] = useLocalStorage<boolean>(
    STORAGE_KEYS.ONBOARDING_COMPLETE,
    false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        isOnboardingComplete,
        setOnboardingComplete,
        isLoading,
        setIsLoading,
        toasts,
        showToast,
        dismissToast,
        currentDate,
        setCurrentDate,
        isSettingsOpen,
        setIsSettingsOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
