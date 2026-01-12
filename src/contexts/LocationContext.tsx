import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AutoDetectedLocation } from '../types';

interface LocationContextType {
  autoDetectedLocation: AutoDetectedLocation | null;
  isDetecting: boolean;
  detectionError: string | null;
  setAutoDetectedLocation: (location: AutoDetectedLocation | null) => void;
  setIsDetecting: (detecting: boolean) => void;
  setDetectionError: (error: string | null) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [autoDetectedLocation, setAutoDetectedLocation] = useState<AutoDetectedLocation | null>(
    null
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  const clearLocation = useCallback(() => {
    setAutoDetectedLocation(null);
    setDetectionError(null);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        autoDetectedLocation,
        isDetecting,
        detectionError,
        setAutoDetectedLocation,
        setIsDetecting,
        setDetectionError,
        clearLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default LocationContext;
