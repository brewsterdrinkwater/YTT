import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../../contexts/EntriesContext';
import { useApp } from '../../contexts/AppContext';
import { LOCATIONS } from '../../constants/config';
import Card from '../common/Card';
import Button from '../common/Button';

interface MissingDay {
  date: Date;
  dateKey: string;
  displayDate: string;
}

const MissingDaysPage: React.FC = () => {
  const { entries, getOrCreateEntryForDate, updateEntry } = useEntries();
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [saving, setSaving] = useState<string | null>(null);

  const missingDays = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all tracked dates
    const trackedDates = new Set<string>();
    entries.forEach((entry) => {
      const entryDate = new Date(entry.date);
      if (entryDate >= yearStart && entryDate <= today) {
        trackedDates.add(entry.date.split('T')[0]);
      }
    });

    // Find missing days
    const missing: MissingDay[] = [];
    const current = new Date(yearStart);

    while (current <= today) {
      const dateKey = current.toISOString().split('T')[0];
      if (!trackedDates.has(dateKey)) {
        missing.push({
          date: new Date(current),
          dateKey,
          displayDate: current.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
        });
      }
      current.setDate(current.getDate() + 1);
    }

    // Return most recent first
    return missing.reverse();
  }, [entries]);

  const handleSetLocation = async (day: MissingDay, location: string) => {
    setSaving(day.dateKey);

    try {
      // Create or get entry for this date
      const entry = getOrCreateEntryForDate(day.date);

      // Update with location
      updateEntry(entry.id, {
        location,
        feeling: 5, // Default feeling
      });

      showToast(`Set ${day.displayDate} to ${location}`, 'success');
    } catch (error) {
      showToast('Failed to save', 'error');
    }

    setSaving(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b-2 border-black z-10 px-4 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-concrete rounded-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-black">Missing Days</h1>
            <p className="text-sm text-slate">
              {missingDays.length} days need location info
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {missingDays.length === 0 ? (
          <Card className="text-center py-12">
            <span className="text-4xl mb-4 block">🎉</span>
            <h2 className="text-xl font-semibold mb-2">All Caught Up!</h2>
            <p className="text-slate mb-4">You've tracked every day this year.</p>
            <Button onClick={() => navigate('/dashboard')} variant="primary">
              Back to Dashboard
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {missingDays.map((day) => (
              <Card key={day.dateKey} className="border-2 border-steel">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-black">{day.displayDate}</p>
                    <p className="text-xs text-slate">{day.dateKey}</p>
                  </div>

                  <div className="flex gap-2">
                    {LOCATIONS.filter((loc) => loc.id !== 'other').map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => handleSetLocation(day, loc.name)}
                        disabled={saving === day.dateKey}
                        className={`px-4 py-2 rounded-sm font-semibold text-sm border-2 transition-all ${
                          saving === day.dateKey
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:border-black hover:bg-concrete'
                        } ${
                          loc.id === 'nashville'
                            ? 'border-tab-orange/50 text-tab-orange'
                            : 'border-tab-blue/50 text-tab-blue'
                        }`}
                      >
                        {loc.icon} {loc.name}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Fill Section */}
        {missingDays.length > 5 && (
          <Card className="mt-6 border-2 border-charcoal bg-concrete">
            <h3 className="font-bold text-black mb-3">Quick Fill</h3>
            <p className="text-sm text-slate mb-4">
              Set multiple days at once. This will apply to all {missingDays.length} missing days.
            </p>
            <div className="flex gap-3">
              {LOCATIONS.filter((loc) => loc.id !== 'other').map((loc) => (
                <Button
                  key={loc.id}
                  variant="secondary"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Set all ${missingDays.length} missing days to ${loc.name}?`
                      )
                    ) {
                      missingDays.forEach((day) => handleSetLocation(day, loc.name));
                    }
                  }}
                >
                  All {loc.icon} {loc.name}
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MissingDaysPage;
