import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../../contexts/EntriesContext';
import Card from '../common/Card';
import Button from '../common/Button';

interface LocationCount {
  location: string;
  icon: string;
  days: number;
  color: string;
}

const LocationDaysCounter: React.FC = () => {
  const { entries } = useEntries();
  const navigate = useNavigate();

  const locationCounts = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const today = new Date();

    // Get all dates with entries this year
    const trackedDates = new Set<string>();

    // Filter entries for current year
    const yearEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= yearStart && entryDate <= today;
    });

    // Count unique days per location and track all dates
    const nashvilleDays = new Set<string>();
    const nycDays = new Set<string>();

    yearEntries.forEach((entry) => {
      const dateKey = entry.date.split('T')[0]; // Get YYYY-MM-DD
      trackedDates.add(dateKey);
      const loc = entry.location.toLowerCase();

      if (loc === 'nashville') {
        nashvilleDays.add(dateKey);
      } else if (loc === 'nyc' || loc === 'new york') {
        nycDays.add(dateKey);
      }
    });

    // Calculate days elapsed in current year
    const daysElapsed = Math.floor((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate untracked days
    const untrackedDays = daysElapsed - trackedDates.size;

    return {
      nashville: nashvilleDays.size,
      nyc: nycDays.size,
      daysElapsed,
      trackedDays: trackedDates.size,
      untrackedDays,
      year: currentYear,
    };
  }, [entries]);

  const locations: LocationCount[] = [
    {
      location: 'Nashville',
      icon: '🎸',
      days: locationCounts.nashville,
      color: 'tab-orange',
    },
    {
      location: 'NYC',
      icon: '🗽',
      days: locationCounts.nyc,
      color: 'tab-blue',
    },
  ];

  // Don't render if no entries
  if (entries.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 border-2 border-steel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span className="text-xl">📍</span> Days by Location
        </h3>
        <span className="text-xs text-slate font-medium">
          {locationCounts.year} • {locationCounts.daysElapsed} days elapsed
        </span>
      </div>

      <div className="space-y-4">
        {locations.map((loc) => {
          const percentage = Math.round((loc.days / 365) * 100);

          return (
            <div key={loc.location}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-semibold text-black">
                  <span className="text-xl">{loc.icon}</span>
                  {loc.location}
                </span>
                <span className="text-lg font-bold text-black">
                  {loc.days}
                  <span className="text-sm text-slate font-normal"> / 365 days</span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-3 bg-concrete rounded-full overflow-hidden">
                <div
                  className={`h-full bg-${loc.color} transition-all duration-500`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              <p className="text-xs text-slate mt-1 text-right">
                {percentage}% of year
              </p>
            </div>
          );
        })}
      </div>

      {/* Untracked Days */}
      {locationCounts.untrackedDays > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-steel">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-danger font-semibold">
                {locationCounts.untrackedDays} days missing
              </span>
              <p className="text-xs text-slate">
                {locationCounts.trackedDays} of {locationCounts.daysElapsed} days tracked
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/missing-days')}
            >
              Fill in →
            </Button>
          </div>
        </div>
      )}

      {locationCounts.untrackedDays === 0 && locationCounts.trackedDays > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-steel">
          <div className="flex items-center gap-2 text-success font-semibold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            All {locationCounts.trackedDays} days tracked!
          </div>
        </div>
      )}
    </Card>
  );
};

export default LocationDaysCounter;
