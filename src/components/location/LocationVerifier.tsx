import React from 'react';
import { AutoDetectedLocation } from '../../types';
import Button from '../common/Button';

interface LocationVerifierProps {
  location: AutoDetectedLocation;
  onConfirm: () => void;
  onChange: () => void;
}

const LocationVerifier: React.FC<LocationVerifierProps> = ({
  location,
  onConfirm,
  onChange,
}) => {
  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'gps':
        return 'GPS';
      case 'wifi':
        return 'WiFi';
      case 'ip':
        return 'IP Address';
      case 'pattern':
        return 'Your patterns';
      default:
        return source;
    }
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High confidence';
    if (confidence >= 0.7) return 'Good confidence';
    if (confidence >= 0.5) return 'Medium confidence';
    return 'Low confidence';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-lg">{location.name}</p>
          <p className="text-sm text-gray-500">
            {getSourceLabel(location.source)} • {getConfidenceLabel(location.confidence)}
          </p>
        </div>
        {location.verified && (
          <span className="text-success">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </div>

      {!location.verified && (
        <div className="flex gap-2">
          <Button size="sm" onClick={onConfirm} className="flex-1">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Correct
          </Button>
          <Button size="sm" variant="secondary" onClick={onChange} className="flex-1">
            Change
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationVerifier;
