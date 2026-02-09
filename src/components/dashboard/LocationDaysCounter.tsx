import React, { useMemo } from 'react';
import { useEntries } from '../../contexts/EntriesContext';
import Card from '../common/Card';

interface LocationCount {
  location: string;
  icon: string;
  days: number;
  color: string;
}

const LocationDaysCounter: React.FC = () => {
  const { entries } = useEntries();

  const locationCounts = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const today = new Date();

    // Filter entries for current year
    const yearEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= yearStart && entryDate <= today;
    });

    // Count unique days per location
    const nashvilleDays = new Set<string>();
    const nycDays = new Set<string>();

    yearEntries.forEach((entry) => {
      const dateKey = entry.date.split('T')[0]; // Get YYYY-MM-DD
      const loc = entry.location.toLowerCase();

      if (loc === 'nashville') {
        nashvilleDays.add(dateKey);
      } else if (loc === 'nyc' || loc === 'new york') {
        nycDays.add(dateKey);
      }
    });

    // Calculate days elapsed in current year
    const daysElapsed = Math.floor((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      nashville: nashvilleDays.size,
      nyc: nycDays.size,
      daysElapsed,
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

      {/* Total check */}
      {locationCounts.nashville + locationCounts.nyc > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-steel">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate">Days tracked this year:</span>
            <span className="font-bold text-black">
              {locationCounts.nashville + locationCounts.nyc} days
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LocationDaysCounter;
