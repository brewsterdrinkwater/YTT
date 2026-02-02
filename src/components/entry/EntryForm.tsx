import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useEntries } from '../../contexts/EntriesContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useLocation as useLocationContext } from '../../contexts/LocationContext';
import { Entry, Activities, ActivityType, AutoDetectedLocation } from '../../types';
import DateNavigator from './DateNavigator';
import FeelingScale from './FeelingScale';
import ActivityTiles from './ActivityTiles';
import ActivityModal from './ActivityModal';
import LocationSelector from '../location/LocationSelector';
import AutoLocationDetector from '../location/AutoLocationDetector';
import CalendarQuickView from '../calendar/CalendarQuickView';
import { TextArea } from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  isComplete?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isComplete = false,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen && !isComplete);

  // Auto-collapse when marked as complete
  useEffect(() => {
    if (isComplete && isOpen) {
      setIsOpen(false);
    }
  }, [isComplete]);

  return (
    <Card className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span className="font-semibold">{title}</span>
          {isComplete && (
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Done
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </Card>
  );
};

const EntryForm: React.FC = () => {
  const { currentDate, showToast } = useApp();
  const { getOrCreateEntryForDate, saveEntry } = useEntries();
  const { settings } = useSettings();
  const { autoDetectedLocation } = useLocationContext();

  const [entry, setEntry] = useState<Entry | null>(null);
  const [activeActivity, setActiveActivity] = useState<ActivityType | null>(null);
  const [showAutoLocation, setShowAutoLocation] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Load entry for current date
  useEffect(() => {
    const existingEntry = getOrCreateEntryForDate(currentDate);
    setEntry(existingEntry);
    setHasChanges(false);
    setShowAutoLocation(settings.version === 'trust' && settings.autoLocation);
  }, [currentDate, getOrCreateEntryForDate, settings.version, settings.autoLocation]);

  const updateEntry = (updates: Partial<Entry>) => {
    if (entry) {
      setEntry({ ...entry, ...updates });
      setHasChanges(true);
    }
  };

  const handleLocationChange = (
    location: string,
    otherName?: string,
    tripType?: 'business' | 'pleasure'
  ) => {
    updateEntry({
      location,
      otherLocationName: otherName,
      tripType,
    });
  };

  const handleAutoLocationDetected = (location: AutoDetectedLocation) => {
    // Map the detected location to our location values
    const locationName = location.name.toLowerCase();
    let mappedLocation = 'other';

    if (locationName.includes('nashville')) {
      mappedLocation = 'nashville';
    } else if (locationName.includes('nyc') || locationName.includes('new york')) {
      mappedLocation = 'nyc';
    }

    updateEntry({
      location: mappedLocation,
      otherLocationName: mappedLocation === 'other' ? location.name : undefined,
      autoDetected: {
        location,
        activities: entry?.autoDetected?.activities || [],
      },
    });
    setShowAutoLocation(false);
  };

  const handleFeelingChange = (feeling: number) => {
    updateEntry({ feeling });
  };

  const handleActivitySave = (type: ActivityType, data: Activities[ActivityType]) => {
    if (entry) {
      updateEntry({
        activities: {
          ...entry.activities,
          [type]: data,
        },
      });
    }
    setActiveActivity(null);
  };

  const handleHighlightsChange = (highlights: string) => {
    updateEntry({ highlights });
  };

  const handleSave = () => {
    if (entry) {
      saveEntry(entry);
      setHasChanges(false);
      showToast('Entry saved!', 'success');
    }
  };

  if (!entry) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Check completion status for collapsible sections
  const isLocationComplete = entry.location !== '';
  const isFeelingComplete = entry.feeling > 0;
  const hasAnyActivity = Object.values(entry.activities).some(a => a !== undefined);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Date Navigation - Now at top below global search */}
      <DateNavigator />

      {/* Calendar Quick View */}
      {settings.apis.calendar && <CalendarQuickView date={currentDate} />}

      {/* Location Section - Collapsible */}
      <CollapsibleSection
        title="Where are you?"
        icon="📍"
        isComplete={isLocationComplete}
        defaultOpen={!isLocationComplete}
      >
        {/* Auto Location Detection */}
        {showAutoLocation && (
          <div className="mb-4">
            <AutoLocationDetector
              onLocationDetected={handleAutoLocationDetected}
              onSkip={() => setShowAutoLocation(false)}
            />
          </div>
        )}

        {/* Location Selector */}
        {!showAutoLocation && (
          <LocationSelector
            value={entry.location}
            otherLocationName={entry.otherLocationName}
            tripType={entry.tripType}
            onChange={handleLocationChange}
          />
        )}
      </CollapsibleSection>

      {/* Feeling Section - Collapsible */}
      <CollapsibleSection
        title="How are you feeling?"
        icon="😊"
        isComplete={isFeelingComplete}
        defaultOpen={!isFeelingComplete}
      >
        <FeelingScale value={entry.feeling} onChange={handleFeelingChange} />
      </CollapsibleSection>

      {/* Activities Section - Collapsible */}
      <CollapsibleSection
        title="What did you do today?"
        icon="📝"
        isComplete={hasAnyActivity}
        defaultOpen={!hasAnyActivity}
      >
        <ActivityTiles
          activities={entry.activities}
          onActivityClick={(type) => setActiveActivity(type)}
        />
      </CollapsibleSection>

      {/* Highlights Section - Collapsible */}
      <CollapsibleSection
        title="Highlights & Notes"
        icon="✨"
        isComplete={!!entry.highlights && entry.highlights.length > 0}
        defaultOpen={!entry.highlights}
      >
        <TextArea
          placeholder="What made today special? Any thoughts or reflections?"
          value={entry.highlights || ''}
          onChange={(e) => handleHighlightsChange(e.target.value)}
          rows={4}
        />
      </CollapsibleSection>

      {/* Save Button */}
      <div className="sticky bottom-20 md:bottom-4 bg-gray-50/80 backdrop-blur-sm py-4 -mx-4 px-4">
        <Button
          onClick={handleSave}
          className="w-full"
          disabled={!hasChanges}
        >
          {hasChanges ? 'Save Entry' : 'No Changes'}
        </Button>
      </div>

      {/* Activity Modal */}
      <ActivityModal
        isOpen={activeActivity !== null}
        onClose={() => setActiveActivity(null)}
        activityType={activeActivity}
        initialData={activeActivity ? entry.activities[activeActivity] : undefined}
        onSave={handleActivitySave}
      />
    </div>
  );
};

export default EntryForm;
