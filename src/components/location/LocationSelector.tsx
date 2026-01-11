import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { LOCATIONS, TRIP_TYPES } from '../../constants/config';
import { Input, Select } from '../common/Input';
import Button from '../common/Button';

interface LocationSelectorProps {
  value: string;
  otherLocationName?: string;
  tripType?: 'business' | 'pleasure';
  onChange: (location: string, otherName?: string, tripType?: 'business' | 'pleasure') => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  otherLocationName,
  tripType,
  onChange,
}) => {
  const { settings } = useSettings();
  const [showOtherInput, setShowOtherInput] = useState(value === 'other');
  const [localOtherName, setLocalOtherName] = useState(otherLocationName || '');
  const [localTripType, setLocalTripType] = useState<'business' | 'pleasure' | undefined>(tripType);

  const handleLocationSelect = (locationId: string) => {
    if (locationId === 'other') {
      setShowOtherInput(true);
      onChange('other', localOtherName, localTripType);
    } else {
      setShowOtherInput(false);
      onChange(locationId);
    }
  };

  const handleOtherSave = () => {
    if (localOtherName.trim()) {
      onChange('other', localOtherName.trim(), localTripType);
    }
  };

  if (settings.locationStyle === 'dropdown') {
    return (
      <div className="space-y-3">
        <Select
          label="Location"
          options={LOCATIONS.map((loc) => ({
            value: loc.id,
            label: `${loc.icon} ${loc.name}`,
          }))}
          value={value}
          onChange={(e) => handleLocationSelect(e.target.value)}
          placeholder="Select location"
        />

        {showOtherInput && (
          <div className="space-y-3 pl-4 border-l-2 border-primary">
            <Input
              label="Location Name"
              value={localOtherName}
              onChange={(e) => setLocalOtherName(e.target.value)}
              placeholder="Enter location name"
            />
            <Select
              label="Trip Type"
              options={TRIP_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              value={localTripType || ''}
              onChange={(e) => setLocalTripType(e.target.value as 'business' | 'pleasure')}
              placeholder="Select trip type"
            />
            <Button size="sm" onClick={handleOtherSave}>
              Save Location
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Button style
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
      <div className="flex flex-wrap gap-2">
        {LOCATIONS.map((location) => (
          <button
            key={location.id}
            onClick={() => handleLocationSelect(location.id)}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              value === location.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{location.icon}</span>
            {location.name}
          </button>
        ))}
      </div>

      {showOtherInput && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
          <Input
            label="Location Name"
            value={localOtherName}
            onChange={(e) => setLocalOtherName(e.target.value)}
            placeholder="Where are you?"
          />
          <div className="flex gap-2">
            {TRIP_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setLocalTripType(type.value)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  localTripType === type.value
                    ? 'bg-secondary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={handleOtherSave} disabled={!localOtherName.trim()}>
            Confirm Location
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
