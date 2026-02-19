import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// Auto-save debounce delay in milliseconds
const AUTO_SAVE_DELAY = 1500;

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load entry for current date
  useEffect(() => {
    const existingEntry = getOrCreateEntryForDate(currentDate);
    setEntry(existingEntry);
    setHasChanges(false);
    setSaveStatus('idle');
    setShowAutoLocation(settings.version === 'trust' && settings.autoLocation);
  }, [currentDate, getOrCreateEntryForDate, settings.version, settings.autoLocation]);

  // Auto-save effect - saves after delay when entry changes
  useEffect(() => {
    if (!entry || !hasChanges) return;

    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveEntry(entry);
        setHasChanges(false);
        setSaveStatus('saved');
        // Reset status after a brief delay
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('idle');
        showToast('Failed to save entry. Please try again.', 'error');
        console.error('Auto-save failed:', error);
      }
    }, AUTO_SAVE_DELAY);

    // Cleanup on unmount or when entry changes
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [entry, hasChanges, saveEntry, showToast]);

  // Save immediately before navigating away using sendBeacon (reliable during unload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!entry || !hasChanges) return;

      // Cancel any pending auto-save
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      // Use sendBeacon for reliable delivery during page unload.
      // Supabase REST API: POST with Prefer: resolution=merge-duplicates for upsert.
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const authToken = localStorage.getItem('walt-tab-auth');
      let accessToken = supabaseKey; // fallback to anon key
      if (authToken) {
        try {
          const parsed = JSON.parse(authToken);
          if (parsed?.access_token) accessToken = parsed.access_token;
        } catch {
          // use fallback
        }
      }

      const dbFeeling = entry.feeling >= 1 && entry.feeling <= 10
        ? entry.feeling : 5;

      const dbEntry = {
        id: entry.id,
        date: entry.date.split('T')[0],
        location: entry.location || '',
        other_location_name: entry.otherLocationName || null,
        trip_type: entry.tripType || null,
        feeling: dbFeeling,
        highlights: entry.highlights || null,
        activities: entry.activities,
        auto_detected: entry.autoDetected || null,
      };

      const url = `${supabaseUrl}/rest/v1/entries?on_conflict=user_id,date`;
      const blob = new Blob([JSON.stringify(dbEntry)], { type: 'application/json' });

      // sendBeacon doesn't support custom headers, so we use fetch with keepalive instead
      // which is the modern equivalent and supports headers
      try {
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(dbEntry),
          keepalive: true, // ensures request survives page unload
        });
      } catch {
        // Last resort: try sendBeacon (no custom headers, may fail auth but worth trying)
        navigator.sendBeacon?.(url, blob);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [entry, hasChanges]);

  const updateEntry = (updates: Partial<Entry>) => {
    if (entry) {
      setEntry({ ...entry, ...updates });
      setHasChanges(true);
      setSaveStatus('idle');
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
    // Match detected location against user's custom locations
    const locationName = location.name.toLowerCase();
    const customLocations = settings.customLocations ?? [];
    let mappedLocation = 'other';

    for (const loc of customLocations) {
      if (loc.id !== 'other' && locationName.includes(loc.name.toLowerCase())) {
        mappedLocation = loc.id;
        break;
      }
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
      // Cancel any pending auto-save to prevent duplicate saves
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      setSaveStatus('saving');
      saveEntry(entry)
        .then(() => {
          setHasChanges(false);
          setSaveStatus('saved');
          showToast('Entry saved!', 'success');
          setTimeout(() => setSaveStatus('idle'), 2000);
        })
        .catch(() => {
          setSaveStatus('idle');
          showToast('Failed to save. Please try again.', 'error');
        });
    }
  };

  if (!entry) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Enabled fields from settings (with fallback for existing users)
  const entryFields = settings.entryFields ?? { location: true, feeling: true, activities: true, highlights: true };

  // Check completion status for collapsible sections
  const isLocationComplete = entry.location !== '';
  const isFeelingComplete = entry.feeling > 0;
  const hasAnyActivity = Object.values(entry.activities).some(a => a !== undefined);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Date Navigation - Now at top below global search */}
      <DateNavigator />

      {/* Calendar Quick View - Hidden on mobile */}
      {settings.apis.calendar && (
        <div className="hidden md:block">
          <CalendarQuickView date={currentDate} />
        </div>
      )}

      {/* Location Section - Collapsible */}
      {entryFields.location && (
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
      )}

      {/* Feeling Section - Collapsible */}
      {entryFields.feeling && (
        <CollapsibleSection
          title="How are you feeling?"
          icon="😊"
          isComplete={isFeelingComplete}
          defaultOpen={!isFeelingComplete}
        >
          <FeelingScale value={entry.feeling} onChange={handleFeelingChange} />
        </CollapsibleSection>
      )}

      {/* Activities Section - Collapsible */}
      {entryFields.activities && (
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
      )}

      {/* Highlights Section - Collapsible */}
      {entryFields.highlights && (
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
      )}

      {/* Save Status Indicator */}
      <div className="sticky bottom-20 md:bottom-4 bg-gray-50/80 backdrop-blur-sm py-4 -mx-4 px-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-2 text-green-600">
                <span>✓</span>
                Saved
              </span>
            )}
            {saveStatus === 'idle' && hasChanges && (
              <span className="text-amber-600">Unsaved changes</span>
            )}
            {saveStatus === 'idle' && !hasChanges && (
              <span className="text-gray-400">All changes saved</span>
            )}
          </span>
          <Button
            onClick={handleSave}
            size="sm"
            disabled={!hasChanges}
          >
            {hasChanges ? 'Save Now' : 'Saved'}
          </Button>
        </div>
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
