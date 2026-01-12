import React, { useEffect, useState } from 'react';
import { useLocation } from '../../contexts/LocationContext';
import { useSettings } from '../../contexts/SettingsContext';
import { AutoDetectedLocation } from '../../types';
import Button from '../common/Button';

interface AutoLocationDetectorProps {
  onLocationDetected: (location: AutoDetectedLocation) => void;
  onSkip: () => void;
}

const AutoLocationDetector: React.FC<AutoLocationDetectorProps> = ({
  onLocationDetected,
  onSkip,
}) => {
  const { settings } = useSettings();
  const {
    autoDetectedLocation,
    isDetecting,
    detectionError,
    setAutoDetectedLocation,
    setIsDetecting,
    setDetectionError,
  } = useLocation();
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    if (settings.version === 'trust' && settings.autoLocation) {
      detectLocation();
    }
  }, []);

  const detectLocation = async () => {
    setIsDetecting(true);
    setDetectionError(null);

    try {
      // Try GPS first
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get city name
      const cityName = await reverseGeocode(latitude, longitude);

      const detectedLocation: AutoDetectedLocation = {
        name: cityName,
        coords: { latitude, longitude },
        source: 'gps',
        confidence: 0.9,
        verified: false,
        timestamp: new Date().toISOString(),
      };

      setAutoDetectedLocation(detectedLocation);
      setShowVerification(true);
    } catch (error) {
      console.error('Location detection failed:', error);
      setDetectionError('Unable to detect location. Please select manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // For demo purposes, return a placeholder
    // In production, you would call Google Geocoding API here
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check known locations based on rough coordinates
      if (lat > 35.9 && lat < 36.3 && lng > -87 && lng < -86.5) {
        return 'Nashville';
      }
      if (lat > 40.5 && lat < 41 && lng > -74.5 && lng < -73.5) {
        return 'NYC';
      }

      return 'Unknown Location';
    } catch {
      return 'Unknown Location';
    }
  };

  const handleConfirm = () => {
    if (autoDetectedLocation) {
      const verified = { ...autoDetectedLocation, verified: true };
      setAutoDetectedLocation(verified);
      onLocationDetected(verified);
    }
  };

  const handleChange = () => {
    setShowVerification(false);
    onSkip();
  };

  if (!settings.autoLocation || settings.version !== 'trust') {
    return null;
  }

  if (isDetecting) {
    return (
      <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
        <span className="text-gray-600">Detecting location...</span>
      </div>
    );
  }

  if (detectionError) {
    return (
      <div className="bg-yellow-50 rounded-xl p-4">
        <p className="text-yellow-800 text-sm mb-2">{detectionError}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={detectLocation}>
            Try Again
          </Button>
          <Button size="sm" variant="ghost" onClick={onSkip}>
            Enter Manually
          </Button>
        </div>
      </div>
    );
  }

  if (showVerification && autoDetectedLocation) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📍</span>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{autoDetectedLocation.name}</p>
            <p className="text-sm text-gray-500">
              Detected via {autoDetectedLocation.source.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleConfirm}>
            Correct
          </Button>
          <Button size="sm" variant="secondary" onClick={handleChange}>
            Change
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default AutoLocationDetector;
