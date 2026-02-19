import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { EntryFieldType, CustomLocation } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input } from '../common/Input';

// Common emoji options for locations
const LOCATION_ICONS = ['🏠', '🏢', '🌆', '🏖️', '🏔️', '🎸', '🗽', '🌍', '✈️', '🏡'];

const ENTRY_FIELD_OPTIONS: { key: EntryFieldType; label: string; icon: string; description: string }[] = [
  { key: 'location', label: 'Location', icon: '📍', description: 'Track where you are each day' },
  { key: 'feeling', label: 'Mood', icon: '😊', description: 'Rate how you feel (1-10)' },
  { key: 'activities', label: 'Activities', icon: '📝', description: 'Log workouts, travel, meals, etc.' },
  { key: 'highlights', label: 'Highlights', icon: '✨', description: 'Write notes and reflections' },
];

const CheckIcon: React.FC = () => (
  <svg className="w-4 h-4 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

type OnboardingStep = 'version' | 'customize';

const VersionSelector: React.FC = () => {
  const { setOnboardingComplete } = useApp();
  const { setVersion, updateSettings } = useSettings();

  const [step, setStep] = useState<OnboardingStep>('version');

  // Customization state
  const [entryFields, setEntryFields] = useState<Record<EntryFieldType, boolean>>({
    location: true,
    feeling: true,
    activities: true,
    highlights: true,
  });
  const [locations, setLocations] = useState<CustomLocation[]>([]);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationIcon, setNewLocationIcon] = useState('🏠');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleVersionSelect = (version: 'trust' | 'secure') => {
    setVersion(version);
    setStep('customize');
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) return;
    const id = newLocationName.trim().toLowerCase().replace(/\s+/g, '-');
    setLocations([...locations, { id, name: newLocationName.trim(), icon: newLocationIcon }]);
    setNewLocationName('');
    setNewLocationIcon('🏠');
    setShowIconPicker(false);
  };

  const handleRemoveLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const toggleField = (field: EntryFieldType) => {
    setEntryFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFinish = () => {
    updateSettings({
      entryFields,
      customLocations: locations,
    });
    setOnboardingComplete(true);
  };

  // Step 1: Version Selection
  if (step === 'version') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Welcome to Walt-Tab
            </h1>
            <p className="text-xl text-gray-600">Your personal life dashboard</p>
            <p className="text-gray-500 mt-4">
              Track your life, your way. Choose how you want to use Walt-Tab.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card
              className="hover:border-primary border-2 border-transparent transition-all cursor-pointer group"
              onClick={() => handleVersionSelect('trust')}
              hover
            >
              <div className="text-center">
                <span className="text-5xl mb-4 block">🤖</span>
                <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  "I Trust You Bro"
                </h2>
                <p className="text-sm text-gray-500 mb-4">Automated convenience</p>
                <ul className="text-left text-sm space-y-2 text-gray-600">
                  {['Auto-detect location via GPS/WiFi', 'Sync with Google Calendar', 'Parse Gmail for activities', 'Import Stripe transactions'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card
              className="hover:border-secondary border-2 border-transparent transition-all cursor-pointer group"
              onClick={() => handleVersionSelect('secure')}
              hover
            >
              <div className="text-center">
                <span className="text-5xl mb-4 block">🔒</span>
                <h2 className="text-xl font-bold mb-2 group-hover:text-secondary transition-colors">
                  "Secure & Private"
                </h2>
                <p className="text-sm text-gray-500 mb-4">Complete privacy control</p>
                <ul className="text-left text-sm space-y-2 text-gray-600">
                  {['All data stored locally', 'No external API connections', 'Manual entry for full control', 'Export anytime as CSV'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          <p className="text-center text-sm text-gray-400">
            Don't worry, you can change this later in Settings
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Customize Entry Fields & Locations
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-black mb-2">Customize Your Journal</h1>
          <p className="text-gray-500">
            Choose what you want to track. You can always change this in Settings.
          </p>
        </div>

        {/* Entry Fields Selection */}
        <Card className="mb-6">
          <h3 className="font-bold text-black mb-4">What do you want to track?</h3>
          <div className="space-y-2">
            {ENTRY_FIELD_OPTIONS.map((field) => (
              <button
                key={field.key}
                onClick={() => toggleField(field.key)}
                className={`w-full p-3 rounded-sm border-2 flex items-center gap-3 transition-all text-left ${
                  entryFields[field.key]
                    ? 'border-black bg-black/5'
                    : 'border-steel hover:border-charcoal'
                }`}
              >
                <span className="text-xl">{field.icon}</span>
                <div className="flex-1">
                  <span className="font-semibold text-black block">{field.label}</span>
                  <span className="text-xs text-slate">{field.description}</span>
                </div>
                <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-colors ${
                  entryFields[field.key] ? 'bg-black border-black' : 'border-steel'
                }`}>
                  {entryFields[field.key] && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Locations Setup (only if location field is enabled) */}
        {entryFields.location && (
          <Card className="mb-6">
            <h3 className="font-bold text-black mb-2">Your Locations</h3>
            <p className="text-xs text-slate mb-4">
              Add places you frequent. "Other" is always available for one-offs.
            </p>

            {/* Added locations */}
            {locations.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {locations.map((loc) => (
                  <span
                    key={loc.id}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-concrete rounded-sm border border-steel"
                  >
                    <span>{loc.icon}</span>
                    <span className="font-medium text-sm">{loc.name}</span>
                    <button
                      onClick={() => handleRemoveLocation(loc.id)}
                      className="ml-1 text-slate hover:text-danger transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add new location */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-12 h-12 border-2 border-steel rounded-sm flex items-center justify-center text-xl hover:border-black transition-colors flex-shrink-0"
                >
                  {newLocationIcon}
                </button>
                <Input
                  placeholder="e.g., Home, Office, Mom's house"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                  className="flex-1 !mb-0"
                />
                <Button
                  onClick={handleAddLocation}
                  disabled={!newLocationName.trim()}
                  size="sm"
                >
                  Add
                </Button>
              </div>

              {showIconPicker && (
                <div className="flex flex-wrap gap-2 p-2 bg-concrete rounded-sm border border-steel">
                  {LOCATION_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => { setNewLocationIcon(icon); setShowIconPicker(false); }}
                      className={`w-10 h-10 rounded-sm flex items-center justify-center text-xl hover:bg-steel transition-colors ${
                        newLocationIcon === icon ? 'bg-steel' : ''
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setStep('version')}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            variant="primary"
            onClick={handleFinish}
            className="flex-1"
          >
            Get Started
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          You can always change these in Settings later
        </p>
      </div>
    </div>
  );
};

export default VersionSelector;
